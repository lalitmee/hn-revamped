import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import '@testing-library/jest-dom';
import { ArticleReaderView } from '../ArticleReaderView';
import { TTS_FLAGS } from '@/lib/tts-flags';

const URL = 'https://example.com/article';
const workers: Array<{
  url: string;
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  onmessage?: (event: MessageEvent) => void;
}> = [];

function openPreferences() {
  fireEvent.click(screen.getByRole('button', { name: 'Voice preferences' }));
}

function openVoiceDropdown() {
  fireEvent.click(screen.getByRole('button', { name: 'Listen to article' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Select speech synthesis voice' })
  );
}

beforeEach(() => {
  localStorage.clear();
  workers.length = 0;
  sessionStorage.setItem(
    `hn_reader_${URL}`,
    JSON.stringify({
      url: URL,
      title: 'Test',
      contentHtml: '<p>First paragraph for speech.</p>',
      textContent: 'First paragraph for speech.',
      readingTimeMinutes: 1,
    })
  );
  vi.stubGlobal(
    'Worker',
    class {
      postMessage = vi.fn();
      terminate = vi.fn();
      onmessage?: (event: MessageEvent) => void;
      url: string;
      constructor(url: string | URL) {
        this.url = url.toString();
        workers.push(this);
      }
    }
  );
  vi.stubGlobal(
    'AudioContext',
    class {
      resume = vi.fn();
      close = vi.fn();
      createBuffer = vi.fn(() => ({ copyToChannel: vi.fn() }));
      createBufferSource = vi.fn(() => ({
        playbackRate: { value: 1 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      }));
    }
  );
  vi.stubGlobal('SpeechSynthesisUtterance', class {});
  vi.stubGlobal('speechSynthesis', {
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: () => [],
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    speak: vi.fn(),
  });
});

afterEach(() => {
  vi.useRealTimers();
  sessionStorage.clear();
  localStorage.clear();
  Object.assign(TTS_FLAGS, { piper: true, kokoro: true, supertonic: true });
  vi.unstubAllGlobals();
});

it('shows loading immediately instead of the original-article fallback', () => {
  sessionStorage.removeItem(`hn_reader_${URL}`);
  const html = renderToString(
    <ArticleReaderView url={URL} storyTitle="Test" />
  );
  expect(html).toContain('animate-pulse');
  expect(html).not.toContain('Open Original Article');
});

it.each([
  ['Piper: Lessac', '/tts-workers/piper.js', 'en_US-lessac-medium'],
  ['Kokoro: Heart', '/tts-workers/kokoro.js', 'af_heart'],
  ['Supertonic: F1', '/tts-workers/supertonic.js', 'F1'],
])('loads only %s after selection', async (voice, workerFile, voiceId) => {
  const { container, unmount } = render(
    <ArticleReaderView url={URL} storyTitle="Test" />
  );
  const stickyControls = container.querySelector('.sticky.top-0');
  expect(stickyControls).toBeInTheDocument();
  expect(stickyControls).toContainElement(screen.getByText('1 min read'));
  expect(stickyControls).toContainElement(
    screen.getByRole('button', { name: 'Listen to article' })
  );
  expect(
    stickyControls?.querySelector('[data-testid="reader-playback-controls"]')
  ).toHaveClass('shrink-0', 'justify-end');
  expect(
    stickyControls?.querySelector('[data-testid="reader-playback-controls"]')
      ?.parentElement
  ).toHaveClass('shrink-0');
  expect(workers).toHaveLength(0);
  openVoiceDropdown();
  expect(workers).toHaveLength(0);
  fireEvent.click(
    within(screen.getByRole('listbox')).getByRole('option', {
      name: new RegExp(voice),
    })
  );
  expect(workers).toHaveLength(1);
  expect(workers[0].url).toContain(workerFile);
  expect(workers[0].postMessage).toHaveBeenCalledWith({
    type: 'load',
    id: 0,
    voice: voiceId,
  });
  expect(screen.getByRole('status')).toHaveTextContent(/Loading .* voice/);
  act(() => {
    workers[0].onmessage?.({ data: { type: 'ready', id: 0 } } as MessageEvent);
  });
  expect(screen.getByRole('status')).toHaveTextContent('Preparing speech…');
  await act(async () => {
    workers[0].onmessage?.({
      data: {
        type: 'audio',
        id: 1,
        audio: new Float32Array([0.1, 0.2]),
        samplingRate: 22050,
      },
    } as MessageEvent);
    await Promise.resolve();
  });
  expect(screen.getByRole('status')).toHaveTextContent(
    'Speaking paragraph 1 of 2'
  );
  expect(stickyControls).toContainElement(screen.getByRole('status'));
  unmount();
  expect(workers[0].terminate).toHaveBeenCalled();
});

it('remembers the preferred local voice without loading it on the next visit', () => {
  const first = render(<ArticleReaderView url={URL} storyTitle="Test" />);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(
    screen.queryByText('Preferred voice · saved in this browser')
  ).toBeNull();
  openPreferences();
  fireEvent.click(screen.getByRole('button', { name: 'Kokoro: Heart' }));
  expect(workers).toHaveLength(0);
  first.unmount();
  const second = render(<ArticleReaderView url={URL} storyTitle="Test" />);
  openPreferences();
  expect(screen.getByRole('button', { name: 'Kokoro: Heart' })).toHaveAttribute(
    'aria-current',
    'true'
  );
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(workers).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Listen to article' }));
  expect(workers).toHaveLength(1);
  expect(workers[0].url).toContain('kokoro.js');
  second.unmount();
});

it('opens themed voice settings from the toolbar on mobile', () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query === '(max-width: 639px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
  const { container, unmount } = render(
    <ArticleReaderView url={URL} storyTitle="Test" />
  );
  const trigger = screen.getByRole('button', { name: 'Voice preferences' });
  expect(container.querySelector('.sticky.top-0')).toContainElement(trigger);
  openPreferences();
  const dialog = screen.getByRole('dialog', { name: 'Voice preferences' });
  expect(dialog).toHaveClass('liquid-glass-modal');
  expect(dialog).toContainElement(screen.getByRole('switch'));
  fireEvent.click(screen.getByRole('button', { name: 'Kokoro: Heart' }));
  expect(workers).toHaveLength(0);
  expect(screen.getByRole('button', { name: 'Kokoro: Heart' })).toHaveAttribute(
    'aria-current',
    'true'
  );
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(trigger).toHaveFocus();
  unmount();
});

it('preloads only after opting in, restores that choice, and never generates speech', () => {
  const first = render(<ArticleReaderView url={URL} storyTitle="Test" />);
  openPreferences();
  const checkbox = screen.getByRole('switch', {
    name: /Preload my preferred voice/,
  });
  expect(checkbox).not.toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Piper: Lessac' }));
  expect(workers).toHaveLength(0);
  fireEvent.click(checkbox);
  expect(workers).toHaveLength(1);
  expect(workers[0].postMessage).toHaveBeenCalledTimes(1);
  expect(workers[0].postMessage).toHaveBeenCalledWith({
    type: 'load',
    id: 0,
    voice: 'en_US-lessac-medium',
  });
  expect(
    screen.getByRole('button', { name: 'Listen to article' })
  ).toBeInTheDocument();
  first.unmount();
  expect(workers[0].terminate).toHaveBeenCalled();
  const second = render(<ArticleReaderView url={URL} storyTitle="Test" />);
  openPreferences();
  expect(screen.getByLabelText(/Preload my preferred voice/)).toBeChecked();
  expect(workers).toHaveLength(2);
  expect(workers[1].postMessage).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByLabelText(/Preload my preferred voice/));
  expect(workers[1].terminate).toHaveBeenCalled();
  second.unmount();
});

it.each(['kokoro:af_heart', 'kokoro:not-a-voice', 'missing-system-voice'])(
  'falls back safely for disabled or unavailable voice %s',
  (voice) => {
    Object.assign(TTS_FLAGS, { kokoro: false });
    localStorage.setItem(
      'hn_revamped_reader_voice_v1',
      JSON.stringify({ voice, preload: true })
    );
    const { unmount } = render(
      <ArticleReaderView url={URL} storyTitle="Test" />
    );
    openPreferences();
    expect(
      screen.getByRole('button', { name: 'System: Default' })
    ).toHaveAttribute('aria-current', 'true');
    expect(workers).toHaveLength(0);
    unmount();
  }
);

it('restores a system voice even when native voices arrive asynchronously', () => {
  localStorage.setItem(
    'hn_revamped_reader_voice_v1',
    JSON.stringify({ voice: 'native-saved', preload: true })
  );
  const { unmount } = render(<ArticleReaderView url={URL} storyTitle="Test" />);
  const updateVoices = vi.mocked(window.speechSynthesis.addEventListener).mock
    .calls[0][1] as () => void;
  window.speechSynthesis.getVoices = () =>
    [
      { voiceURI: 'native-saved', name: 'Saved', lang: 'en-US' },
    ] as SpeechSynthesisVoice[];
  act(() => updateVoices());
  openPreferences();
  expect(screen.getByRole('button', { name: 'System: Saved' })).toHaveAttribute(
    'aria-current',
    'true'
  );
  expect(workers).toHaveLength(0);
  unmount();
});

it('keeps playback first and retains controls for the stop animation', () => {
  vi.useFakeTimers();
  const { unmount } = render(<ArticleReaderView url={URL} storyTitle="Test" />);
  const controls = screen.getByTestId('reader-playback-controls');
  const listen = screen.getByRole('button', { name: 'Listen to article' });
  expect(controls.querySelector('button')).toBe(listen);
  expect(listen).not.toHaveClass('order-last');
  expect(controls).toHaveAttribute('data-motion', 'idle');
  fireEvent.click(listen);
  expect(controls).toHaveAttribute('data-motion', 'expanded');
  fireEvent.click(screen.getByRole('button', { name: 'Pause reading aloud' }));
  expect(controls).toHaveAttribute('data-motion', 'expanded');
  fireEvent.click(screen.getByRole('button', { name: 'Stop audio reader' }));
  expect(controls).toHaveAttribute('data-motion', 'collapsing');
  expect(listen).toHaveFocus();
  expect(
    screen.getByRole('button', { name: 'Stop audio reader' }).parentElement
  ).toHaveAttribute('inert');
  act(() => vi.advanceTimersByTime(240));
  expect(controls).toHaveAttribute('data-motion', 'idle');
  expect(
    screen.queryByRole('button', { name: 'Stop audio reader' })
  ).toBeNull();
  unmount();
  vi.useRealTimers();
});

it('moves the actual controls together and reverses their travel on stop', () => {
  const cancel = vi.fn();
  const animate = vi.fn(() => ({ cancel }));
  const originalAnimate = HTMLElement.prototype.animate;
  HTMLElement.prototype.animate = animate as unknown as typeof originalAnimate;
  const boundsMock = vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      const right =
        this.dataset.testid === 'reader-playback-controls' ? 400 : 136;
      return {
        x: right - 36,
        y: 0,
        left: right - 36,
        right,
        top: 0,
        bottom: 36,
        width: 36,
        height: 36,
        toJSON: () => ({}),
      };
    });
  const { unmount } = render(<ArticleReaderView url={URL} storyTitle="Test" />);
  fireEvent.click(screen.getByRole('button', { name: 'Listen to article' }));
  expect(animate).toHaveBeenCalledWith(
    [
      { transform: 'translateX(264px)', opacity: 1 },
      { transform: 'translateX(0)', opacity: 1 },
    ],
    expect.objectContaining({ duration: 240 })
  );
  const callsAfterStart = animate.mock.calls.length;
  fireEvent.click(screen.getByRole('button', { name: 'Pause reading aloud' }));
  expect(animate).toHaveBeenCalledTimes(callsAfterStart);
  fireEvent.click(screen.getByRole('button', { name: 'Stop audio reader' }));
  expect(animate).toHaveBeenCalledWith(
    [
      { transform: 'translateX(0)', opacity: 1 },
      { transform: 'translateX(264px)', opacity: 1 },
    ],
    expect.objectContaining({ duration: 240 })
  );
  unmount();
  expect(cancel).toHaveBeenCalled();
  if (originalAnimate) HTMLElement.prototype.animate = originalAnimate;
  else Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  boundsMock.mockRestore();
});

