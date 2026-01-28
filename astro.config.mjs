import { defineConfig } from 'astro/config'; // <--- THIS LINE IS THE FIX
import cloudflare from "@astrojs/cloudflare";

// Robust check for the Caddy flag
const isCaddyBuild = process.env.DEPLOY_TARGET === 'caddy';

export default defineConfig({
  // Switch between Static for Caddy and Server for Cloudflare
  output: isCaddyBuild ? 'static' : 'server',
  
  // Use explicit strings: /tides for Caddy, / for Cloudflare
  base: isCaddyBuild ? '/tides' : '/',

  // Only load the adapter if NOT a Caddy build
  adapter: isCaddyBuild ? undefined : cloudflare(),

  // Caddy likes trailing slashes, Cloudflare is indifferent here
  trailingSlash: isCaddyBuild ? 'always' : 'ignore', 
});