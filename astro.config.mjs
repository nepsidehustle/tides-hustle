import { defineConfig } from 'astro/config';
import cloudflare from "@astrojs/cloudflare";

// Robust check for the Caddy flag
const isCaddyBuild = process.env.DEPLOY_TARGET === 'caddy';

export default defineConfig({
  // Force static for Caddy, server for Cloudflare
  output: isCaddyBuild ? 'static' : 'server',
  
  // Apply the base path only for Caddy
  base: isCaddyBuild ? '/tides' : '/',

  // Only load the adapter if NOT a Caddy build
  adapter: isCaddyBuild ? [] : cloudflare(),

  trailingSlash: 'always',
});