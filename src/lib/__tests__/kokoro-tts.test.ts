import { expect, it, vi } from 'vitest';

const { fromPretrained } = vi.hoisted(() => ({ fromPretrained: vi.fn() }));
vi.mock('kokoro-js', () => ({
  KokoroTTS: { from_pretrained: fromPretrained },
}));

it('loads only the Kokoro q4 WASM model', async () => {
  fromPretrained.mockResolvedValue({ generate: vi.fn() });
  const { loadKokoroModel } = await import('../kokoro-tts');
  await loadKokoroModel();
  expect(fromPretrained).toHaveBeenCalledTimes(1);
  expect(fromPretrained).toHaveBeenCalledWith(
    'onnx-community/Kokoro-82M-v1.0-ONNX',
    { dtype: 'q4', device: 'wasm' }
  );
});
