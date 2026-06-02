import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
} from 'react-native';
import TrackPlayer, {
  usePlaybackState,
  useProgress,
  State,
  RepeatMode,
} from 'react-native-track-player';
import { usePlayerStore } from '../../store/playerStore';
import { Colors, Spacing, FontSizes, Layout } from '../../theme';
import { Text, Label, LyricLine } from '../common/Text';
import { Divider } from '../common/Box';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullPlayerProps {
  onClose: () => void;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// Animated music symbol when no lyrics
const MusicSymbol: React.FC = () => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.noLyricsContainer}>
      <Animated.Text style={[styles.musicSymbol, { transform: [{ scale: pulse }] }]}>
        ♪
      </Animated.Text>
      <Label style={{ marginTop: Spacing.lg }}>NO LYRICS FOUND</Label>
    </View>
  );
};

export const FullPlayer: React.FC<FullPlayerProps> = ({ onClose }) => {
  const {
    currentSong,
    lyrics,
    lyricsLoading,
    playNext,
    playPrev,
    isShuffle,
    repeatMode,
    toggleShuffle,
    toggleRepeatMode,
  } = usePlayerStore();
  const playbackState = usePlaybackState();
  const progress = useProgress(500);
  const isPlaying = playbackState.state === State.Playing;
  const lyricsRef = useRef<ScrollView>(null);
  const [activeLine, setActiveLine] = useState(0);
  const lineYPositions = useRef<{ [key: number]: number }>({});

  // Reset Y positions and scroll when lyrics change
  useEffect(() => {
    lineYPositions.current = {};
    setActiveLine(0);
    lyricsRef.current?.scrollTo({ y: 0, animated: false });
  }, [lyrics]);

  // Auto-scroll lyrics to active line
  useEffect(() => {
    if (!lyrics?.synced || !lyrics.lines.length) return;
    const currentTime = progress.position;

    let idx = 0;
    for (let i = 0; i < lyrics.lines.length; i++) {
      if (lyrics.lines[i].time <= currentTime) idx = i;
      else break;
    }

    if (idx !== activeLine) {
      setActiveLine(idx);
      const targetY = lineYPositions.current[idx];
      if (targetY !== undefined) {
        lyricsRef.current?.scrollTo({
          y: Math.max(0, targetY - SCREEN_HEIGHT * 0.25),
          animated: true,
        });
      }
    }
  }, [progress.position, lyrics, activeLine]);

  const togglePlay = async () => {
    if (isPlaying) await TrackPlayer.pause();
    else await TrackPlayer.play();
  };

  const seek = async (position: number) => {
    await TrackPlayer.seekTo(position);
  };

  if (!currentSong) return null;

  const progressPercent = progress.duration
    ? (progress.position / progress.duration) * 100
    : 0;

  return (
    <View style={styles.container}>

      {/* ── Header ─────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Label>▼ CLOSE</Label>
        </TouchableOpacity>
        <Label>NOW PLAYING</Label>
        <View style={{ width: 56 }} />
      </View>

      <Divider />

      {/* ── Song info ──────────────────────────── */}
      <View style={styles.songInfo}>
        <Text family="serif" size="2xl" weight="bold" align="center" numberOfLines={2}>
          {currentSong.title}
        </Text>
        <Text
          family="mono"
          size="sm"
          color={Colors.textSecondary}
          align="center"
          style={{ marginTop: 6 }}
        >
          {currentSong.artist}
          {currentSong.album ? `  ·  ${currentSong.album}` : ''}
        </Text>
      </View>

      <Divider />

      {/* ── Lyrics area ────────────────────────── */}
      <View style={styles.lyricsArea}>
        {lyricsLoading ? (
          <View style={styles.noLyricsContainer}>
            <Label>LOADING LYRICS...</Label>
          </View>
        ) : !lyrics ? (
          <MusicSymbol />
        ) : (
          <ScrollView
            ref={lyricsRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.lyricsContent}
          >
            {lyrics.lines.map((line, i) => (
              <LyricLine
                key={i}
                active={lyrics.synced ? i === activeLine : false}
                style={styles.lyricLine}
                align="center"
                onLayout={(e) => {
                  lineYPositions.current[i] = e.nativeEvent.layout.y;
                }}
              >
                {line.text}
              </LyricLine>
            ))}
          </ScrollView>
        )}
      </View>

      <Divider />

      {/* ── Progress bar ───────────────────────── */}
      <View style={styles.progressSection}>
        <TouchableOpacity
          style={styles.progressTrack}
          onPress={(e) => {
            const x = e.nativeEvent.locationX;
            const width = e.nativeEvent.target;
            // Simple seek on tap
            const ratio = x / 300; // approximate
            seek(ratio * progress.duration);
          }}
          activeOpacity={1}
        >
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </TouchableOpacity>

        <View style={styles.timeRow}>
          <Label>{formatTime(progress.position)}</Label>
          <Label>{formatTime(progress.duration)}</Label>
        </View>
      </View>

      {/* ── Controls ───────────────────────────── */}
      <View style={styles.controls}>
        {/* Shuffle */}
        <TouchableOpacity onPress={toggleShuffle} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Text
            family="mono"
            size="xl"
            color={isShuffle ? Colors.white : Colors.textMuted}
          >
            ⇄
          </Text>
        </TouchableOpacity>

        {/* Prev */}
        <TouchableOpacity onPress={playPrev} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Text family="mono" size="lg" color={Colors.textSecondary}>◀◀</Text>
        </TouchableOpacity>

        {/* Play/Pause — boxy square button */}
        <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
          <Text family="mono" size="xl" color={Colors.black}>
            {isPlaying ? '❙❙' : '▶'}
          </Text>
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity onPress={playNext} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Text family="mono" size="lg" color={Colors.textSecondary}>▶▶</Text>
        </TouchableOpacity>

        {/* Repeat */}
        <TouchableOpacity onPress={toggleRepeatMode} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              family="mono"
              size="xl"
              color={repeatMode !== RepeatMode.Off ? Colors.white : Colors.textMuted}
            >
              ⟳
            </Text>
            {repeatMode === RepeatMode.Track && (
              <Text
                family="mono"
                size="xs"
                color={Colors.white}
                style={{ fontSize: 10, marginLeft: 1, position: 'absolute', right: -8, top: -4 }}
              >
                1
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    height: Layout.headerHeight,
  },
  songInfo: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  lyricsArea: {
    flex: 1,
    overflow: 'hidden',
  },
  lyricsContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.lg,
  },
  lyricLine: {
    lineHeight: 32,
    paddingVertical: 4,
  },
  noLyricsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicSymbol: {
    fontSize: 96,
    color: Colors.textMuted,
    fontFamily: 'serif',
  },
  progressSection: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
  },
  progressTrack: {
    paddingVertical: Spacing.sm,
  },
  progressBar: {
    height: 1,
    backgroundColor: Colors.border,
    width: '100%',
  },
  progressFill: {
    height: 1,
    backgroundColor: Colors.white,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing['3xl'],
    paddingVertical: Spacing['2xl'],
    paddingBottom: Spacing['3xl'],
  },
  playButton: {
    width: 64,
    height: 64,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    // boxy — no border radius
  },
});
