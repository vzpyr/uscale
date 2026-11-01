import { defineConfig } from 'vite';
import { createReadStream, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'ort-wasm',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith('/ort-wasm/')) return next();
          const file = req.url.slice(10).split('?')[0];
          const path = resolve('node_modules/onnxruntime-web/dist', file);
          if (!existsSync(path)) return next();

          res.writeHead(200, {
            ...headers,
            'Content-Type': file.endsWith('.wasm') ? 'application/wasm' : 'text/javascript',
          });
          createReadStream(path).pipe(res);
        });
      },
    },
  ],
  server: { headers },
  optimizeDeps: { exclude: ['onnxruntime-web'] },
});
