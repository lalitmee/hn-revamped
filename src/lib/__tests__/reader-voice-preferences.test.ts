import { afterEach, expect, it, vi } from 'vitest';
import {
  loadReaderVoicePreferences,
  saveReaderVoicePreferences,
} from '../reader-voice-preferences';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

it('defaults to no saved preference and preserves an explicit system default', () => {
  localStorage.clear();
  expect(loadReaderVoicePreferences()).toBeNull();
  saveReaderVoicePreferences({ voice: '', preload: false });
  expect(loadReaderVoicePreferences()).toEqual({ voice: '', preload: false });
});

it('round-trips voice selection and preload consent', () => {
  saveReaderVoicePreferences({ voice: 'supertonic:F1', preload: true });
  expect(loadReaderVoicePreferences()).toEqual({
    voice: 'supertonic:F1',
    preload: true,
  });
});

it.each(['{', 'null', '[]', '{"voice":42}'])(
  'ignores malformed preference %s',
  (value) => {
    localStorage.setItem('hn_revamped_reader_voice_v1', value);
    expect(loadReaderVoicePreferences()).toBeNull();
  }
);

it('requires explicit boolean consent for preloading', () => {
  localStorage.setItem(
    'hn_revamped_reader_voice_v1',
    '{"voice":"kokoro:af_heart","preload":"true"}'
  );
  expect(loadReaderVoicePreferences()).toEqual({
    voice: 'kokoro:af_heart',
    preload: false,
  });
});

it('does not throw when browser storage is blocked', () => {
  const storage = vi
    .spyOn(window, 'localStorage', 'get')
    .mockImplementation(() => {
      throw new DOMException('Storage blocked', 'SecurityError');
    });
  expect(loadReaderVoicePreferences()).toBeNull();
  expect(() =>
    saveReaderVoicePreferences({ voice: 'kokoro:af_heart', preload: true })
  ).not.toThrow();
  storage.mockRestore();
});
