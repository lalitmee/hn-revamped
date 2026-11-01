import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
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

function openVoiceDropdown() {
  fireEvent.click(screen.getByRole('button', { name: 'Listen to article' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Select speech synthesis voice' })
  );
}

beforeEach(() => {
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
    getVoices: () => [],
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    speak: vi.fn(),
  });
});

afterEach(() => {
  sessionStorage.clear();
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
  expect(workers).toHaveLength(0);
  openVoiceDropdown();
  expect(workers).toHaveLength(0);
  fireEvent.click(screen.getByRole('option', { name: new RegExp(voice) }));
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

it('shows voice-loading errors in the status area', () => {
  const { unmount } = render(<ArticleReaderView url={URL} storyTitle="Test" />);
  openVoiceDropdown();
  fireEvent.click(screen.getByRole('option', { name: /Kokoro: Heart/ }));
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
    screen.getByRole('option', { name: new RegExp(visible) })
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
