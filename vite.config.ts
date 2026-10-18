import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GROQ_PROXY_URL': JSON.stringify(env.GROQ_PROXY_URL),
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [{ name: 'vendor', test: /node_modules/ }],
          },
        },
      },
    },
    server: {
      // HMR can be disabled through DISABLE_HMR when the host manages file updates.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
