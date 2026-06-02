// ─────────────────────────────────────────────────────
//  Player Store — Zustand global state
//  npm install zustand
// ─────────────────────────────────────────────────────

import { create } from 'zustand';
import TrackPlayer, {
  State,
  RepeatMode,
  usePlaybackState,
  useProgress,
} from 'react-native-track-player';
import type { Song } from '../components/common/SongRow';
import { getStreamUrl } from '../services/innertube';
import { getLyrics, type LyricsResult } from '../services/lyrics';
import { recordPlay } from '../services/stats';

interface PlayerState {
  // Current song
  currentSong: Song | null;
  queue: Song[];
  queueIndex: number;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Lyrics
  lyrics: LyricsResult | null;
  lyricsLoading: boolean;

  // Player visible state
  miniPlayerVisible: boolean;
  fullscreenOpen: boolean;

  // Actions
  playSong: (song: Song, queue?: Song[]) => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  addToQueue: (song: Song) => void;
  setFullscreen: (open: boolean) => void;
  clearError: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  queueIndex: 0,
  isLoading: false,
  error: null,
  lyrics: null,
  lyricsLoading: false,
  miniPlayerVisible: false,
  fullscreenOpen: false,

  playSong: async (song: Song, queue?: Song[]) => {
    set({ isLoading: true, error: null, lyrics: null });

    try {
      // Get stream URL
      const url = await getStreamUrl(song.videoId);

      // Set up queue in store
      const newQueue = queue || [song];
      const idx = newQueue.findIndex(s => s.id === song.id);

      set({
        currentSong: song,
        queue: newQueue,
        queueIndex: idx >= 0 ? idx : 0,
        miniPlayerVisible: true,
      });

      // Play via TrackPlayer
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: song.videoId,
        url,
        title: song.title,
        artist: song.artist,
        artwork: song.thumbnail,
        duration: song.duration,
      });
      await TrackPlayer.play();

      set({ isLoading: false });

      // Record stat (fire and forget)
      recordPlay(song.videoId, song.title, song.artist, song.duration || 0);

      // Fetch lyrics in background
      set({ lyricsLoading: true });
      const lyrics = await getLyrics(song.title, song.artist, song.duration);
      set({ lyrics, lyricsLoading: false });

    } catch (e: any) {
      set({ isLoading: false, error: e?.message || 'Playback failed' });
    }
  },

  playNext: async () => {
    const { queue, queueIndex, playSong } = get();
    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      await playSong(queue[nextIdx], queue);
      set({ queueIndex: nextIdx });
    }
  },

  playPrev: async () => {
    const { queue, queueIndex, playSong } = get();
    const prevIdx = queueIndex - 1;
    if (prevIdx >= 0) {
      await playSong(queue[prevIdx], queue);
      set({ queueIndex: prevIdx });
    }
  },

  addToQueue: (song: Song) => {
    set(state => ({ queue: [...state.queue, song] }));
  },

  setFullscreen: (open: boolean) => {
    set({ fullscreenOpen: open });
  },

  clearError: () => set({ error: null }),
}));
