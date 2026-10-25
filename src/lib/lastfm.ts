import { buildTimeFetch, USER_AGENT } from "./strict";

const LASTFM_USER = "kevinalh";
export const LASTFM_PROFILE_URL = `https://www.last.fm/user/${LASTFM_USER}`;

export interface TopAlbum {
  name: string;
  artist: string;
  /** The album's Last.fm page. */
  url: string;
  playcount: number;
  /** MusicBrainz release ID, when Last.fm knows it. */
  mbid?: string;
  /** Added by addAlbumLinks when found. */
  wikipediaUrl?: string;
  spotifyUrl?: string;
}

interface LastfmTopAlbumsResponse {
  topalbums?: {
    album?: Array<{
      name: string;
      playcount: string;
      url: string;
      mbid?: string;
      artist: { name: string };
    }>;
  };
  error?: number;
  message?: string;
}

/** How many albums the homepage shows. */
const TOP_ALBUMS_COUNT = 8;

export function formatPlays(playcount: number): string {
  return `${playcount} ${playcount === 1 ? "play" : "plays"}`;
}

/** Fetches the albums listened to most in the past week from Last.fm. */
export function getTopAlbums(): Promise<TopAlbum[] | null> {
  return buildTimeFetch(
    "Last.fm",
    "LASTFM_API_KEY",
    import.meta.env.LASTFM_API_KEY,
    async (apiKey) => {
      const url = new URL("https://ws.audioscrobbler.com/2.0/");
      url.search = new URLSearchParams({
        method: "user.gettopalbums",
        user: LASTFM_USER,
        period: "7day",
        limit: String(TOP_ALBUMS_COUNT),
        api_key: apiKey,
        format: "json",
      }).toString();

      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      });
      const payload = (await response.json()) as LastfmTopAlbumsResponse;

      if (!response.ok || payload.error) {
        throw new Error(
          `request failed with status ${response.status}: ${payload.message ?? "unknown error"}`,
        );
      }

      // Only keep albums with HTTPS links, since they're rendered as hrefs.
      return (payload.topalbums?.album ?? [])
        .filter((album) => album.url.startsWith("https://"))
        .map((album) => ({
          name: album.name,
          artist: album.artist.name,
          url: album.url,
          playcount: Number(album.playcount),
          mbid: album.mbid || undefined,
        }));
    },
  );
}
