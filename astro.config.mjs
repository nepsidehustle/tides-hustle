import { defineConfig } from 'astro/config';
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: 'server',
  adapter: cloudflare(), // No extra modes or proxies needed for now
  trailingSlash: 'always', //force remap of all routes
}); 