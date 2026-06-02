import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setupPlayer } from './src/services/trackPlayer';
import { AppNavigator } from './src/navigation/AppNavigator';
import { checkAppUpdate } from './src/services/updateChecker';
import { Colors } from './src/theme';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await setupPlayer();
      setReady(true);
      checkAppUpdate();
    };
    init();
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashText}>MUZIK</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 48,
    color: Colors.white,
    letterSpacing: 12,
  },
});
