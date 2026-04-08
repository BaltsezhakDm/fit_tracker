import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: 'https://baltsezhakdm.github.io/fit_tracker/',
  plugins: [react()],
})
