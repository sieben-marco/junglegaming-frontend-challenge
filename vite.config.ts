import { tanstackRouter } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // IMPORTANTE: o plugin do TanStack Router precisa vir ANTES do plugin do React.
    // Ele gera o arquivo `src/routeTree.gen.ts` a partir de `src/routes`.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // `import.meta.dirname` é o substituto ESM de `__dirname` (Node >= 20.11).
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
