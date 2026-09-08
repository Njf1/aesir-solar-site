import { defineConfig } from 'vite';
export default defineConfig({
  appType: 'mpa',
  publicDir: false,
  plugins: [{
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
        if (req.url?.match(/^\/experience(?:\?|$)/)) req.url = req.url.replace('/experience', '/experience.html');
        next();
      });
    },
  }],
  build: {
    outDir: '.preview-build', emptyOutDir: true,
    rollupOptions: { input: 'experience.html' },
    assetsDir: 'experience-assets',
    target: 'es2022',
  },
});
