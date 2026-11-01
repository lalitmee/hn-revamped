const STORAGE_KEY = 'hn_revamped_reader_voice_v1';

export interface ReaderVoicePreferences {
  voice: string;
  preload: boolean;
}

export function loadReaderVoicePreferences(): ReaderVoicePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? 'null'
    );
    if (!value || typeof value.voice !== 'string') return null;
    return { voice: value.voice, preload: value.preload === true };
  } catch {
    return null;
  }
}

export function saveReaderVoicePreferences(
  preferences: ReaderVoicePreferences
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Preferences are optional; unavailable storage must not prevent playback.
  }
}
