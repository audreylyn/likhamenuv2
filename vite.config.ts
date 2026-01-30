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
    // Build optimizations
    build: {
      // Split vendor chunks for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React - rarely changes, caches well
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Supabase - separate chunk
            'vendor-supabase': ['@supabase/supabase-js'],
            // Framer Motion - large library, cache separately
            'vendor-framer': ['framer-motion'],
            // Google AI - only needed for content generation
            'vendor-ai': ['@google/generative-ai'],
          }
        }
      },
      // Increase chunk warning limit (we're splitting properly now)
      chunkSizeWarningLimit: 600,
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
