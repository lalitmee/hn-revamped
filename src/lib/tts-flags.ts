// NEXT_PUBLIC_ values are inlined by Next.js at build time. Set any flag to
// "false" in the production build environment, then rebuild and redeploy.
// Keeping these as direct property accesses permits build-time dead-code removal.
export const TTS_FLAGS = {
  piper: process.env.NEXT_PUBLIC_ENABLE_PIPER_TTS !== 'false',
  kokoro: process.env.NEXT_PUBLIC_ENABLE_KOKORO_TTS !== 'false',
  supertonic: process.env.NEXT_PUBLIC_ENABLE_SUPERTONIC_TTS !== 'false',
} as const;

export type LocalTtsEngine = keyof typeof TTS_FLAGS;

export function enabledLocalVoice(voice: string): LocalTtsEngine | null {
  const engine = voice.split(':', 1)[0] as LocalTtsEngine;
  return Object.hasOwn(TTS_FLAGS, engine) && TTS_FLAGS[engine] ? engine : null;
}
