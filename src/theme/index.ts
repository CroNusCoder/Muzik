// ─────────────────────────────────────────
//  DESIGN SYSTEM — Black/White Retro-Clean
// ─────────────────────────────────────────

export const Colors = {
  // Core
  black: '#000000',
  white: '#FFFFFF',
  offWhite: '#F5F5F0',       // slight warmth, not pure white
  offBlack: '#0A0A0A',       // slightly warm black for backgrounds

  // Grays
  gray100: '#E8E8E3',
  gray200: '#C8C8C0',
  gray300: '#A0A09A',
  gray400: '#6A6A65',
  gray500: '#404040',
  gray600: '#1E1E1E',
  gray700: '#141414',

  // Surfaces
  surface: '#0A0A0A',
  surfaceElevated: '#111111',
  surfaceCard: '#161616',
  border: '#1F1F1F',
  borderLight: '#2A2A2A',

  // Text
  textPrimary: '#F5F5F0',
  textSecondary: '#A0A09A',
  textMuted: '#505050',
  textInverse: '#0A0A0A',

  // Accent (pure white on black — editorial)
  accent: '#FFFFFF',
  accentMuted: 'rgba(255,255,255,0.08)',
};

export const Typography = {
  // Serif — for headings, song titles, editorial feel
  serif: {
    thin: 'PlayfairDisplay-Regular',
    regular: 'PlayfairDisplay-Regular',
    medium: 'PlayfairDisplay-Medium',
    semiBold: 'PlayfairDisplay-SemiBold',
    bold: 'PlayfairDisplay-Bold',
    italic: 'PlayfairDisplay-Italic',
    boldItalic: 'PlayfairDisplay-BoldItalic',
  },

  // Mono — for stats, timestamps, counters, metadata
  mono: {
    regular: 'SpaceMono-Regular',
    bold: 'SpaceMono-Bold',
    italic: 'SpaceMono-Italic',
  },
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,
  '5xl': 64,
  display: 80,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
};

export const BorderRadius = {
  none: 0,
  sm: 2,
  md: 4,       // boxy — very minimal radius
  lg: 6,
  xl: 8,
  full: 9999,
};

export const Layout = {
  screenPadding: 20,
  tabBarHeight: 60,
  miniPlayerHeight: 64,
  headerHeight: 56,
};

// Border styles used throughout
export const Borders = {
  thin: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medium: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  accent: {
    borderWidth: 1,
    borderColor: Colors.white,
  },
};

export default {
  Colors,
  Typography,
  FontSizes,
  Spacing,
  BorderRadius,
  Layout,
  Borders,
};
