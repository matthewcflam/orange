import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { imagetools } from 'vite-imagetools'

/** Image presets (spec §10.3). `?hero` on an image import generates AVIF +
 *  WebP at 1× and 2× the rendered width and returns a `Picture` (see
 *  src/imagetools.d.ts). Hero boxes are 600 mockup px wide; 700 leaves room
 *  for `object-fit: cover` cropping. `?obstacle` is the same for small
 *  draggable images (~41 mockup px, so 64 and 128 cover up to 3× DPR).
 *  `?charm` rasterizes the keychain charms (doug-keychain.svg,
 *  compass-keychain.svg: 200–300 mockup px wide), so
 *  the browser moves bitmaps instead of re-rasterizing 150-path SVGs. */
const PRESETS: Record<string, Record<string, string>> = {
  hero: { w: '700;1400', format: 'avif;webp', as: 'picture' },
  obstacle: { w: '64;128', format: 'avif;webp', as: 'picture' },
  charm: { w: '300;600', format: 'avif;webp', as: 'picture' },
  // About photos' frosted glass, blurred here instead of with CSS filters.
  // `frost` (heavy) is tiny and inlined as a data URI, so it shows before
  // any image loads; `frostlight` (the mid blur) is a small file.
  frost: { w: '32', blur: '1.6', format: 'webp', quality: '70', inline: '' },
  frostlight: { w: '160', blur: '3', format: 'webp', quality: '70' },
  // The key card's paper texture (texture.png, 509×289 at 30% alpha), kept at
  // its own size; WebP keeps the alpha.
  paper: { format: 'webp', quality: '85' },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    imagetools({
      // Raster images, plus SVGs imported with ?charm (other SVGs stay ?raw).
      include: [/^[^?]+\.(avif|gif|heif|jpeg|jpg|png|tiff|webp)(\?.*)?$/, /^[^?]+\.svg\?(.*&)?charm(&.*)?$/],
      defaultDirectives: (url) => {
        for (const [name, directives] of Object.entries(PRESETS)) {
          if (url.searchParams.has(name)) return new URLSearchParams(directives)
        }
        return new URLSearchParams()
      },
    }),
  ],
})
