// ─────────────────────────────────────
//  Lyrics Service — lrclib.net API
// ─────────────────────────────────────
//  Free, no API key needed

const LRCLIB_BASE = 'https://lrclib.net/api';

export interface LyricLine {
  time: number;   // seconds
  text: string;
}

export interface LyricsResult {
  synced: boolean;
  lines: LyricLine[];
  plainLyrics?: string;
}

// Parse .lrc format: [mm:ss.xx] lyric text
const parseLrc = (lrc: string): LyricLine[] => {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  for (const line of lrc.split('\n')) {
    const match = line.match(regex);
    if (!match) continue;
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    const centiseconds = parseInt(match[3]);
    const time = minutes * 60 + seconds + centiseconds / 100;
    const text = match[4].trim();
    if (text) lines.push({ time, text });
  }

  return lines.sort((a, b) => a.time - b.time);
};

// Fetch synced lyrics
export const getLyrics = async (
  title: string,
  artist: string,
  duration?: number
): Promise<LyricsResult | null> => {
  try {
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist,
      ...(duration ? { duration: String(Math.round(duration)) } : {}),
    });

    const res = await fetch(`${LRCLIB_BASE}/get?${params}`);
    if (!res.ok) return null;

    const data = await res.json();

    if (data.syncedLyrics) {
      return {
        synced: true,
        lines: parseLrc(data.syncedLyrics),
        plainLyrics: data.plainLyrics,
      };
    }

    if (data.plainLyrics) {
      return {
        synced: false,
        lines: data.plainLyrics
          .split('\n')
          .filter((l: string) => l.trim())
          .map((text: string, i: number) => ({ time: i, text })),
        plainLyrics: data.plainLyrics,
      };
    }

    return null;
  } catch {
    return null;
  }
};

// Search lyrics when title/artist isn't precise
export const searchLyrics = async (query: string): Promise<LyricsResult | null> => {
  try {
    const res = await fetch(`${LRCLIB_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const results = await res.json();
    if (!results.length) return null;
    const best = results[0];
    return getLyrics(best.trackName, best.artistName, best.duration);
  } catch {
    return null;
  }
};
