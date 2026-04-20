import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/EynshamDartsLeague/', // GitHub Pages repo path       
  plugins: [react()]
})