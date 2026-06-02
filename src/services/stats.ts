// ─────────────────────────────────────────────
//  Stats Service — local tracking with AsyncStorage
//  npm install @react-native-async-storage/async-storage
// ─────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  totalSongs: 'stats_total_songs',
  totalSeconds: 'stats_total_seconds',
  history: 'stats_history',         // last 100 songs
  firstPlayed: 'stats_first_played',
};

export interface Stats {
  totalSongs: number;
  totalMinutes: number;
  totalHours: number;
  firstPlayedAt: string | null;
}

export interface HistoryEntry {
  videoId: string;
  title: string;
  artist: string;
  playedAt: number;   // timestamp ms
  duration: number;   // seconds
}

// Record a song play
export const recordPlay = async (
  videoId: string,
  title: string,
  artist: string,
  duration: number
): Promise<void> => {
  try {
    // Increment total songs
    const totalSongs = parseInt(await AsyncStorage.getItem(KEYS.totalSongs) || '0');
    await AsyncStorage.setItem(KEYS.totalSongs, String(totalSongs + 1));

    // Add to total seconds
    const totalSeconds = parseInt(await AsyncStorage.getItem(KEYS.totalSeconds) || '0');
    await AsyncStorage.setItem(KEYS.totalSeconds, String(totalSeconds + duration));

    // First played timestamp
    const firstPlayed = await AsyncStorage.getItem(KEYS.firstPlayed);
    if (!firstPlayed) {
      await AsyncStorage.setItem(KEYS.firstPlayed, new Date().toISOString());
    }

    // Add to history (keep last 100)
    const historyRaw = await AsyncStorage.getItem(KEYS.history);
    const history: HistoryEntry[] = historyRaw ? JSON.parse(historyRaw) : [];
    history.unshift({ videoId, title, artist, playedAt: Date.now(), duration });
    if (history.length > 100) history.splice(100);
    await AsyncStorage.setItem(KEYS.history, JSON.stringify(history));
  } catch (e) {
    console.warn('Stats record failed:', e);
  }
};

// Get all stats
export const getStats = async (): Promise<Stats> => {
  try {
    const [totalSongsRaw, totalSecondsRaw, firstPlayedAt] = await Promise.all([
      AsyncStorage.getItem(KEYS.totalSongs),
      AsyncStorage.getItem(KEYS.totalSeconds),
      AsyncStorage.getItem(KEYS.firstPlayed),
    ]);

    const totalSeconds = parseInt(totalSecondsRaw || '0');
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);

    return {
      totalSongs: parseInt(totalSongsRaw || '0'),
      totalMinutes,
      totalHours,
      firstPlayedAt,
    };
  } catch {
    return { totalSongs: 0, totalMinutes: 0, totalHours: 0, firstPlayedAt: null };
  }
};

// Get recent history
export const getHistory = async (): Promise<HistoryEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.history);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// Reset stats (for testing)
export const resetStats = async (): Promise<void> => {
  await (AsyncStorage as any).multiRemove(Object.values(KEYS));
};
