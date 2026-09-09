import { defineConfig } from 'vite';
import {recordedGenerationPlugin} from './scripts/recorded-generation.mjs';
export default defineConfig({
  appType: 'mpa',
  publicDir: false,
  plugins: [recordedGenerationPlugin(),{
    name: 'existing-static-routes',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Development never invokes payment handlers or an external provider.
        if (req.url?.startsWith('/api/')) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'local_preview_only' }));
          return;
        }
        if(req.url?.match(/^\/(?:index(?:\.html)?)?(?:\?|$)/))req.url=req.url.replace(/^\/(?:index(?:\.html)?)?/, '/experience.html');
        if (req.url?.match(/^\/experience(?:\?|$)/)) req.url = req.url.replace('/experience', '/experience.html');
        next();
      });
    },
  }],
  build: {
    outDir: '.preview-build', emptyOutDir: true,
    modulePreload: false, // No eager 3D module download when JavaScript is disabled.
    rollupOptions: { input: ['experience.html','suitability.html'] },
    assetsDir: 'experience-assets',
    target: 'es2022',
  },
});
