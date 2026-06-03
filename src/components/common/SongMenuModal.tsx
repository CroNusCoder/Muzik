import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { usePlayerStore } from '../../store/playerStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { Text, Label, Title } from './Text';
import { Divider } from './Box';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../theme';
import type { Song } from './SongRow';

interface SongMenuModalProps {
  visible: boolean;
  song: Song | null;
  onClose: () => void;
}

type MenuState = 'actions' | 'select-playlist' | 'create-playlist';

export const SongMenuModal: React.FC<SongMenuModalProps> = ({
  visible,
  song,
  onClose,
}) => {
  const [menuState, setMenuState] = useState<MenuState>('actions');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const { playSong, addToQueue } = usePlayerStore();
  const { playlists, createPlaylist, addSongToPlaylist } = usePlaylistStore();

  if (!song) return null;

  const handlePlayNow = async () => {
    await playSong(song);
    onClose();
  };

  const handleAddToQueue = () => {
    addToQueue(song);
    showMessage('ADDED TO QUEUE');
  };

  const handleSelectPlaylist = () => {
    setMenuState('select-playlist');
  };

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    const success = await addSongToPlaylist(playlistId, song);
    if (success) {
      showMessage(`ADDED TO ${playlistName.toUpperCase()}`);
    } else {
      showMessage('ALREADY IN PLAYLIST');
    }
  };

  const handleCreatePlaylistAndAdd = async () => {
    const name = newPlaylistName.trim();
    if (!name) return;
    const newId = await createPlaylist(name);
    const success = await addSongToPlaylist(newId, song);
    setNewPlaylistName('');
    if (success) {
      showMessage(`ADDED TO ${name.toUpperCase()}`);
    } else {
      showMessage('ADDED TO PLAYLIST');
    }
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => {
      setMessage(null);
      onClose();
      // Reset state back to actions for next open
      setTimeout(() => setMenuState('actions'), 300);
    }, 1200);
  };

  const renderContent = () => {
    if (message) {
      return (
        <View style={styles.messageContainer}>
          <Text family="mono" size="base" weight="bold" color={Colors.white}>
            {message}
          </Text>
        </View>
      );
    }

    switch (menuState) {
      case 'actions':
        return (
          <View style={styles.card}>
            {/* Song Header */}
            <View style={styles.header}>
              <Title numberOfLines={1}>{song.title}</Title>
              <Text family="mono" size="xs" color={Colors.textSecondary} numberOfLines={1}>
                {song.artist}
              </Text>
            </View>
            <Divider />

            {/* Options */}
            <TouchableOpacity style={styles.option} onPress={handlePlayNow}>
              <Text family="mono" size="sm">▶  PLAY NOW</Text>
            </TouchableOpacity>
            <Divider />

            <TouchableOpacity style={styles.option} onPress={handleAddToQueue}>
              <Text family="mono" size="sm">＋  ADD TO QUEUE</Text>
            </TouchableOpacity>
            <Divider />

            <TouchableOpacity style={styles.option} onPress={handleSelectPlaylist}>
              <Text family="mono" size="sm">≡  ADD TO PLAYLIST</Text>
            </TouchableOpacity>
            <Divider />

            <TouchableOpacity style={[styles.option, styles.cancelOption]} onPress={onClose}>
              <Label>CANCEL</Label>
            </TouchableOpacity>
          </View>
        );

      case 'select-playlist':
        return (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => setMenuState('actions')}
                style={styles.backButton}
              >
                <Text family="mono" size="xs" color={Colors.textSecondary}>← BACK</Text>
              </TouchableOpacity>
              <Label style={{ marginRight: 40 }}>ADD TO PLAYLIST</Label>
            </View>
            <Divider />

            <ScrollView style={styles.playlistList} showsVerticalScrollIndicator={false}>
              {/* Create new */}
              <TouchableOpacity
                style={styles.option}
                onPress={() => setMenuState('create-playlist')}
              >
                <Text family="mono" size="sm" color={Colors.white}>[ ＋ CREATE NEW PLAYLIST ]</Text>
              </TouchableOpacity>
              <Divider />

              {playlists.map((playlist) => (
                <React.Fragment key={playlist.id}>
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => handleAddToPlaylist(playlist.id, playlist.name)}
                  >
                    <Text family="serif" size="base">{playlist.name}</Text>
                    <Text family="mono" size="xs" color={Colors.textMuted} style={{ marginTop: 2 }}>
                      {playlist.songs.length} SONGS
                    </Text>
                  </TouchableOpacity>
                  <Divider />
                </React.Fragment>
              ))}

              {playlists.length === 0 && (
                <View style={styles.emptyPlaylists}>
                  <Text family="serif" size="sm" color={Colors.textSecondary} align="center">
                    No custom playlists created yet.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        );

      case 'create-playlist':
        return (
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => setMenuState('select-playlist')}
                style={styles.backButton}
              >
                <Text family="mono" size="xs" color={Colors.textSecondary}>← BACK</Text>
              </TouchableOpacity>
              <Label style={{ marginRight: 40 }}>NEW PLAYLIST</Label>
            </View>
            <Divider />

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                placeholder="Playlist name..."
                placeholderTextColor={Colors.textMuted}
                autoFocus
                maxLength={30}
              />
            </View>
            <Divider />

            <TouchableOpacity
              style={[
                styles.option,
                !newPlaylistName.trim() && { opacity: 0.4 }
              ]}
              onPress={handleCreatePlaylistAndAdd}
              disabled={!newPlaylistName.trim()}
            >
              <Text family="mono" size="sm" align="center" color={Colors.white}>CREATE & ADD SONG</Text>
            </TouchableOpacity>
            <Divider />
          </View>
        );
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {renderContent()}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    backgroundColor: Colors.surface,
  },
  card: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  header: {
    padding: Spacing.base,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
  },
  backButton: {
    paddingVertical: 4,
  },
  option: {
    padding: Spacing.base,
    justifyContent: 'center',
  },
  cancelOption: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  playlistList: {
    maxHeight: 300,
  },
  emptyPlaylists: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  inputContainer: {
    padding: Spacing.base,
  },
  input: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  messageContainer: {
    padding: Spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