it('skips the stop animation when reduced motion is preferred', () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true }))
  );
  const { unmount } = render(<ArticleReaderView url={URL} storyTitle="Test" />);
  fireEvent.click(screen.getByRole('button', { name: 'Listen to article' }));
  fireEvent.click(screen.getByRole('button', { name: 'Stop audio reader' }));
  expect(screen.getByTestId('reader-playback-controls')).toHaveAttribute(
    'data-motion',
    'idle'
  );
  expect(
    screen.queryByRole('button', { name: 'Stop audio reader' })
  ).toBeNull();
  unmount();
});

it('shows voice-loading errors in the status area', () => {
  const { unmount } = render(<ArticleReaderView url={URL} storyTitle="Test" />);
  openVoiceDropdown();
  fireEvent.click(
    within(screen.getByRole('listbox')).getByRole('option', {
      name: /Kokoro: Heart/,
    })
  );
  act(() => {
    workers[0].onmessage?.({
      data: { type: 'error', id: 0, message: 'Download failed.' },
    } as MessageEvent);
  });
  expect(screen.getByRole('status')).toHaveTextContent(
    'Could not load Kokoro voice: Download failed.'
  );
  unmount();
});

it.each([
  ['piper', 'Piper: Lessac', 'Kokoro: Heart'],
  ['kokoro', 'Kokoro: Heart', 'Supertonic: F1'],
  ['supertonic', 'Supertonic: F1', 'Piper: Lessac'],
] as const)('hides only the disabled %s voice', (engine, hidden, visible) => {
  Object.assign(TTS_FLAGS, { [engine]: false });
  const { unmount } = render(<ArticleReaderView url={URL} storyTitle="Test" />);
  openVoiceDropdown();
  expect(screen.queryByRole('option', { name: new RegExp(hidden) })).toBeNull();
  expect(
    within(screen.getByRole('listbox')).getByRole('option', {
      name: new RegExp(visible),
    })
  ).toBeInTheDocument();
  expect(workers).toHaveLength(0);
  unmount();
});

it('hides disabled engines and never starts their workers', () => {
  Object.assign(TTS_FLAGS, { piper: false, kokoro: false, supertonic: false });
  const { unmount } = render(<ArticleReaderView url={URL} storyTitle="Test" />);
  fireEvent.click(screen.getByRole('button', { name: 'Listen to article' }));
  expect(
    screen.queryByRole('button', { name: 'Select speech synthesis voice' })
  ).toBeNull();
  expect(workers).toHaveLength(0);
  unmount();
});
