import { strictFetch } from "./strict";

export const LASTFM_USER = "kevinalh";
export const LASTFM_PROFILE_URL = `https://www.last.fm/user/${LASTFM_USER}`;

export interface TopAlbum {
  name: string;
  artist: string;
  url: string;
  playcount: number;
}

interface LastfmTopAlbumsResponse {
  topalbums?: {
    album?: Array<{
      name: string;
      playcount: string;
      url: string;
      artist: { name: string };
    }>;
  };
  error?: number;
  message?: string;
}

/** Only keep HTTPS URLs from the API response. */
function httpsUrl(value: string): string | null {
  return value.startsWith("https://") ? value : null;
}

/**
 * Fetches the albums listened to most in the past week from Last.fm.
 *
 * Like the GitHub fetch, this runs at build time and returns `null` on failure
 * so the section is simply left out, unless strict fetching is enabled (see
 * strict.ts).
 */
export async function getTopAlbums(limit = 8): Promise<TopAlbum[] | null> {
  const apiKey = import.meta.env.LASTFM_API_KEY;

  if (!apiKey) {
    if (strictFetch) {
      throw new Error("LASTFM_API_KEY must be set for strict builds.");
    }
    console.warn("LASTFM_API_KEY is not set; skipping the Last.fm fetch.");
    return null;
  }

  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.search = new URLSearchParams({
    method: "user.gettopalbums",
    user: LASTFM_USER,
    period: "7day",
    limit: String(limit),
    api_key: apiKey,
    format: "json",
  }).toString();

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "kevin.languas.co" },
    });
    const payload = (await response.json()) as LastfmTopAlbumsResponse;

    if (!response.ok || payload.error) {
      throw new Error(
        `request failed with status ${response.status}: ${payload.message ?? "unknown error"}`,
      );
    }

    return (payload.topalbums?.album ?? []).flatMap((album) => {
      const albumUrl = httpsUrl(album.url);
      if (!albumUrl) {
        return [];
      }
      return [
        {
          name: album.name,
          artist: album.artist.name,
          url: albumUrl,
          playcount: Number(album.playcount),
        },
      ];
    });
  } catch (error) {
    if (strictFetch) {
      throw error;
    }
    // Log only the message: the request URL contains the API key.
    console.error(
      "Failed to fetch top albums from Last.fm:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
