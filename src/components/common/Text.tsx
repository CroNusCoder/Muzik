import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { Colors, Typography, FontSizes } from '../../theme';

type FontFamily = 'serif' | 'mono';
type Weight = 'thin' | 'regular' | 'medium' | 'semiBold' | 'bold' | 'italic' | 'boldItalic';
type Size = keyof typeof FontSizes;

interface TextProps {
  children: React.ReactNode;
  family?: FontFamily;
  weight?: Weight;
  size?: Size;
  color?: string;
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
  letterSpacing?: number;
  uppercase?: boolean;
  align?: 'left' | 'center' | 'right';
}

const getFontFamily = (family: FontFamily, weight: Weight): string => {
  if (family === 'mono') {
    const monoWeights: Record<string, string> = {
      regular: Typography.mono.regular,
      bold: Typography.mono.bold,
      italic: Typography.mono.italic,
    };
    return monoWeights[weight] || Typography.mono.regular;
  }
  const serifWeights: Record<string, string> = {
    thin: Typography.serif.thin,
    regular: Typography.serif.regular,
    medium: Typography.serif.medium,
    semiBold: Typography.serif.semiBold,
    bold: Typography.serif.bold,
    italic: Typography.serif.italic,
    boldItalic: Typography.serif.boldItalic,
  };
  return serifWeights[weight] || Typography.serif.regular;
};

export const Text: React.FC<TextProps> = ({
  children,
  family = 'serif',
  weight = 'regular',
  size = 'base',
  color = Colors.textPrimary,
  style,
  numberOfLines,
  letterSpacing,
  uppercase = false,
  align = 'left',
}) => {
  const fontFamily = getFontFamily(family, weight);

  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily,
          fontSize: FontSizes[size],
          color,
          letterSpacing: letterSpacing ?? (uppercase ? 2 : 0),
          textTransform: uppercase ? 'uppercase' : 'none',
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
};

// ── Prebuilt variants ──────────────────────────────────────

// Large editorial heading
export const DisplayText: React.FC<Omit<TextProps, 'family' | 'size'>> = (props) => (
  <Text family="serif" size="4xl" weight="bold" {...props} />
);

// Section title
export const Title: React.FC<Omit<TextProps, 'family'>> = (props) => (
  <Text family="serif" size="xl" weight="semiBold" {...props} />
);

// Song title in lists
export const SongTitle: React.FC<Omit<TextProps, 'family'>> = (props) => (
  <Text family="serif" size="base" weight="regular" {...props} />
);

// Artist / subtitle
export const Subtitle: React.FC<Omit<TextProps, 'family'>> = (props) => (
  <Text family="mono" size="sm" color={Colors.textSecondary} weight="regular" {...props} />
);

// Stats counter — big mono number
export const StatNumber: React.FC<Omit<TextProps, 'family'>> = (props) => (
  <Text family="mono" size="3xl" weight="bold" {...props} />
);

// Label / tag text
export const Label: React.FC<Omit<TextProps, 'family'>> = (props) => (
  <Text family="mono" size="xs" uppercase letterSpacing={2} color={Colors.textMuted} weight="regular" {...props} />
);

// Lyrics line
export const LyricLine: React.FC<Omit<TextProps, 'family'> & { active?: boolean }> = ({
  active = false,
  ...props
}) => (
  <Text
    family="serif"
    size="xl"
    weight={active ? 'bold' : 'regular'}
    color={active ? Colors.textPrimary : Colors.textMuted}
    {...props}
  />
);
