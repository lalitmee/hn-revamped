import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Next.js output directory', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each([
    ['development', '.next-dev'],
    ['production', '.next'],
  ])('uses a separate directory in %s', async (environment, directory) => {
    vi.stubEnv('NODE_ENV', environment);
    const { default: config } = await import('../../next.config');
    expect(config.distDir ?? '.next').toBe(directory);
  });
});
