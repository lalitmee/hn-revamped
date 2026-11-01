import { build } from 'esbuild';
import { mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

// Next's new URL(...worker.ts, import.meta.url) emits raw TS assets rather than
// bundling package imports. Bundle browser workers explicitly before Next runs.
const outdir = join(process.cwd(), 'public', 'tts-workers');
await mkdir(outdir, { recursive: true });

for (const engine of ['piper', 'kokoro', 'supertonic']) {
  const flag = `NEXT_PUBLIC_ENABLE_${engine.toUpperCase()}_TTS`;
  const outfile = join(outdir, `${engine}.js`);
  if (process.env[flag] === 'false') {
    // Remove only the generated file for this explicitly disabled engine.
    for (const generatedFile of [outfile, `${outfile}.LEGAL.txt`]) {
      await unlink(generatedFile).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
    continue;
  }
  await build({
    entryPoints: [`src/lib/${engine}-worker.ts`],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2022',
    minify: true,
    legalComments: 'linked',
    plugins: [
      {
        name: 'browser-node-builtin-stubs',
        setup(build) {
          build.onResolve({ filter: /^(fs|path)$/ }, () => ({
            path: 'browser-node-builtin',
            namespace: 'browser-node-builtin',
          }));
          build.onLoad(
            { filter: /.*/, namespace: 'browser-node-builtin' },
            () => ({ contents: 'export default {};', loader: 'js' })
          );
        },
      },
    ],
    outfile,
  });
}
