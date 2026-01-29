import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Optimize dependencies to reduce number of files Chrome needs to load
      optimizeDeps: {
        // Force pre-bundling of these dependencies
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          '@supabase/supabase-js',
          'framer-motion',
          'lucide-react'
        ],
        // Exclude these from pre-bundling (if needed)
        exclude: []
      }
    };
});
