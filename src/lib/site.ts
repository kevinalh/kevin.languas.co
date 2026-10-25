export const NAME = "Kevin Languasco";
export const ROLE = "Distributed Systems Engineer";
export const DESCRIPTION = `${ROLE} at Cloudflare in London, working on the ClickHouse Platform.`;

// The site is rebuilt whenever its data is refreshed, so the build time is
// when the Last.fm and GitHub sections were last fetched.
export const builtAt = new Date().toISOString();
// ISO 8601 date and time to the minute, e.g. "2026-10-25 12:58".
export const builtAtLabel = `${builtAt.slice(0, 10)} ${builtAt.slice(11, 16)} UTC`;
