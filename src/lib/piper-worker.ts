/// <reference lib="webworker" />

// Loaded only after a Piper voice is selected. The worker keeps phonemization
// and ONNX inference off the reader UI thread.
import { TtsSession } from '@mintplex-labs/piper-tts-web';

type GenerateRequest = {
  type: 'generate';
  id: number;
  text: string;
  voice: string;
  speed: number;
  priority: 'play' | 'prefetch';
};
type Request = { type: 'load'; id: number; voice: string } | GenerateRequest;

const HF_BASE = 'https://huggingface.co/diffusionstudio/piper-voices/resolve/';
const HF_REVISION = '840e38a7e26d813bd6221b78cfbaefa3585b3f71';
const ORIGINAL_FETCH = globalThis.fetch.bind(globalThis);

// The package's voice URL uses `main`. Rewrite network requests to an
// immutable Hugging Face revision before any model download can occur.
globalThis.fetch = (input, init) => {
  const url = input instanceof Request ? input.url : String(input);
  if (url.startsWith(`${HF_BASE}main/`)) {
    const pinnedUrl = url.replace(
      `${HF_BASE}main/`,
      `${HF_BASE}${HF_REVISION}/`
    );
    return ORIGINAL_FETCH(pinnedUrl, init);
  }
  return ORIGINAL_FETCH(input, init);
};

TtsSession.WASM_LOCATIONS = {
  onnxWasm: 'https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/',
  piperData:
    'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data',
  piperWasm:
    'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm',
};

let sessionPromise: Promise<TtsSession> | null = null;
let sessionVoice: string | null = null;
let running = false;
let queue: GenerateRequest[] = [];

function loadSession(voice: string): Promise<TtsSession> {
  if (sessionVoice !== voice) {
    sessionVoice = voice;
    TtsSession._instance = null;
    sessionPromise = TtsSession.create({ voiceId: voice as never }).catch(
      (error: unknown) => {
        sessionPromise = null;
        sessionVoice = null;
        TtsSession._instance = null;
        throw error;
      }
    );
  }
  return sessionPromise!;
}

async function drainQueue() {
  if (running) return;
  running = true;
  try {
    while (queue.length) {
      const request = queue.shift()!;
      try {
        const session = await loadSession(request.voice);
        const wav = await (await session.predict(request.text)).arrayBuffer();
        self.postMessage(
          { type: 'audio', id: request.id, wav },
          {
            transfer: [wav],
          }
        );
      } catch (error) {
        self.postMessage({
          type: 'error',
          id: request.id,
          message: error instanceof Error ? error.message : 'Piper failed.',
        });
      }
    }
  } finally {
    running = false;
  }
}

self.onmessage = (event: MessageEvent<Request>) => {
  const request = event.data;
  if (request.type === 'load') {
    void loadSession(request.voice)
      .then(() => self.postMessage({ type: 'ready', id: request.id }))
      .catch((error: unknown) =>
        self.postMessage({
          type: 'error',
          id: request.id,
          message: error instanceof Error ? error.message : 'Piper failed.',
        })
      );
    return;
  }
  if (request.priority === 'play') {
    for (const queued of queue) {
      self.postMessage({
        type: 'error',
        id: queued.id,
        message: 'Superseded.',
      });
    }
    queue = [request];
  } else {
    queue.push(request);
  }
  void drainQueue();
};
