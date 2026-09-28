import { defineConfig } from 'vite'
import { createPhoneMiddleware } from './server/phoneLookup.ts'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'phone-lookup-api',
      configureServer(server) { server.middlewares.use(createPhoneMiddleware()) },
      configurePreviewServer(server) { server.middlewares.use(createPhoneMiddleware()) },
    },
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ]
})
