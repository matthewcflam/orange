import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { imagetools } from 'vite-imagetools'

/** Image presets (spec §10.3). `?hero` on an image import generates AVIF +
 *  WebP at 1× and 2× the rendered width and returns a `Picture` (see
 *  src/imagetools.d.ts). Hero boxes are 600 mockup px wide; 700 leaves room
 *  for `object-fit: cover` cropping. */
const PRESETS: Record<string, Record<string, string>> = {
  hero: { w: '700;1400', format: 'avif;webp', as: 'picture' },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    imagetools({
      defaultDirectives: (url) => {
        for (const [name, directives] of Object.entries(PRESETS)) {
          if (url.searchParams.has(name)) return new URLSearchParams(directives)
        }
        return new URLSearchParams()
      },
    }),
  ],
})
