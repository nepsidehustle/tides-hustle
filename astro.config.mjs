import { defineConfig } from 'astro/config';
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    // This forces everything into one _worker.js FILE instead of a directory
    functionPerRoute: false 
  }),
});