import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { MiniPlayer } from '../components/player/MiniPlayer';
import { FullPlayer } from '../components/player/FullPlayer';
import { usePlayerStore } from '../store/playerStore';
import { Text, Label } from '../components/common/Text';
import { Divider } from '../components/common/Box';
import { Colors, Spacing, Layout, FontSizes } from '../theme';

type Tab = 'home' | 'search' | 'library';

const TAB_CONFIG: { id: Tab; label: string; symbol: string }[] = [
  { id: 'home',    label: 'HOME',    symbol: '⌂' },
  { id: 'search',  label: 'SEARCH',  symbol: '⊙' },
  { id: 'library', label: 'LIBRARY', symbol: '≡' },
];

const TabBar: React.FC<{ active: Tab; onPress: (tab: Tab) => void }> = ({
  active,
  onPress,
}) => (
  <>
    <Divider />
    <View style={styles.tabBar}>
      {TAB_CONFIG.map((tab) => {
        const isActive = tab.id === active;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onPress(tab.id)}
            activeOpacity={0.6}
          >
            <Text
              family="mono"
              size="lg"
              color={isActive ? Colors.white : Colors.gray400}
            >
              {tab.symbol}
            </Text>
            <Label
              color={isActive ? Colors.white : Colors.textMuted}
              style={{ fontSize: 9, marginTop: 2 }}
            >
              {tab.label}
            </Label>
          </TouchableOpacity>
        );
      })}
    </View>
  </>
);

export const AppNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const { fullscreenOpen, setFullscreen } = usePlayerStore();

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':    return <HomeScreen />;
      case 'search':  return <SearchScreen />;
      case 'library': return <LibraryScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Main screen */}
      <View style={styles.screen}>
        {renderScreen()}
      </View>

      {/* Mini player */}
      <MiniPlayer onPress={() => setFullscreen(true)} />

      {/* Tab bar */}
      <TabBar active={activeTab} onPress={setActiveTab} />

      {/* Full screen player modal */}
      <Modal
        visible={fullscreenOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <SafeAreaView style={styles.fullscreenModal}>
          <FullPlayer onClose={() => setFullscreen(false)} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  screen: {
    flex: 1,
  },
  tabBar: {
    height: Layout.tabBarHeight,
    flexDirection: 'row',
    backgroundColor: Colors.surface,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
});
