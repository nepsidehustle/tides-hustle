import { defineConfig } from 'astro/config';
import cloudflare from "@astrojs/cloudflare";

const isCaddyBuild = process.env.DEPLOY_TARGET === 'caddy';

export default defineConfig({
  // Switch between Static and SSR
  output: isCaddyBuild ? 'static' : 'server',
  
  // Set the base path for Caddy subfolder
  base: isCaddyBuild ? '/tides' : '/',

  // This is the clean way: If Caddy, adapter is undefined (empty).
  // If not Caddy, it's the cloudflare object.
  adapter: isCaddyBuild ? undefined : cloudflare(),

  trailingSlash: 'always',
});