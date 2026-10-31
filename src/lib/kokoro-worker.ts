/// <reference lib="webworker" />

import { generateKokoroAudio, loadKokoroModel } from './kokoro-tts';

type GenerateRequest = {
  type: 'generate';
  id: number;
  text: string;
  voice: string;
  speed: number;
  priority: 'play' | 'prefetch';
};
type Request = { type: 'load'; id: number } | GenerateRequest;

let running = false;
let queue: GenerateRequest[] = [];

async function drainQueue() {
  if (running) return;
  running = true;
  try {
    while (queue.length) {
      const request = queue.shift()!;
      try {
        const result = await generateKokoroAudio(
          request.text,
          request.voice,
          request.speed
        );
        const audio = new Float32Array(result.audio);
        self.postMessage(
          {
            type: 'audio',
            id: request.id,
            audio,
            samplingRate: result.sampling_rate,
          },
          { transfer: [audio.buffer] }
        );
      } catch (error) {
        self.postMessage({
          type: 'error',
          id: request.id,
          message:
            error instanceof Error ? error.message : 'Local voice failed.',
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
    void loadKokoroModel()
      .then(() => self.postMessage({ type: 'ready', id: request.id }))
      .catch((error: unknown) =>
        self.postMessage({
          type: 'error',
          id: request.id,
          message:
            error instanceof Error ? error.message : 'Local voice failed.',
        })
      );
    return;
  }
  if (request.priority === 'play') {
    // Drop queued, obsolete work when the user skips or changes voice/speed.
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
