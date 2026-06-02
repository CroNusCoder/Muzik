// ─────────────────────────────────────────────────────────────
//  JioSaavn API Client — replaces InnerTube service
//  Communicates with custom worker API:
//  https://jiosaavn-api.parthasarathisrivastava.workers.dev
// ─────────────────────────────────────────────────────────────

import type { Song } from '../components/common/SongRow';

const API_BASE = 'https://jiosaavn-api.parthasarathisrivastava.workers.dev';

const decodeHtml = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
};

const mapSaavnSongToSong = (item: any): Song => {
  const primaryArtists = item.artists?.primary?.map((a: any) => decodeHtml(a.name)).join(', ') || 'Unknown Artist';
  
  // Select best quality thumbnail image
  let thumbnail = undefined;
  if (item.image && item.image.length > 0) {
    const sortedImages = [...item.image].sort((a, b) => {
      const aQual = parseInt(a.quality) || 0;
      const bQual = parseInt(b.quality) || 0;
      return bQual - aQual;
    });
    thumbnail = sortedImages[0].url;
  }

  return {
    id: item.id,
    videoId: item.id,
    title: decodeHtml(item.name),
    artist: primaryArtists,
    album: item.album?.name ? decodeHtml(item.album.name) : undefined,
    duration: item.duration || 0,
    thumbnail,
  };
};

export const searchSongs = async (query: string): Promise<Song[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/search/songs?query=${encodeURIComponent(query)}&limit=20`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && json.data?.results) {
      return json.data.results.map(mapSaavnSongToSong);
    }
  } catch (err) {
    console.error(`JioSaavn search failed for query "${query}":`, err);
  }
  return [];
};

export interface HomeSection {
  title: string;
  songs: Song[];
}

export const getHomeFeed = async (): Promise<HomeSection[]> => {
  const sections: HomeSection[] = [];
  
  const categories = [
    { title: 'Trending Hits', query: 'trending' },
    { title: 'Bollywood Romance', query: 'bollywood romance' },
    { title: 'Global Pop Hits', query: 'global hits' },
    { title: 'Lo-Fi Chillout', query: 'lo-fi' }
  ];

  try {
    const results = await Promise.all(
      categories.map(async (cat) => {
        try {
          const songs = await searchSongs(cat.query);
          return { title: cat.title, songs: songs.slice(0, 10) };
        } catch (e) {
          console.warn(`Failed to fetch home category "${cat.title}":`, e);
          return { title: cat.title, songs: [] };
        }
      })
    );

    for (const res of results) {
      if (res.songs.length > 0) {
        sections.push(res);
      }
    }
  } catch (err) {
    console.error('Failed to load JioSaavn home feed:', err);
  }

  return sections;
};

export const getStreamUrl = async (videoId: string): Promise<string> => {
  try {
    const res = await fetch(`${API_BASE}/api/songs/${videoId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.success && json.data?.length > 0) {
      const song = json.data[0];
      const downloadUrls = song.downloadUrl || [];
      
      // Sort download Urls by quality to get the highest quality (e.g. 320kbps or 160kbps)
      const qualityWeights: { [key: string]: number } = {
        '320kbps': 5,
        '160kbps': 4,
        '96kbps': 3,
        '48kbps': 2,
        '12kbps': 1
      };
      
      const sortedDownloads = [...downloadUrls].sort((a: any, b: any) => {
        const wA = qualityWeights[a.quality] || 0;
        const wB = qualityWeights[b.quality] || 0;
        return wB - wA;
      });

      if (sortedDownloads.length > 0 && sortedDownloads[0].url) {
        return sortedDownloads[0].url;
      }
    }
  } catch (err) {
    console.error(`JioSaavn getStreamUrl failed for ID "${videoId}":`, err);
  }
  
  throw new Error(`Unable to resolve stream for song ID: ${videoId}`);
};

export const getRelated = async (videoId: string): Promise<Song[]> => {
  // Unused by UI but exported to satisfy references/contracts
  return [];
};