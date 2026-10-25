/**
 * Build-time data fetches normally fall back to rendering without the data, so
 * local builds work without API keys. With `STRICT_FETCH=true` (set in Workers
 * Builds) they throw instead, so a broken scheduled rebuild keeps the last good
 * deploy live.
 */
const strictFetch = import.meta.env.STRICT_FETCH === "true";

export const USER_AGENT = "kevin.languas.co";

/**
 * Runs `fetcher` with the API key in `key`, returning `null` when the key is
 * missing or the fetch fails, unless strict fetching is enabled.
 */
export async function buildTimeFetch<T>(
  source: string,
  keyName: string,
  key: string | undefined,
  fetcher: (key: string) => Promise<T>,
): Promise<T | null> {
  if (!key) {
    const message = `${keyName} is not set; skipping the ${source} fetch.`;
    if (strictFetch) {
      throw new Error(message);
    }
    console.warn(message);
    return null;
  }

  try {
    return await fetcher(key);
  } catch (error) {
    if (strictFetch) {
      throw error;
    }
    // Log only the message: request URLs can contain the API key.
    console.error(
      `Failed to fetch from ${source}:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
