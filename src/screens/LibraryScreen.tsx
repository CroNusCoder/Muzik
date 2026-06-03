import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getStats, getHistory, type Stats, type HistoryEntry } from '../services/stats';
import { usePlayerStore } from '../store/playerStore';
import { usePlaylistStore, type Playlist } from '../store/playlistStore';
import { Text, Label, StatNumber, Title, SongTitle, Subtitle } from '../components/common/Text';
import { Divider } from '../components/common/Box';
import { Colors, Spacing, FontSizes, BorderRadius, Layout } from '../theme';
import { SongRow, type Song } from '../components/common/SongRow';
import { SongMenuModal } from '../components/common/SongMenuModal';
import { importSpotifyPlaylist } from '../services/spotify';

const formatDate = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const StatBlock: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <View style={styles.statBlock}>
    <StatNumber>{value}</StatNumber>
    <Label style={{ marginTop: 4 }}>{label}</Label>
  </View>
);

export const LibraryScreen: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Custom Playlists State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistDetailVisible, setPlaylistDetailVisible] = useState(false);

  // Spotify Import State
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgressText, setImportProgressText] = useState('');

  // Song Options Modal State (for recently played history songs)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [optionsVisible, setOptionsVisible] = useState(false);

  const { playSong } = usePlayerStore();
  const { playlists, loadPlaylists, createPlaylist, deletePlaylist, removeSongFromPlaylist, addSongToPlaylist } = usePlaylistStore();

  const load = useCallback(async () => {
    const [s, h] = await Promise.all([getStats(), getHistory()]);
    setStats(s);
    setHistory(h);
    await loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCreatePlaylist = async () => {
    const name = newPlaylistName.trim();
    if (!name) return;
    await createPlaylist(name);
    setNewPlaylistName('');
    setCreateModalVisible(false);
  };

  const handleImportPlaylist = async () => {
    const url = importUrl.trim();
    if (!url) return;
    
    setIsImporting(true);
    setImportProgressText('Connecting to Spotify...');
    
    try {
      const result = await importSpotifyPlaylist(url, (current, total, songTitle) => {
        setImportProgressText(`Matching track ${current} of ${total}\n"${songTitle}"`);
      });
      
      if (result.matchedSongs.length === 0) {
        Alert.alert("Import Failed", "Could not match any songs from the Spotify playlist on JioSaavn.");
      } else {
        // Create the local playlist
        const playlistName = `Spotify: ${result.playlistName}`;
        const playlistId = await createPlaylist(playlistName);
        
        // Add all matched songs
        for (const song of result.matchedSongs) {
          await addSongToPlaylist(playlistId, song);
        }
        
        // Reload playlists list
        await loadPlaylists();
        
        Alert.alert(
          "Import Successful! 🎉",
          `Imported "${result.playlistName}" playlist.\nMatched ${result.matchedSongs.length} of ${result.totalTracks} songs.`
        );
      }
      
      setImportUrl('');
      setImportModalVisible(false);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Import Error", err.message || "Failed to import Spotify playlist.");
    } finally {
      setIsImporting(false);
      setImportProgressText('');
    }
  };

  const handlePlaylistTap = (playlist: Playlist) => {
    // Refresh selected playlist state from store to ensure we have up to date songs
    const current = playlists.find(p => p.id === playlist.id);
    setSelectedPlaylist(current || playlist);
    setPlaylistDetailVisible(true);
  };

  const handleDeletePlaylist = () => {
    if (!selectedPlaylist) return;
    Alert.alert(
      'DELETE PLAYLIST',
      `Are you sure you want to delete "${selectedPlaylist.name.toUpperCase()}"?`,
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'DELETE',
          style: 'destructive',
          onPress: async () => {
            await deletePlaylist(selectedPlaylist.id);
            setPlaylistDetailVisible(false);
            setSelectedPlaylist(null);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handlePlayWholePlaylist = () => {
    if (selectedPlaylist && selectedPlaylist.songs.length > 0) {
      playSong(selectedPlaylist.songs[0], selectedPlaylist.songs);
      setPlaylistDetailVisible(false);
    }
  };

  const handleRemoveSong = (song: Song) => {
    if (!selectedPlaylist) return;
    Alert.alert(
      'REMOVE TRACK',
      `Remove "${song.title.toUpperCase()}" from this playlist?`,
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'REMOVE',
          style: 'destructive',
          onPress: async () => {
            await removeSongFromPlaylist(selectedPlaylist.id, song.id);
            // Refresh detail modal view state
            const updated = playlists.find(p => p.id === selectedPlaylist.id);
            setSelectedPlaylist(updated || null);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleHistoryPlay = (entry: HistoryEntry) => {
    // Construct a temporary Song object from HistoryEntry
    const song: Song = {
      id: entry.videoId,
      videoId: entry.videoId,
      title: entry.title,
      artist: entry.artist,
      duration: entry.duration,
    };
    playSong(song);
  };

  const handleHistoryOptions = (entry: HistoryEntry) => {
    const song: Song = {
      id: entry.videoId,
      videoId: entry.videoId,
      title: entry.title,
      artist: entry.artist,
      duration: entry.duration,
    };
    setSelectedSong(song);
    setOptionsVisible(true);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.textMuted}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text family="serif" size="3xl" weight="bold">Library.</Text>
        </View>

        <Divider />

        {/* ── Stats Section ──────────────────────── */}
        <View style={styles.sectionHeader}>
          <Label>YOUR STATS</Label>
        </View>

        <Divider />

        {stats && (
          <View style={styles.statsGrid}>
            <StatBlock
              value={String(stats.totalSongs)}
              label="SONGS PLAYED"
            />
            <View style={styles.statDivider} />
            <StatBlock
              value={
                stats.totalHours >= 1
                  ? `${stats.totalHours}h ${stats.totalMinutes % 60}m`
                  : `${stats.totalMinutes}m`
              }
              label="TIME LISTENED"
            />
          </View>
        )}

        <Divider />

        {stats?.firstPlayedAt && (
          <View style={styles.firstPlayed}>
            <Label>LISTENING SINCE</Label>
            <Text family="mono" size="sm" color={Colors.textSecondary} style={{ marginTop: 4 }}>
              {new Date(stats.firstPlayedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}

        <Divider />

        {/* ── Playlists Section ──────────────────── */}
        <View style={{ height: Spacing['xl'] }} />
        <View style={styles.sectionHeaderRow}>
          <Label>YOUR PLAYLISTS</Label>
          <View style={{ flexDirection: 'row', gap: Spacing.base }}>
            <TouchableOpacity onPress={() => setCreateModalVisible(true)}>
              <Text family="mono" size="xs" color={Colors.white} weight="bold">＋ CREATE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setImportModalVisible(true)}>
              <Text family="mono" size="xs" color={Colors.white} weight="bold">＋ IMPORT</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Divider />

        {playlists.map((playlist) => (
          <React.Fragment key={playlist.id}>
            <TouchableOpacity
              style={styles.playlistRow}
              activeOpacity={0.7}
              onPress={() => handlePlaylistTap(playlist)}
            >
              {/* Retro Typographic Artwork */}
              <View style={styles.playlistArtwork}>
                <Text family="serif" size="lg" weight="bold" color={Colors.white}>
                  {playlist.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.playlistInfo}>
                <SongTitle numberOfLines={1}>{playlist.name}</SongTitle>
                <Subtitle>{playlist.songs.length} SONGS</Subtitle>
              </View>
              <Label>→</Label>
            </TouchableOpacity>
            <Divider />
          </React.Fragment>
        ))}

        {playlists.length === 0 && (
          <View style={styles.empty}>
            <Text family="serif" size="lg" color={Colors.textMuted}>No playlists.</Text>
            <Label style={{ marginTop: Spacing.sm }}>CREATE PLAYLISTS TO GROUP YOUR MUSIC</Label>
          </View>
        )}

        <Divider />

        {/* ── History Section ────────────────────── */}
        <View style={{ height: Spacing['2xl'] }} />

        <View style={styles.sectionHeader}>
          <Label>RECENTLY PLAYED</Label>
        </View>

        <Divider />

        {history.length === 0 ? (
          <View style={styles.empty}>
            <Text family="serif" size="lg" color={Colors.textMuted}>Nothing yet.</Text>
            <Label style={{ marginTop: Spacing.sm }}>START LISTENING TO BUILD HISTORY</Label>
          </View>
        ) : (
          history.map((entry) => (
            <React.Fragment key={`${entry.videoId}-${entry.playedAt}`}>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => handleHistoryPlay(entry)}
                onLongPress={() => handleHistoryOptions(entry)}
                style={styles.historyRow}
              >
                <View style={styles.historyInfo}>
                  <Text family="serif" size="base" numberOfLines={1}>
                    {entry.title}
                  </Text>
                  <Text family="mono" size="xs" color={Colors.textMuted} numberOfLines={1}>
                    {entry.artist}
                  </Text>
                </View>
                <View style={styles.historyRight}>
                  <Label style={{ marginRight: Spacing.xs }}>{formatDate(entry.playedAt)}</Label>
                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => handleHistoryOptions(entry)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Label style={{ fontSize: FontSizes.lg, color: Colors.textSecondary }}>⋮</Label>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              <Divider />
            </React.Fragment>
          ))
        )}

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>

      {/* Playlist Creation Dialog Modal */}
      <Modal
        transparent
        visible={createModalVisible}
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.dialogOverlay}
          activeOpacity={1}
          onPress={() => setCreateModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.dialogCard}>
            <Title>NEW PLAYLIST</Title>
            <Divider style={{ marginVertical: Spacing.md }} />
            <TextInput
              style={styles.dialogInput}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              placeholder="Name your playlist..."
              placeholderTextColor={Colors.textMuted}
              autoFocus
              maxLength={30}
            />
            <Divider style={{ marginVertical: Spacing.md }} />
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.dialogButton}
                onPress={() => { setCreateModalVisible(false); setNewPlaylistName(''); }}
              >
                <Label>CANCEL</Label>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogButton, !newPlaylistName.trim() && { opacity: 0.4 }]}
                onPress={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
              >
                <Text family="mono" size="xs" color={Colors.white} weight="bold">CREATE</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Spotify Import Dialog Modal */}
      <Modal
        transparent
        visible={importModalVisible}
        animationType="fade"
        onRequestClose={() => { if (!isImporting) setImportModalVisible(false); }}
      >
        <TouchableOpacity
          style={styles.dialogOverlay}
          activeOpacity={1}
          onPress={() => { if (!isImporting) setImportModalVisible(false); }}
          disabled={isImporting}
        >
          <TouchableOpacity activeOpacity={1} style={styles.dialogCard}>
            <Title>IMPORT FROM SPOTIFY</Title>
            <Divider style={{ marginVertical: Spacing.md }} />
            
            {isImporting ? (
              <View style={{ alignItems: 'center', paddingVertical: Spacing.base }}>
                <ActivityIndicator size="small" color={Colors.white} />
                <Text family="mono" size="xs" align="center" style={{ marginTop: Spacing.md, lineHeight: 18 }}>
                  {importProgressText}
                </Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.dialogInput}
                  value={importUrl}
                  onChangeText={setImportUrl}
                  placeholder="Paste Spotify playlist URL..."
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Divider style={{ marginVertical: Spacing.md }} />
                <View style={styles.dialogButtons}>
                  <TouchableOpacity
                    style={styles.dialogButton}
                    onPress={() => { setImportModalVisible(false); setImportUrl(''); }}
                  >
                    <Label>CANCEL</Label>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dialogButton, !importUrl.trim() && { opacity: 0.4 }]}
                    onPress={handleImportPlaylist}
                    disabled={!importUrl.trim()}
                  >
                    <Text family="mono" size="xs" color={Colors.white} weight="bold">IMPORT</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Playlist Details Modal */}
      <Modal
        visible={playlistDetailVisible}
        animationType="slide"
        onRequestClose={() => { setPlaylistDetailVisible(false); setSelectedPlaylist(null); }}
      >
        <View style={styles.modalRoot}>
          {selectedPlaylist && (
            <>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => { setPlaylistDetailVisible(false); setSelectedPlaylist(null); }}
                  style={styles.modalCloseButton}
                >
                  <Text family="mono" size="xs" color={Colors.textSecondary}>← CLOSE</Text>
                </TouchableOpacity>
                <Label>MY PLAYLIST</Label>
              </View>
              <Divider />

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Playlist Info Box */}
                <View style={styles.playlistInfoBox}>
                  <View style={styles.largePlaylistArtwork}>
                    <Text family="serif" size="4xl" weight="bold" color={Colors.white}>
                      {selectedPlaylist.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Title style={{ marginTop: Spacing.base, textAlign: 'center' }}>{selectedPlaylist.name}</Title>
                  <Label style={{ marginTop: Spacing.xs }}>LOCAL PLAYLIST · {selectedPlaylist.songs.length} SONGS</Label>

                  <View style={styles.actionButtonsRow}>
                    {selectedPlaylist.songs.length > 0 && (
                      <TouchableOpacity
                        style={styles.playButton}
                        activeOpacity={0.8}
                        onPress={handlePlayWholePlaylist}
                      >
                        <Text family="mono" size="sm" weight="bold" color={Colors.black}>▶  PLAY ALL</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      activeOpacity={0.8}
                      onPress={handleDeletePlaylist}
                    >
                      <Text family="mono" size="sm" weight="bold" color={Colors.textSecondary}>✕  DELETE</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Divider />

                {/* Tracklist */}
                {selectedPlaylist.songs.length === 0 ? (
                  <View style={styles.emptyPlaylistTracks}>
                    <Text family="serif" size="base" color={Colors.textMuted} align="center">
                      This playlist is empty.
                    </Text>
                    <Label style={{ marginTop: Spacing.sm, textAlign: 'center' }}>
                      ADD SONGS FROM SEARCH OR HOME FEED
                    </Label>
                  </View>
                ) : (
                  <View>
                    {selectedPlaylist.songs.map((song, idx) => (
                      <SongRow
                        key={song.id}
                        song={song}
                        index={idx + 1}
                        showIndex
                        onPress={(s: Song) => playSong(s, selectedPlaylist.songs)}
                        onOptionsPress={handleRemoveSong}
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

      {/* Song Options Menu Modal (for recently played songs adding to queue/playlist) */}
      <SongMenuModal
        visible={optionsVisible}
        song={selectedSong}
        onClose={() => setOptionsVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.base,
  },
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
  statsGrid: {
    flexDirection: 'row',
    paddingVertical: Spacing['2xl'],
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    alignSelf: 'stretch',
  },
  firstPlayed: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    gap: Spacing.base,
  },
  playlistArtwork: {
    width: 48,
    height: 48,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    flex: 1,
    gap: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    gap: Spacing.base,
  },
  historyInfo: {
    flex: 1,
    gap: 3,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  empty: {
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
    alignItems: 'center',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dialogCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },
  dialogInput: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.xl,
  },
  dialogButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
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
  largePlaylistArtwork: {
    width: 140,
    height: 140,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.xl,
  },
  playButton: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.sm,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.sm,
  },
  emptyPlaylistTracks: {
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },
});
