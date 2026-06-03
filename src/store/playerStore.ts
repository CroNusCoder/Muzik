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
  originalQueue: Song[];
  isShuffle: boolean;
  repeatMode: RepeatMode;

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
  playSong: (song: Song, queue?: Song[], keepQueue?: boolean) => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  addToQueue: (song: Song) => void;
  setFullscreen: (open: boolean) => void;
  clearError: () => void;
  toggleShuffle: () => void;
  toggleRepeatMode: () => Promise<void>;
}

const shuffleArray = (array: Song[], currentSongId?: string): { shuffled: Song[], newIndex: number } => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (currentSongId) {
    const idx = arr.findIndex(s => s.id === currentSongId);
    if (idx > 0) {
      const [currentSong] = arr.splice(idx, 1);
      arr.unshift(currentSong);
    }
  }
  return { shuffled: arr, newIndex: 0 };
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  queueIndex: 0,
  originalQueue: [],
  isShuffle: false,
  repeatMode: RepeatMode.Off,
  isLoading: false,
  error: null,
  lyrics: null,
  lyricsLoading: false,
  miniPlayerVisible: false,
  fullscreenOpen: false,

  playSong: async (song: Song, queue?: Song[], keepQueue = false) => {
    set({ isLoading: true, error: null, lyrics: null });

    try {
      // Get stream URL
      const url = song.streamUrl || await getStreamUrl(song.videoId);

      if (!keepQueue) {
        const incomingQueue = queue || [song];
        let finalQueue = [...incomingQueue];
        let finalIndex = finalQueue.findIndex(s => s.id === song.id);
        if (finalIndex < 0) finalIndex = 0;

        const origQueue = [...incomingQueue];

        const { isShuffle } = get();
        if (isShuffle) {
          const { shuffled, newIndex } = shuffleArray(origQueue, song.id);
          finalQueue = shuffled;
          finalIndex = newIndex;
        }

        set({
          queue: finalQueue,
          originalQueue: origQueue,
          queueIndex: finalIndex,
        });
      } else {
        const idx = get().queue.findIndex(s => s.id === song.id);
        set({
          queueIndex: idx >= 0 ? idx : get().queueIndex,
        });
      }

      set({
        currentSong: song,
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
      await playSong(queue[nextIdx], undefined, true);
    }
  },

  playPrev: async () => {
    const { queue, queueIndex, playSong } = get();
    const prevIdx = queueIndex - 1;
    if (prevIdx >= 0) {
      await playSong(queue[prevIdx], undefined, true);
    }
  },

  addToQueue: (song: Song) => {
    set(state => ({
      queue: [...state.queue, song],
      originalQueue: [...state.originalQueue, song]
    }));
  },

  setFullscreen: (open: boolean) => {
    set({ fullscreenOpen: open });
  },

  clearError: () => set({ error: null }),

  toggleShuffle: () => {
    const { isShuffle, originalQueue, currentSong, queue } = get();
    const newShuffle = !isShuffle;

    if (newShuffle) {
      const orig = originalQueue.length > 0 ? originalQueue : [...queue];
      const { shuffled, newIndex } = shuffleArray(orig, currentSong?.id);
      set({
        isShuffle: true,
        originalQueue: orig,
        queue: shuffled,
        queueIndex: newIndex,
      });
    } else {
      const idx = originalQueue.findIndex(s => s.id === currentSong?.id);
      set({
        isShuffle: false,
        queue: [...originalQueue],
        queueIndex: idx >= 0 ? idx : 0,
      });
    }
  },

  toggleRepeatMode: async () => {
    const { repeatMode } = get();
    let nextMode = RepeatMode.Off;
    if (repeatMode === RepeatMode.Off) {
      nextMode = RepeatMode.Queue;
    } else if (repeatMode === RepeatMode.Queue) {
      nextMode = RepeatMode.Track;
    } else if (repeatMode === RepeatMode.Track) {
      nextMode = RepeatMode.Off;
    }

    await TrackPlayer.setRepeatMode(nextMode);
    set({ repeatMode: nextMode });
  },
}));
