import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const fileDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: fileDir,
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  }
});
