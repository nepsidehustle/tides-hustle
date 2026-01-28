import { defineConfig } from 'astro/config';
import cloudflare from "@astrojs/cloudflare";

// Check if we are building for our Caddy Lab
const isCaddyBuild = process.env.DEPLOY_TARGET === 'caddy';

export default defineConfig({
  // If building for Caddy, use 'static'. Otherwise, keep your 'server' output.
  output: isCaddyBuild ? 'static' : 'server',
  
  // If building for Caddy, use the /tides base path.
  base: isCaddyBuild ? '/tides' : '/',

  // Only use the Cloudflare adapter if we aren't building for Caddy
  adapter: isCaddyBuild ? undefined : cloudflare(),

  trailingSlash: 'always',
});