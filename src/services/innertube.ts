// ─────────────────────────────────────────────────────────────
//  JioSaavn API Client — replaces InnerTube service
//  Communicates directly with JioSaavn's official API:
//  https://www.jiosaavn.com/api.php
// ─────────────────────────────────────────────────────────────

import type { Song } from '../components/common/SongRow';
import CryptoJS from 'crypto-js';

const API_URL = 'https://www.jiosaavn.com/api.php';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
};

export interface PlaylistFeedItem {
  id: string;
  title: string;
  thumbnail?: string;
  songCount: number;
}

export interface HomeFeedData {
  featuredPlaylists: PlaylistFeedItem[];
  songSections: HomeSection[];
}

export interface HomeSection {
  title: string;
  songs: Song[];
}

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

const decryptUrl = (encryptedUrl?: string): string | undefined => {
  if (!encryptedUrl) return undefined;
  try {
    const key = CryptoJS.enc.Utf8.parse("38346591");
    const decrypted = CryptoJS.DES.decrypt(encryptedUrl, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
    if (decryptedStr.startsWith('http')) {
      // Upgrade quality to 320kbps
      return decryptedStr
        .replace('_96.mp4', '_320.mp4')
        .replace('_160.mp4', '_320.mp4')
        .replace('_48.mp4', '_320.mp4')
        .replace('_12.mp4', '_320.mp4');
    }
  } catch (err) {
    console.error("Failed to decrypt URL:", err);
  }
  return undefined;
};

const mapSaavnSongToSong = (item: any): Song => {
  const primaryArtistsList = item.more_info?.artistMap?.primary_artists || item.more_info?.artistMap?.artists || [];
  const primaryArtists = primaryArtistsList.length > 0
    ? primaryArtistsList.map((a: any) => decodeHtml(a.name)).join(', ')
    : (decodeHtml(item.more_info?.music) || 'Unknown Artist');

  let thumbnail = undefined;
  if (item.image) {
    thumbnail = item.image.replace('150x150', '500x500').replace('50x50', '500x500');
  }

  // Pre-decrypt streamUrl immediately
  const streamUrl = decryptUrl(item.more_info?.encrypted_media_url);

  return {
    id: item.id,
    videoId: item.id,
    title: decodeHtml(item.title),
    artist: primaryArtists,
    album: item.more_info?.album ? decodeHtml(item.more_info.album) : undefined,
    duration: parseInt(item.more_info?.duration || '0'),
    thumbnail,
    streamUrl,
  };
};

export const searchSongs = async (query: string): Promise<Song[]> => {
  try {
    const url = `${API_URL}?__call=search.getResults&api_version=4&_format=json&p=1&n=20&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.results && Array.isArray(json.results)) {
      return json.results.map(mapSaavnSongToSong);
    }
  } catch (err) {
    console.error(`JioSaavn search failed for query "${query}":`, err);
  }
  return [];
};

export const searchPlaylists = async (query: string): Promise<PlaylistFeedItem[]> => {
  try {
    const url = `${API_URL}?__call=search.getPlaylistResults&api_version=4&_format=json&p=1&n=10&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.results && Array.isArray(json.results)) {
      return json.results.map((item: any) => ({
        id: item.id,
        title: decodeHtml(item.title),
        thumbnail: item.image ? item.image.replace('150x150', '500x500') : undefined,
        songCount: parseInt(item.more_info?.song_count || '0'),
      }));
    }
  } catch (err) {
    console.error(`JioSaavn playlist search failed for query "${query}":`, err);
  }
  return [];
};

