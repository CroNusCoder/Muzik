# 🎵 Muzik

A premium, minimal, retro-clean music application for Android. Powered by a custom JioSaavn API worker and built with React Native.

<p align="left">
  <a href="https://github.com/CroNusCoder/Muzik/releases/download/v1.1/muzik.apk">
    <img src="https://img.shields.io/badge/Download-APK%20for%20Android-black?style=for-the-badge&logo=android&logoColor=green" alt="Download APK" />
  </a>
</p>

---

## Tech Stack

| Layer | Library / Engine |
|---|---|
| Music data | Custom JioSaavn Worker API (`jiosaavn-api.parthasarathisrivastava.workers.dev`) |
| Audio playback | `react-native-track-player` |
| Lyrics | `lrclib.net` (free, synced and plain text support) |
| State | `zustand` |
| Local storage | `@react-native-async-storage/async-storage` (history and stats logging) |
| Fonts | Playfair Display (serif) + Space Mono (mono) |

---

## 1. Init Project

```bash
npx react-native init MusicApp --template react-native-template-typescript
cd MusicApp
```

---

## 2. Install Dependencies

```bash
npm install \
  react-native-track-player \
  @react-native-async-storage/async-storage \
  react-native-safe-area-context \
  zustand
```

---

## 3. Android Setup for TrackPlayer

Add to `android/app/build.gradle`:
```gradle
android {
  ...
  packagingOptions {
    pickFirst 'lib/x86/libc++_shared.so'
    pickFirst 'lib/x86_64/libc++_shared.so'
    pickFirst 'lib/armeabi-v7a/libc++_shared.so'
    pickFirst 'lib/arm64-v8a/libc++_shared.so'
  }
}
```

Add to `android/app/src/main/AndroidManifest.xml` inside `<application>`:
```xml
<service android:name="com.doublesymmetry.trackplayer.service.MusicService" android:exported="false"/>
```

---

## 4. Fonts Setup

Download and add to `android/app/src/main/assets/fonts/`:
- **Playfair Display**: https://fonts.google.com/specimen/Playfair+Display
  - PlayfairDisplay-Regular.ttf
  - PlayfairDisplay-Medium.ttf
  - PlayfairDisplay-SemiBold.ttf
  - PlayfairDisplay-Bold.ttf
  - PlayfairDisplay-Italic.ttf
  - PlayfairDisplay-BoldItalic.ttf

- **Space Mono**: https://fonts.google.com/specimen/Space+Mono
  - SpaceMono-Regular.ttf
  - SpaceMono-Bold.ttf
  - SpaceMono-Italic.ttf

Then link fonts (RN 0.69+, auto-linked via react-native.config.js):
```js
// react-native.config.js
module.exports = {
  assets: ['./assets/fonts'],
};
```
```bash
npx react-native-asset
```

---

## 5. Copy Source Files

Copy the entire `src/` folder and `App.tsx`, `index.js` into your project root.

---

## 6. Run

```bash
npx react-native run-android
```

---

## Project Structure

```
src/
├── theme/          ← colors, fonts, spacing (design system)
├── components/
│   ├── common/     ← Text, Box, SongRow (reusable primitives)
│   └── player/     ← MiniPlayer, FullPlayer
├── screens/        ← HomeScreen, SearchScreen, LibraryScreen
├── navigation/     ← AppNavigator (tabs + modals)
├── services/       ← innertube.ts (JioSaavn client), lyrics.ts, stats.ts, trackPlayer.ts
└── store/          ← playerStore.ts (Zustand)
```

---

## Screens

| Screen | What it shows |
|---|---|
| Home | Trending Hits, Bollywood Romance, Global Pop, and Lo-Fi Chillout feeds |
| Search | Global track search from JioSaavn with clean HTML entity parsing |
| Now Playing | Fullscreen lyrics (synced if available, plain otherwise, ♪ if none) |
| Library | Total songs played, total minutes, recent history statistics |

