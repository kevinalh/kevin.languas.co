/**
 * Build-time data fetches normally fall back to rendering without the data, so
 * local builds work without API keys. With `STRICT_FETCH=true` (set in Workers
 * Builds) they throw instead, so a broken scheduled rebuild keeps the last good
 * deploy live.
 */
export const strictFetch = import.meta.env.STRICT_FETCH === "true";
