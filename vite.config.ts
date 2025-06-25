import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: './example',
  plugins: [react()],
  resolve: {
    alias: {
      'react-highlight-html': path.resolve(__dirname, './src'), // alias vào src/
    },
  },
  server: {
    port: 5173,
  },
});
