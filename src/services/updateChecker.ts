import { Alert, Linking } from 'react-native';

const CURRENT_VERSION = 'v1.4'; // Production release baseline version

export const checkAppUpdate = async () => {
  try {
    const response = await fetch('https://api.github.com/repos/CroNusCoder/Muzik/releases/latest');
    if (!response.ok) return;

    const data = await response.json();
    const latestVersion = data.tag_name; // e.g. "v1.1" or "v1.2"

    if (latestVersion && latestVersion !== CURRENT_VERSION) {
      Alert.alert(
        "Update Available! 🚀",
        `A new version of Muzik (${latestVersion}) is ready. Would you like to update and download the latest features?`,
        [
          {
            text: "Later",
            style: "cancel"
          },
          {
            text: "Update Now",
            onPress: () => {
              // Direct download link for muzik.apk from the release tag assets
              Linking.openURL(`https://github.com/CroNusCoder/Muzik/releases/download/${latestVersion}/muzik.apk`);
            }
          }
        ],
        { cancelable: true }
      );
    }
  } catch (error) {
    console.warn("Failed to check for app updates:", error);
  }
};
