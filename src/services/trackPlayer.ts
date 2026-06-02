// ─────────────────────────────────────────────────────
//  TrackPlayer Setup
//  npm install react-native-track-player
// ─────────────────────────────────────────────────────

import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
} from 'react-native-track-player';
import { usePlayerStore } from '../store/playerStore';

export const setupPlayer = async (): Promise<void> => {
  try {
    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 5, // 5MB audio buffer
    });

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
    });
  } catch (e) {
    // Player already set up
    console.log('Player already initialized');
  }
};

// Registered playback service — runs in background
// Register this in index.js: TrackPlayer.registerPlaybackService(() => PlaybackService)
export const PlaybackService = async () => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    usePlayerStore.getState().playNext();
  });
  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    usePlayerStore.getState().playPrev();
  });
  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => {
    TrackPlayer.seekTo(e.position);
  });
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
    usePlayerStore.getState().playNext();
  });
};
