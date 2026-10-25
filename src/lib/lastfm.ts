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

export interface ListeningStats {
  scrobbles: number;
  /** The year the Last.fm account was created. */
  since: number;
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
}

interface LastfmUserInfoResponse {
  user?: {
    playcount: string;
    registered: { unixtime: string };
  };
}

/** How many albums the homepage shows. */
const TOP_ALBUMS_COUNT = 8;

export function formatPlays(playcount: number): string {
  return `${playcount} ${playcount === 1 ? "play" : "plays"}`;
}

export function formatStats({ scrobbles, since }: ListeningStats): string {
  return `${scrobbles.toLocaleString("en-US")} scrobbles since ${since}`;
}

/** Calls a Last.fm API method for the site's user. */
async function callLastfm<T>(
  apiKey: string,
  method: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.search = new URLSearchParams({
    method,
    user: LASTFM_USER,
    ...params,
    api_key: apiKey,
    format: "json",
  }).toString();

  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  const payload = (await response.json()) as T & {
    error?: number;
    message?: string;
  };

  if (!response.ok || payload.error) {
    throw new Error(
      `${method} failed with status ${response.status}: ${payload.message ?? "unknown error"}`,
    );
  }
  return payload;
}

/** Fetches the albums listened to most in the past week from Last.fm. */
export function getTopAlbums(): Promise<TopAlbum[] | null> {
  return buildTimeFetch(
    "Last.fm",
    "LASTFM_API_KEY",
    import.meta.env.LASTFM_API_KEY,
    async (apiKey) => {
      const payload = await callLastfm<LastfmTopAlbumsResponse>(
        apiKey,
        "user.gettopalbums",
        { period: "7day", limit: String(TOP_ALBUMS_COUNT) },
      );

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

/** Fetches the account's total scrobbles and the year it was created. */
export function getListeningStats(): Promise<ListeningStats | null> {
  return buildTimeFetch(
    "Last.fm",
    "LASTFM_API_KEY",
    import.meta.env.LASTFM_API_KEY,
    async (apiKey) => {
      const { user } = await callLastfm<LastfmUserInfoResponse>(
        apiKey,
        "user.getinfo",
      );
      if (!user) {
        throw new Error("user.getinfo returned no user");
      }
      return {
        scrobbles: Number(user.playcount),
        since: new Date(Number(user.registered.unixtime) * 1000).getUTCFullYear(),
      };
    },
  );
}
