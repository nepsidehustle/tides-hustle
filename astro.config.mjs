import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Check if we are building for Caddy
const isCaddyBuild = process.env.DEPLOY_TARGET === 'caddy';

export default defineConfig({
  // Caddy = Static (Files). Cloudflare = Server (API).
  output: isCaddyBuild ? 'static' : 'server',
  
  // Base URL handling
  base: isCaddyBuild ? '/tides' : '/',

  // Only use the Cloudflare adapter if we are NOT on Caddy
  adapter: isCaddyBuild ? undefined : cloudflare(),

  trailingSlash: isCaddyBuild ? 'always' : 'ignore', 
});