import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { getHomeFeed, type HomeSection } from '../services/innertube';
import { usePlayerStore } from '../store/playerStore';
import { SongRow, type Song } from '../components/common/SongRow';
import { Text, Title, Label } from '../components/common/Text';
import { Divider } from '../components/common/Box';
import { Colors, Spacing, Layout, FontSizes } from '../theme';

export const HomeScreen: React.FC = () => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayerStore();

  useEffect(() => {
    loadHome();
  }, []);

  const loadHome = async () => {
    setLoading(true);
    try {
      const data = await getHomeFeed();
      setSections(data);
    } catch (e) {
      console.warn('Home feed failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (song: Song, section: HomeSection) => {
    playSong(song, section.songs);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text family="serif" size="3xl" weight="bold" letterSpacing={-1}>
          Listen.
        </Text>
        <Text family="mono" size="xs" color={Colors.textMuted} uppercase letterSpacing={2}>
          YOUR MUSIC
        </Text>
      </View>

      <Divider />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.textMuted} />
          <Label style={{ marginTop: Spacing.base }}>LOADING FEED...</Label>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {sections.map((section, i) => (
            <View key={i} style={styles.section}>
              {/* Section header */}
              <View style={styles.sectionHeader}>
                <Label>{section.title.toUpperCase()}</Label>
              </View>
              <Divider />

              {/* Songs */}
              {section.songs.slice(0, 8).map((song: Song, j: number) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={j + 1}
                  showIndex
                  onPress={(s: Song) => handlePlay(s, section)}
                />
              ))}

              {i < sections.length - 1 && (
                <View style={styles.sectionGap} />
              )}
            </View>
          ))}

          <View style={{ height: Spacing['4xl'] }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.base,
    gap: 4,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  scrollContent: {
    paddingTop: Spacing.base,
  },
  section: {},
  sectionHeader: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  sectionGap: {
    height: Spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing['2xl'],
  },
});
