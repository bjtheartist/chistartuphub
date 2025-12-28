import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualEditPlugin } from './vite-plugins/visual-edit-plugin.js'
import { errorOverlayPlugin } from './vite-plugins/error-overlay-plugin.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      mode === 'development' && visualEditPlugin(),
      react(),
      errorOverlayPlugin(),
      {
        name: 'iframe-hmr',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Allow iframe embedding
            res.setHeader('X-Frame-Options', 'ALLOWALL');
            res.setHeader('Content-Security-Policy', "frame-ancestors *;");
            next();
          });
        }
      }
    ].filter(Boolean),
    server: {
      host: '0.0.0.0', // Bind to all interfaces for container access
      port: 5173,
      strictPort: true,
      // Allow all hosts - essential for Modal tunnel URLs
      allowedHosts: true,
      watch: {
        // Enable polling for better file change detection in containers
        usePolling: true,
        interval: 100, // Check every 100ms for responsive HMR
      },
      hmr: {
        protocol: 'wss',
        clientPort: 443
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    build: {
      sourcemap: false, // Disable sourcemaps for production
      minify: 'esbuild', // Use esbuild for faster builds
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React libraries
            vendor: ['react', 'react-dom', 'react-router-dom'],
            // Radix UI components
            ui: [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-tabs',
              '@radix-ui/react-select',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-popover',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-switch',
              '@radix-ui/react-slider',
              '@radix-ui/react-label',
              '@radix-ui/react-separator',
              '@radix-ui/react-avatar',
              '@radix-ui/react-scroll-area'
            ].filter(pkg => {
              // Only include packages that are actually installed
              try {
                require.resolve(pkg);
                return true;
              } catch {
                return false;
              }
            }),
            // Charts library
            charts: ['recharts'],
            // Maps library
            maps: ['react-leaflet', 'leaflet'],
            // Animation libraries
            animation: ['framer-motion', 'gsap']
          }
        }
      }
    }
  }
});