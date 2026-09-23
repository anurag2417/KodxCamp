import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CheerpJ requires Range request support to load jars in chunks.
 * Vite's dev server uses sirv, which doesn't support Range by default.
 * This middleware intercepts requests for .jar files under /public
 * and serves them with Range support.
 */
function cheerpjRangeSupport(): Plugin {
  return {
    name: 'cheerpj-range-support',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.endsWith('.jar')) return next();

        // Strip query string and leading slash
        const urlPath = req.url.split('?')[0].replace(/^\//, '');
        const filePath = path.resolve(__dirname, 'public', urlPath);

        if (!fs.existsSync(filePath)) return next();

        const stat = fs.statSync(filePath);
        const range = req.headers.range;

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', 'application/java-archive');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        if (range) {
          const match = /bytes=(\d+)-(\d*)/.exec(range);
          if (match) {
            const start = parseInt(match[1], 10);
            const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;
            const chunkSize = end - start + 1;

            res.statusCode = 206;
            res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
            res.setHeader('Content-Length', chunkSize);

            const stream = fs.createReadStream(filePath, { start, end });
            stream.pipe(res);
            return;
          }
        }

        res.setHeader('Content-Length', stat.size);
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), cheerpjRangeSupport()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['@kodxcamp/shared'],
  },
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});