import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/constants.ts', 'src/validation.ts', 'src/types.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.js' };
  },
});
