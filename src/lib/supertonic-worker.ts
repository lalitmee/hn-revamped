/// <reference lib="webworker" />

import * as ort from 'onnxruntime-web';
import { loadTextToSpeech, loadVoiceStyle } from './supertonic-helper.js';

type GenerateRequest = {
  type: 'generate';
  id: number;
  text: string;
  voice: string;
  speed: number;
  priority: 'play' | 'prefetch';
};
type Request = { type: 'load'; id: number } | GenerateRequest;

// Immutable HF revision; large model files must not be bundled in Vercel.
const MODEL_BASE =
  'https://huggingface.co/Supertone/supertonic-3/resolve/3cadd1ee6394adea1bd021217a0e650ede09a323/';
const STYLES = ['F1', 'F2', 'M1', 'M2'];

type LoadedModel = Awaited<ReturnType<typeof loadTextToSpeech>>['textToSpeech'];
let modelPromise: Promise<LoadedModel> | null = null;
const styles = new Map<string, ReturnType<typeof loadVoiceStyle>>();
let running = false;
let queue: GenerateRequest[] = [];

function loadModel(): Promise<LoadedModel> {
  if (!modelPromise) {
    ort.env.wasm.wasmPaths = 'https://unpkg.com/onnxruntime-web@1.18.0/dist/';
    ort.env.wasm.numThreads = 1;
    modelPromise = loadTextToSpeech(`${MODEL_BASE}onnx`, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    })
      .then(({ textToSpeech }) => textToSpeech)
      .catch((error: unknown) => {
        modelPromise = null;
        throw error;
      });
  }
  return modelPromise;
}

function loadStyle(voice: string) {
  if (!STYLES.includes(voice)) throw new Error('Unknown Supertonic style.');
  if (!styles.has(voice)) {
    const promise = loadVoiceStyle([
      `${MODEL_BASE}voice_styles/${voice}.json`,
    ]).catch((error: unknown) => {
      styles.delete(voice);
      throw error;
    });
    styles.set(voice, promise);
  }
  return styles.get(voice)!;
}

async function drainQueue() {
  if (running) return;
  running = true;
  try {
    while (queue.length) {
      const request = queue.shift()!;
      try {
        const [model, style] = await Promise.all([
          loadModel(),
          loadStyle(request.voice),
        ]);
        // The upstream helper chunks text internally when needed. Keep a
        // whole reader paragraph as the unit of playback and lookahead.
        const { wav, duration } = await model.call(
          request.text,
          'en',
          style,
          8,
          1.05
        );
        const audio = new Float32Array(
          wav.slice(0, Math.floor(model.sampleRate * duration[0]))
        );
        self.postMessage(
          {
            type: 'audio',
            id: request.id,
            audio,
            samplingRate: model.sampleRate,
          },
          { transfer: [audio.buffer] }
        );
      } catch (error) {
        self.postMessage({
          type: 'error',
          id: request.id,
          message:
            error instanceof Error ? error.message : 'Supertonic failed.',
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
    void loadModel()
      .then(() => self.postMessage({ type: 'ready', id: request.id }))
      .catch((error: unknown) =>
        self.postMessage({
          type: 'error',
          id: request.id,
          message:
            error instanceof Error ? error.message : 'Supertonic failed.',
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
