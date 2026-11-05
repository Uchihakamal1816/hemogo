import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rolldownOptions: {
      output: {
        // Firebase changes rarely, so returning visitors keep it cached across releases.
        advancedChunks: {
          groups: [{ name: 'firebase', test: /node_modules[\\/](@firebase[\\/](?!messaging|analytics|installations)|firebase[\\/](?!messaging|analytics))/ }]
        }
      }
    }
  }
});
