import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { searchSongs } from '../services/innertube';
import { usePlayerStore } from '../store/playerStore';
import { SongRow, type Song } from '../components/common/SongRow';
import { Label, Text } from '../components/common/Text';
import { Divider } from '../components/common/Box';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';

const SUGGESTIONS = [
  'Radiohead', 'Miles Davis', 'Pink Floyd', 'The Strokes',
  'Kendrick Lamar', 'Frank Ocean', 'Bon Iver', 'LCD Soundsystem',
];

export const SearchScreen: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { playSong } = usePlayerStore();

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchSongs(q.trim());
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePlay = (song: Song) => {
    playSong(song, results);
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text family="serif" size="2xl" weight="bold">Search.</Text>
      </View>

      <Divider />

      {/* Search input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSearch(query)}
          placeholder="Artist, song, album..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => { setQuery(''); setResults([]); setSearched(false); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Label>✕</Label>
          </TouchableOpacity>
        )}
      </View>

      <Divider />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.textMuted} />
            <Label style={{ marginTop: Spacing.base }}>SEARCHING...</Label>
          </View>
        )}

        {/* Suggestions (idle state) */}
        {!searched && !loading && (
          <View style={styles.suggestions}>
            <View style={styles.sectionHeader}>
              <Label>SUGGESTIONS</Label>
            </View>
            <Divider />
            {SUGGESTIONS.map((s, i) => (
              <React.Fragment key={s}>
                <TouchableOpacity
                  style={styles.suggestion}
                  onPress={() => { setQuery(s); handleSearch(s); }}
                >
                  <Text family="serif" size="base">{s}</Text>
                  <Label>→</Label>
                </TouchableOpacity>
                <Divider />
              </React.Fragment>
            ))}
          </View>
        )}

        {/* No results */}
        {searched && !loading && results.length === 0 && (
          <View style={styles.center}>
            <Text family="serif" size="xl" color={Colors.textMuted}>Nothing found.</Text>
            <Label style={{ marginTop: Spacing.sm }}>TRY ANOTHER QUERY</Label>
          </View>
        )}

        {/* Results */}
        {results.length > 0 && !loading && (
          <View>
            <View style={styles.sectionHeader}>
              <Label>{results.length} RESULTS</Label>
            </View>
            <Divider />
            {results.map((song, i) => (
              <SongRow
                key={song.id}
                song={song}
                index={i + 1}
                showIndex
                onPress={handlePlay}
              />
            ))}
          </View>
        )}

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>
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
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: 'SpaceMono-Regular',
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  center: {
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
    gap: Spacing.sm,
  },
  suggestions: {},
  sectionHeader: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
});
