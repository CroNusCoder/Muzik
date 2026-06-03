import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Song } from '../components/common/SongRow';

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  createdAt: number;
}

interface PlaylistState {
  playlists: Playlist[];
  loading: boolean;
  loadPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<string>;
  deletePlaylist: (id: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, song: Song) => Promise<boolean>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  renamePlaylist: (playlistId: string, newName: string) => Promise<void>;
}

const PLAYLISTS_KEY = 'muzik_playlists';

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  loading: true,

  loadPlaylists: async () => {
    try {
      const raw = await AsyncStorage.getItem(PLAYLISTS_KEY);
      const playlists = raw ? JSON.parse(raw) : [];
      set({ playlists, loading: false });
    } catch (err) {
      console.warn('Failed to load playlists from storage:', err);
      set({ playlists: [], loading: false });
    }
  },

  createPlaylist: async (name: string) => {
    const newPlaylist: Playlist = {
      id: String(Date.now()),
      name: name.trim(),
      songs: [],
      createdAt: Date.now(),
    };

    const updated = [...get().playlists, newPlaylist];
    try {
      await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
      set({ playlists: updated });
    } catch (err) {
      console.warn('Failed to save created playlist to storage:', err);
    }
    return newPlaylist.id;
  },

  deletePlaylist: async (id: string) => {
    const updated = get().playlists.filter(p => p.id !== id);
    try {
      await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
      set({ playlists: updated });
    } catch (err) {
      console.warn('Failed to save playlists after delete to storage:', err);
    }
  },

  addSongToPlaylist: async (playlistId: string, song: Song) => {
    const playlists = get().playlists;
    const idx = playlists.findIndex(p => p.id === playlistId);
    if (idx === -1) return false;

    const playlist = playlists[idx];
    // Avoid duplicates
    if (playlist.songs.some(s => s.id === song.id)) {
      return false;
    }

    const updatedPlaylist = {
      ...playlist,
      songs: [...playlist.songs, song],
    };
    const updated = [...playlists];
    updated[idx] = updatedPlaylist;

    try {
      await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
      set({ playlists: updated });
      return true;
    } catch (err) {
      console.warn('Failed to add song to playlist in storage:', err);
      return false;
    }
  },

  removeSongFromPlaylist: async (playlistId: string, songId: string) => {
    const playlists = get().playlists;
    const idx = playlists.findIndex(p => p.id === playlistId);
    if (idx === -1) return;

    const playlist = playlists[idx];
    const updatedPlaylist = {
      ...playlist,
      songs: playlist.songs.filter(s => s.id !== songId),
    };
    const updated = [...playlists];
    updated[idx] = updatedPlaylist;

    try {
      await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
      set({ playlists: updated });
    } catch (err) {
      console.warn('Failed to remove song from playlist in storage:', err);
    }
  },

  renamePlaylist: async (playlistId: string, newName: string) => {
    const playlists = get().playlists;
    const idx = playlists.findIndex(p => p.id === playlistId);
    if (idx === -1) return;

    const playlist = playlists[idx];
    const updatedPlaylist = {
      ...playlist,
      name: newName.trim(),
    };
    const updated = [...playlists];
    updated[idx] = updatedPlaylist;

    try {
      await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
      set({ playlists: updated });
    } catch (err) {
      console.warn('Failed to rename playlist in storage:', err);
    }
  },
}));
