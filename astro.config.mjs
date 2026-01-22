import { defineConfig } from 'astro/config';
import cloudflare from"@astrojs/cloudflare";

export default defineConfig({
  output: 'server', // tell astro this isnt a static site
  adapter: cloudflare({ // tell astro to build for cloudflare
    mode: 'advanced' // use advanced mode for cloudflare workers
  })
});