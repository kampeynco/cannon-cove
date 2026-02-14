import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            input: {
                main: 'index.html',
                cookiePolicy: 'cookie-policy.html',
            },
        },
    },
    server: {
        port: 5173,
        open: true,
    },
});
