import { searchSongs } from './innertube';
import type { Song } from '../components/common/SongRow';

export interface SpotifyTrack {
  title: string;
  artist: string;
  durationMs: number;
}

export interface SpotifyImportResult {
  playlistName: string;
  matchedSongs: Song[];
  totalTracks: number;
}

// Extract Spotify playlist ID from URL
export const extractPlaylistId = (url: string): string | null => {
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

// Scrape tracks from public Spotify embed URL
export const fetchSpotifyTracks = async (playlistId: string): Promise<{ playlistName: string; tracks: SpotifyTrack[] }> => {
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
  
  const res = await fetch(embedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
  });
  if (!res.ok) throw new Error(`HTTP error fetching Spotify playlist: ${res.status}`);
  const html = await res.text();
  
  const scriptRegex = /<script\s+id="__NEXT_DATA__"[\s\S]*?>([\s\S]*?)<\/script>/gi;
  const match = scriptRegex.exec(html);
  if (!match) throw new Error("Could not parse Spotify playlist page. Check if the playlist is public.");
  
  const data = JSON.parse(match[1]);
  const pageProps = data.props?.pageProps;
  
  // If status is 404 inside JSON (e.g. region lock or invalid playlist)
  if (pageProps?.status === 404) {
    throw new Error("Spotify playlist not found. Verify that the playlist is set to public.");
  }
  
  const entity = pageProps?.state?.data?.entity;
  const playlistName = entity?.name || 'Spotify Import';
  const trackList = entity?.trackList || [];
  
  const tracks: SpotifyTrack[] = trackList.map((item: any) => ({
    title: item.title,
    artist: item.subtitle || '',
    durationMs: item.duration || 0,
  }));
  
  return {
    playlistName,
    tracks,
  };
};

// Match Spotify tracks to JioSaavn songs
export const importSpotifyPlaylist = async (
  url: string,
  onProgress: (current: number, total: number, songTitle: string) => void
): Promise<SpotifyImportResult> => {
  const playlistId = extractPlaylistId(url);
  if (!playlistId) throw new Error("Invalid Spotify playlist URL.");
  
  const { playlistName, tracks } = await fetchSpotifyTracks(playlistId);
  const matchedSongs: Song[] = [];
  
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    onProgress(i + 1, tracks.length, `${track.title} - ${track.artist}`);
    
    try {
      // Build search query: e.g. "Sorry Justin Bieber"
      const query = `${track.title} ${track.artist}`.trim();
      const results = await searchSongs(query);
      if (results && results.length > 0) {
        // Select the first matched song
        matchedSongs.push(results[0]);
      }
    } catch (err) {
      console.warn(`Failed to match song: "${track.title} - ${track.artist}"`, err);
    }
  }
  
  return {
    playlistName,
    matchedSongs,
    totalTracks: tracks.length,
  };
};
