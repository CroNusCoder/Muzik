import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import TrackPlayer, {
  usePlaybackState,
  State,
} from 'react-native-track-player';
import { usePlayerStore } from '../../store/playerStore';
import { Colors, Layout, Spacing, FontSizes } from '../../theme';
import { Text } from '../common/Text';
import { Divider } from '../common/Box';

interface MiniPlayerProps {
  onPress: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress }) => {
  const { currentSong, miniPlayerVisible, playNext } = usePlayerStore();
  const playbackState = usePlaybackState();
  const isPlaying = playbackState.state === State.Playing;

  if (!miniPlayerVisible || !currentSong) return null;

  const togglePlay = async () => {
    if (isPlaying) await TrackPlayer.pause();
    else await TrackPlayer.play();
  };

  return (
    <>
      <Divider color={Colors.border} />
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.container}
      >
        {/* Left — title + artist */}
        <View style={styles.info}>
          <Text
            family="serif"
            size="sm"
            weight="regular"
            numberOfLines={1}
            color={Colors.textPrimary}
          >
            {currentSong.title}
          </Text>
          <Text
            family="mono"
            size="xs"
            color={Colors.textMuted}
            numberOfLines={1}
          >
            {currentSong.artist}
          </Text>
        </View>

        {/* Right — controls */}
        <View style={styles.controls}>
          {/* Play/Pause */}
          <TouchableOpacity
            onPress={togglePlay}
            style={styles.controlBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 8 }}
          >
            <Text family="mono" size="base" color={Colors.white}>
              {isPlaying ? '❙❙' : '▶'}
            </Text>
          </TouchableOpacity>

          {/* Next */}
          <TouchableOpacity
            onPress={playNext}
            style={styles.controlBtn}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }}
          >
            <Text family="mono" size="sm" color={Colors.textSecondary}>
              ▶▶
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Layout.miniPlayerHeight,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
