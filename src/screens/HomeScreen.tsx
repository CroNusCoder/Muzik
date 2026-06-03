import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { getHomeFeed, getPlaylistSongs, type HomeSection, type PlaylistFeedItem } from '../services/innertube';
import { usePlayerStore } from '../store/playerStore';
import { usePlaylistStore } from '../store/playlistStore';
import { SongRow, type Song } from '../components/common/SongRow';
import { Text, Title, Label } from '../components/common/Text';
import { Divider } from '../components/common/Box';
import { Colors, Spacing, Layout, FontSizes, BorderRadius } from '../theme';
import { SongMenuModal } from '../components/common/SongMenuModal';

export const HomeScreen: React.FC = () => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<PlaylistFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Playlist detail modal state
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistFeedItem | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [playlistSongsLoading, setPlaylistSongsLoading] = useState(false);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);

  // Song options modal state
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);

  const { playSong } = usePlayerStore();
  const { loadPlaylists } = usePlaylistStore();

  useEffect(() => {
    loadHome();
    loadPlaylists(); // pre-load local playlists
  }, []);

  const loadHome = async () => {
    setLoading(true);
    try {
      const data = await getHomeFeed();
      setSections(data.songSections);
      setFeaturedPlaylists(data.featuredPlaylists);
    } catch (e) {
      console.warn('Home feed failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (song: Song, queue: Song[]) => {
    playSong(song, queue);
  };

  const handlePlaylistTap = async (playlist: PlaylistFeedItem) => {
    setSelectedPlaylist(playlist);
    setPlaylistModalVisible(true);
    setPlaylistSongsLoading(true);
    setPlaylistSongs([]);
    try {
      const songs = await getPlaylistSongs(playlist.id);
      setPlaylistSongs(songs);
    } catch (e) {
      console.warn('Failed to load playlist songs:', e);
    } finally {
      setPlaylistSongsLoading(false);
    }
  };

  const handlePlayWholePlaylist = () => {
    if (playlistSongs.length > 0) {
      playSong(playlistSongs[0], playlistSongs);
      setPlaylistModalVisible(false);
    }
  };

  const handleSongOptions = (song: Song) => {
    setSelectedSong(song);
    setOptionsVisible(true);
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
          {/* Featured Playlists Carousel */}
          {featuredPlaylists.length > 0 && (
            <View style={styles.carouselContainer}>
              <View style={styles.sectionHeader}>
                <Label>FEATURED PLAYLISTS</Label>
              </View>
              <Divider />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselScroll}
              >
                {featuredPlaylists.map((playlist) => (
                  <TouchableOpacity
                    key={playlist.id}
                    style={styles.playlistCard}
                    activeOpacity={0.8}
                    onPress={() => handlePlaylistTap(playlist)}
                  >
                    {playlist.thumbnail ? (
                      <Image source={{ uri: playlist.thumbnail }} style={styles.playlistImage} />
                    ) : (
                      <View style={[styles.playlistImage, styles.playlistPlaceholder]}>
                        <Text family="serif" size="xl" weight="bold">{playlist.title.charAt(0)}</Text>
                      </View>
                    )}
                    <Text family="serif" size="sm" weight="medium" numberOfLines={1} style={styles.playlistTitle}>
                      {playlist.title}
                    </Text>
                    <Label style={styles.playlistSongsCount}>{playlist.songCount} SONGS</Label>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.sectionGap} />
            </View>
          )}

          {/* Featured Songs Sections */}
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
                  onPress={(s: Song) => handlePlay(s, section.songs)}
                  onOptionsPress={handleSongOptions}
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

      {/* Playlist Details Modal */}
      <Modal
        visible={playlistModalVisible}
        animationType="slide"
        onRequestClose={() => setPlaylistModalVisible(false)}
      >
        <View style={styles.modalRoot}>
          {selectedPlaylist && (
            <>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setPlaylistModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Text family="mono" size="xs" color={Colors.textSecondary}>← CLOSE</Text>
                </TouchableOpacity>
                <Label>PLAYLIST DETAILS</Label>
              </View>
              <Divider />

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Playlist Info Box */}
                <View style={styles.playlistInfoBox}>
                  {selectedPlaylist.thumbnail ? (
                    <Image source={{ uri: selectedPlaylist.thumbnail }} style={styles.largePlaylistImage} />
                  ) : (
                    <View style={[styles.largePlaylistImage, styles.playlistPlaceholder]}>
                      <Text family="serif" size="3xl" weight="bold">{selectedPlaylist.title.charAt(0)}</Text>
                    </View>
                  )}
                  <Title style={{ marginTop: Spacing.base, textAlign: 'center' }}>{selectedPlaylist.title}</Title>
                  <Label style={{ marginTop: Spacing.xs }}>CURATED PLAYLIST · {selectedPlaylist.songCount} SONGS</Label>

                  {playlistSongs.length > 0 && (
                    <TouchableOpacity
                      style={styles.playButton}
                      activeOpacity={0.8}
                      onPress={handlePlayWholePlaylist}
                    >
                      <Text family="mono" size="sm" weight="bold" color={Colors.black}>▶  PLAY PLAYLIST</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Divider />

                {/* Tracklist */}
                {playlistSongsLoading ? (
                  <View style={styles.playlistLoader}>
                    <ActivityIndicator color={Colors.textMuted} />
                    <Label style={{ marginTop: Spacing.base }}>LOADING SONGS...</Label>
                  </View>
                ) : (
                  <View>
                    {playlistSongs.map((song, idx) => (
                      <SongRow
                        key={song.id}
                        song={song}
                        index={idx + 1}
                        showIndex
                        onPress={(s: Song) => handlePlay(s, playlistSongs)}
                        onOptionsPress={handleSongOptions}
                      />
                    ))}
                  </View>
                )}
                
                <View style={{ height: Spacing['4xl'] }} />
              </ScrollView>
            </>
          )}
        </View>
      </Modal>

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
  carouselContainer: {},
  carouselScroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    gap: Spacing.base,
  },
  playlistCard: {
    width: 120,
    marginTop: Spacing.sm,
  },
  playlistImage: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playlistPlaceholder: {
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistTitle: {
    marginTop: Spacing.sm,
    color: Colors.textPrimary,
  },
  playlistSongsCount: {
    fontSize: 9,
    marginTop: 2,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    height: Layout.headerHeight,
  },
  modalCloseButton: {
    paddingVertical: 4,
  },
  playlistInfoBox: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.base,
  },
  largePlaylistImage: {
    width: 180,
    height: 180,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.sm,
  },
  playlistLoader: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
});
