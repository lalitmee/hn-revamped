import type { KokoroTTS } from 'kokoro-js';

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

let modelPromise: Promise<KokoroTTS> | null = null;

async function loadModel(): Promise<KokoroTTS> {
  const { KokoroTTS } = await import('kokoro-js');
  const gpu =
    typeof navigator === 'undefined'
      ? undefined
      : (
          navigator as Navigator & {
            gpu?: { requestAdapter: () => Promise<unknown | null> };
          }
        ).gpu;
  // navigator.gpu can exist even when the browser cannot provide an adapter.
  // Probe first: ONNX Runtime can cache a failed initial WebGPU session and make
  // a subsequent WASM retry fail with the same backend error.
  let hasWebGPUAdapter = false;
  try {
    hasWebGPUAdapter = Boolean(await gpu?.requestAdapter());
  } catch {
    // Treat adapter lookup failures as unavailable WebGPU.
  }

  if (hasWebGPUAdapter) {
    return KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: 'fp32',
      device: 'webgpu',
    });
  }

  return KokoroTTS.from_pretrained(MODEL_ID, {
    dtype: 'q8',
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
