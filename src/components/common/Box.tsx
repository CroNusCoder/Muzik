import React from 'react';
import { View, ViewStyle, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../theme';

// ── Divider ──────────────────────────────────────────────
interface DividerProps {
  vertical?: boolean;
  color?: string;
  style?: ViewStyle;
  thickness?: number;
}

export const Divider: React.FC<DividerProps> = ({
  vertical = false,
  color = Colors.border,
  style,
  thickness = 1,
}) => (
  <View
    style={[
      vertical
        ? { width: thickness, alignSelf: 'stretch', backgroundColor: color }
        : { height: thickness, width: '100%', backgroundColor: color },
      style,
    ]}
  />
);

// ── Box — base layout primitive ──────────────────────────
interface BoxProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  pad?: keyof typeof Spacing;
  padH?: keyof typeof Spacing;
  padV?: keyof typeof Spacing;
  gap?: keyof typeof Spacing;
  row?: boolean;
  center?: boolean;
  between?: boolean;
  flex?: number;
  bordered?: boolean;
  bg?: string;
  radius?: keyof typeof BorderRadius;
}

export const Box: React.FC<BoxProps> = ({
  children,
  style,
  pad,
  padH,
  padV,
  gap,
  row = false,
  center = false,
  between = false,
  flex,
  bordered = false,
  bg,
  radius,
}) => (
  <View
    style={[
      {
        flexDirection: row ? 'row' : 'column',
        alignItems: center ? 'center' : undefined,
        justifyContent: between ? 'space-between' : center && !row ? 'center' : undefined,
        padding: pad ? Spacing[pad] : undefined,
        paddingHorizontal: padH ? Spacing[padH] : undefined,
        paddingVertical: padV ? Spacing[padV] : undefined,
        gap: gap ? Spacing[gap] : undefined,
        flex,
        backgroundColor: bg,
        borderRadius: radius ? BorderRadius[radius] : undefined,
        borderWidth: bordered ? 1 : undefined,
        borderColor: bordered ? Colors.border : undefined,
      },
      style,
    ]}
  >
    {children}
  </View>
);

// ── Pressable Box ─────────────────────────────────────────
interface PressableBoxProps extends BoxProps, Omit<TouchableOpacityProps, 'style'> {}

export const PressableBox: React.FC<PressableBoxProps> = ({
  children,
  style,
  pad,
  padH,
  padV,
  gap,
  row = false,
  center = false,
  between = false,
  flex,
  bordered = false,
  bg,
  radius,
  ...touchProps
}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    {...touchProps}
    style={[
      {
        flexDirection: row ? 'row' : 'column',
        alignItems: center ? 'center' : undefined,
        justifyContent: between ? 'space-between' : undefined,
        padding: pad ? Spacing[pad] : undefined,
        paddingHorizontal: padH ? Spacing[padH] : undefined,
        paddingVertical: padV ? Spacing[padV] : undefined,
        gap: gap ? Spacing[gap] : undefined,
        flex,
        backgroundColor: bg,
        borderRadius: radius ? BorderRadius[radius] : undefined,
        borderWidth: bordered ? 1 : undefined,
        borderColor: bordered ? Colors.border : undefined,
      },
      style,
    ]}
  >
    {children}
  </TouchableOpacity>
);
