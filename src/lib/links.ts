import { LASTFM_PROFILE_URL } from "./lastfm";

export const GITHUB_PROFILE_URL = "https://github.com/kevinalh";
export const GITHUB_STARS_URL = `${GITHUB_PROFILE_URL}?tab=stars`;
export const EMAIL = "kevin+websiteschema@languas.co";
export const TWITTER_HANDLE = "kevinalh";

/** Profiles shown in the footer, in display order. */
export const profileLinks = [
  { label: "GitHub", href: GITHUB_PROFILE_URL },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/kevinalh/" },
  { label: "Twitter", href: `https://twitter.com/${TWITTER_HANDLE}` },
  { label: "Last.fm", href: LASTFM_PROFILE_URL },
];
