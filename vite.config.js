import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { execSync } from 'child_process'

// Shown at the bottom of the back-office sidebar: build date + git short hash.
function buildInfo() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '.')
  try {
    const hash = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    return `${date} · ${hash}`
  } catch {
    return date
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_BUILD_INFO': JSON.stringify(buildInfo()),
  },
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      // This mimics baseUrl = "src"
      'assets': path.resolve(__dirname, 'src/assets'),
      'components': path.resolve(__dirname, 'src/components'),
      'constants': path.resolve(__dirname, 'src/constants'),
      'hooks': path.resolve(__dirname, 'src/hooks'),
      'layouts': path.resolve(__dirname, 'src/layouts'),
      'pages': path.resolve(__dirname, 'src/pages'),
      'services': path.resolve(__dirname, 'src/services'),
      'store': path.resolve(__dirname, 'src/store'),
      'utils': path.resolve(__dirname, 'src/utils'),
    }
  },
  server: {
    port: 3000
  }
})