export const getPlaylistSongs = async (playlistId: string): Promise<Song[]> => {
  try {
    const url = `${API_URL}?__call=playlist.getDetails&api_version=4&_format=json&listid=${playlistId}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.list && Array.isArray(json.list)) {
      return json.list.map(mapSaavnSongToSong);
    }
  } catch (err) {
    console.error(`JioSaavn getPlaylistSongs failed for ID "${playlistId}":`, err);
  }
  return [];
};

export const getSearchSuggestions = async (query: string): Promise<string[]> => {
  const q = query.trim();
  if (!q) return [];
  try {
    const url = `${API_URL}?__call=autocomplete.get&api_version=4&_format=json&query=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json) {
      const suggestions: string[] = [];

      // 1. Add top query
      if (json.topquery?.data && Array.isArray(json.topquery.data)) {
        for (const item of json.topquery.data) {
          if (item.title) {
            suggestions.push(decodeHtml(item.title));
          }
        }
      }

      // 2. Add songs and song + artist combos
      if (json.songs?.data && Array.isArray(json.songs.data)) {
        for (const item of json.songs.data) {
          const title = decodeHtml(item.title);
          const artist = decodeHtml(item.subtitle);
          suggestions.push(title);
          if (artist && artist !== 'Unknown Artist') {
            suggestions.push(`${title} ${artist}`);
          }
        }
      }

      // 3. Add artists
      if (json.artists?.data && Array.isArray(json.artists.data)) {
        for (const item of json.artists.data) {
          if (item.title) {
            suggestions.push(decodeHtml(item.title));
          }
        }
      }

      // 4. Add albums
      if (json.albums?.data && Array.isArray(json.albums.data)) {
        for (const item of json.albums.data) {
          if (item.title) {
            suggestions.push(decodeHtml(item.title));
          }
        }
      }

      // Clean, filter and deduplicate
      const queryLower = q.toLowerCase();
      const unique = Array.from(new Set(
        suggestions
          .map(s => s.trim())
          .filter(s => s.toLowerCase().includes(queryLower))
      )).slice(0, 6);

      return unique;
    }
  } catch (err) {
    console.error('Failed to get search suggestions:', err);
  }
  return [];
};

export const getHomeFeed = async (): Promise<HomeFeedData> => {
  let featuredPlaylists: PlaylistFeedItem[] = [];
  const songSections: HomeSection[] = [];

  try {
    // 1. Fetch Featured Playlists (search for "trending")
    const trendingPlaylists = await searchPlaylists('trending');
    featuredPlaylists = trendingPlaylists.slice(0, 6);

    // 2. Build sections using actual curated playlists
    const playlistCategories = [
      { title: 'Trending Hits', query: 'Now Trending' },
      { title: 'Bollywood Romance', query: 'Hindi Romance' },
      { title: 'Global Pop Hits', query: 'Global Hits' },
      { title: 'Lo-Fi Chillout', query: 'Lofi Chill' }
    ];

    const results = await Promise.all(
      playlistCategories.map(async (cat) => {
        try {
          const plist = await searchPlaylists(cat.query);
          if (plist.length > 0) {
            const songs = await getPlaylistSongs(plist[0].id);
            if (songs.length > 0) {
              return { title: cat.title, songs: songs.slice(0, 10) };
            }
          }
          
          const fallbackSongs = await searchSongs(cat.query);
          return { title: cat.title, songs: fallbackSongs.slice(0, 10) };
        } catch (e) {
          console.warn(`Failed to fetch category "${cat.title}":`, e);
          return { title: cat.title, songs: [] };
        }
      })
    );

    for (const res of results) {
      if (res.songs.length > 0) {
        songSections.push(res);
      }
    }
  } catch (err) {
    console.error('Failed to load home feed:', err);
  }

  if (songSections.length === 0) {
    const fallbackSongs = await searchSongs('trending');
    songSections.push({ title: 'Trending Hits', songs: fallbackSongs.slice(0, 10) });
  }

  return {
    featuredPlaylists,
    songSections,
  };
};

export const getStreamUrl = async (videoId: string): Promise<string> => {
  try {
    const url = `${API_URL}?__call=song.getDetails&api_version=4&_format=json&pids=${videoId}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const songItem = json[videoId];
    if (songItem) {
      const decrypted = decryptUrl(songItem.more_info?.encrypted_media_url);
      if (decrypted) {
        return decrypted;
      }
    }
  } catch (err) {
    console.error(`JioSaavn getStreamUrl failed for ID "${videoId}":`, err);
  }
  
  throw new Error(`Unable to resolve stream for song ID: ${videoId}`);
};

export const getRelated = async (videoId: string): Promise<Song[]> => {
  return [];
};