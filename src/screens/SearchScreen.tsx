import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { searchSongs, getSearchSuggestions } from '../services/innertube';
import { usePlayerStore } from '../store/playerStore';
import { SongRow, type Song } from '../components/common/SongRow';
import { Label, Text } from '../components/common/Text';
import { Divider } from '../components/common/Box';
import { Colors, Spacing, FontSizes } from '../theme';
import { SongMenuModal } from '../components/common/SongMenuModal';

const SUGGESTIONS = [
  'Radiohead', 'Miles Davis', 'Pink Floyd', 'The Strokes',
  'Kendrick Lamar', 'Frank Ocean', 'Bon Iver', 'LCD Soundsystem',
];

export const SearchScreen: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Autocomplete Suggestions State
  const [autocompleteList, setAutocompleteList] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Song Options Modal State
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);

  const { playSong } = usePlayerStore();

  // Debounced autocomplete search suggestion fetcher
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || searched) {
      setAutocompleteList([]);
      return;
    }

    setSuggestionsLoading(true);
    const handler = setTimeout(async () => {
      const suggestions = await getSearchSuggestions(trimmed);
      setAutocompleteList(suggestions);
      setSuggestionsLoading(false);
    }, 250); // 250ms debounce delay

    return () => clearTimeout(handler);
  }, [query, searched]);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    setAutocompleteList([]); // Clear suggestions on search submit
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

  const handleSongOptions = (song: Song) => {
    setSelectedSong(song);
    setOptionsVisible(true);
  };

  const handleSuggestionTap = (s: string) => {
    setQuery(s);
    handleSearch(s);
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
          onChangeText={(text) => {
            setQuery(text);
            if (searched) setSearched(false); // Reset search state if user edits query
          }}
          onSubmitEditing={() => handleSearch(query)}
          placeholder="Artist, song, album..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => { setQuery(''); setResults([]); setSearched(false); setAutocompleteList([]); }}
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
        {/* Loading Results */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.textMuted} />
            <Label style={{ marginTop: Spacing.base }}>SEARCHING...</Label>
          </View>
        )}

        {/* Live Autocomplete suggestions while typing */}
        {query.trim().length > 0 && !searched && !loading && (
          <View style={styles.suggestions}>
            <View style={styles.sectionHeaderRow}>
              <Label>SUGGESTED SEARCHES</Label>
              {suggestionsLoading && <ActivityIndicator size="small" color={Colors.textMuted} />}
            </View>
            <Divider />
            {autocompleteList.map((s) => (
              <React.Fragment key={s}>
                <TouchableOpacity
                  style={styles.suggestion}
                  onPress={() => handleSuggestionTap(s)}
                >
                  <View style={styles.suggestionLeft}>
                    <Text family="mono" size="sm" color={Colors.textSecondary} style={{ marginRight: Spacing.md }}>⊙</Text>
                    <Text family="serif" size="base">{s}</Text>
                  </View>
                  <Label>→</Label>
                </TouchableOpacity>
                <Divider />
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Static Suggestions (idle state - query is empty) */}
        {query.trim().length === 0 && !searched && !loading && (
          <View style={styles.suggestions}>
            <View style={styles.sectionHeader}>
              <Label>SUGGESTIONS</Label>
            </View>
            <Divider />
            {SUGGESTIONS.map((s) => (
              <React.Fragment key={s}>
                <TouchableOpacity
                  style={styles.suggestion}
                  onPress={() => handleSuggestionTap(s)}
                >
                  <View style={styles.suggestionLeft}>
                    <Text family="mono" size="sm" color={Colors.textSecondary} style={{ marginRight: Spacing.md }}>⊙</Text>
                    <Text family="serif" size="base">{s}</Text>
                  </View>
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

        {/* Playable Song Results */}
        {results.length > 0 && !loading && searched && (
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
                onOptionsPress={handleSongOptions}
              />
            ))}
          </View>
        )}

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>

      {/* Song Options Menu Modal */}
      <SongMenuModal
        visible={optionsVisible}
        song={selectedSong}
        onClose={() => setOptionsVisible(false)}
      />
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});
