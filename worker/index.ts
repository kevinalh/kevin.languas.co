/**
 * The site itself is static assets served directly by Cloudflare. This script
 * runs on the cron schedule in `wrangler.jsonc`, triggering a Workers Builds
 * rebuild through a Deploy Hook so the starred repositories on /github stay
 * fresh.
 */
export default {
  // Only requests that match no asset reach the Worker; let the assets layer
  // answer them with the 404 page.
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller, env) {
    const response = await fetch(env.DEPLOY_HOOK_URL, { method: "POST" });

    if (!response.ok) {
      throw new Error(`Deploy hook failed with status ${response.status}`);
    }
  },
} satisfies ExportedHandler<Env>;
