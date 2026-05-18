import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleAiRequest } from './api/_aiCore.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const serverEnv = { ...process.env, ...env };

  return {
    plugins: [
      react(),
      {
        name: 'campusmate-local-ai-api',
        configureServer(server) {
          server.middlewares.use('/api/ai', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Method not allowed.' }));
              return;
            }

            let raw = '';
            req.on('data', (chunk) => {
              raw += chunk;
            });
            req.on('end', async () => {
              try {
                const body = raw ? JSON.parse(raw) : {};
                const result = await handleAiRequest(body, serverEnv);
                res.statusCode = result.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result.body));
              } catch {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON body.' }));
              }
            });
          });
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            firebase: [
              'firebase/app',
              'firebase/auth',
              'firebase/firestore',
              'firebase/storage',
            ],
            motion: ['framer-motion'],
            charts: ['recharts'],
            reports: ['jspdf'],
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  };
});
