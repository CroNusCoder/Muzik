import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Box } from './Box';
import { SongTitle, Subtitle, Label } from './Text';
import { Divider } from './Box';
import { Colors, Spacing, FontSizes } from '../../theme';

export interface Song {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number; // seconds
  thumbnail?: string;
}

interface SongRowProps {
  song: Song;
  index?: number;
  onPress: (song: Song) => void;
  showIndex?: boolean;
  showDuration?: boolean;
  active?: boolean;
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const SongRow: React.FC<SongRowProps> = ({
  song,
  index,
  onPress,
  showIndex = false,
  showDuration = true,
  active = false,
}) => {
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => onPress(song)}
        style={styles.container}
      >
        {/* Index or playing indicator */}
        {showIndex && (
          <Box style={styles.indexBox} center>
            <Label
              color={active ? Colors.white : Colors.textMuted}
              style={{ fontSize: FontSizes.xs }}
            >
              {active ? '▶' : String(index ?? '').padStart(2, '0')}
            </Label>
          </Box>
        )}

        {/* Title + Artist */}
        <Box style={styles.info} flex={1}>
          <SongTitle
            numberOfLines={1}
            color={active ? Colors.white : Colors.textPrimary}
          >
            {song.title}
          </SongTitle>
          <Subtitle numberOfLines={1}>
            {song.artist}
            {song.album ? `  ·  ${song.album}` : ''}
          </Subtitle>
        </Box>

        {/* Duration */}
        {showDuration && (
          <Label style={styles.duration}>
            {formatDuration(song.duration)}
          </Label>
        )}
      </TouchableOpacity>
      <Divider />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  indexBox: {
    width: 24,
  },
  info: {
    gap: 3,
  },
  duration: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    minWidth: 36,
    textAlign: 'right',
  },
});
