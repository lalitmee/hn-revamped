import type { KokoroTTS } from 'kokoro-js';

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

let modelPromise: Promise<KokoroTTS> | null = null;

async function loadModel(): Promise<KokoroTTS> {
  const { KokoroTTS } = await import('kokoro-js');
  // q4 only: never download the larger q8/fp32 variants, even on WebGPU hosts.
  return KokoroTTS.from_pretrained(MODEL_ID, {
    dtype: 'q4',
    device: 'wasm',
  });
}

export function loadKokoroModel(): Promise<KokoroTTS> {
  if (!modelPromise) {
    modelPromise = loadModel().catch((error: unknown) => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

export async function generateKokoroAudio(
  text: string,
  voice: string,
  speed: number
) {
  const model = await loadKokoroModel();
  return model.generate(text, {
    voice: voice as keyof KokoroTTS['voices'],
    speed,
  });
}
