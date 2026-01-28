export default defineConfig({
  // CLOUDFLARE VERSION: Must be 'server' and have NO 'base' (just '/')
  // CADDY VERSION: Must be 'static' and have base: '/tides'
  
  output: isCaddyBuild ? 'static' : 'server',
  
  // Use undefined for Cloudflare to ensure it defaults to root properly
  base: isCaddyBuild ? '/tides' : '/',

  adapter: isCaddyBuild ? undefined : cloudflare(),

  // Try setting this to 'ignore' or removing it to see if Cloudflare settles down
  trailingSlash: isCaddyBuild ? 'always' : 'ignore', 
});