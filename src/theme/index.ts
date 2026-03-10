import {Dimensions, PixelRatio} from 'react-native';

const {width: SCREEN_W} = Dimensions.get('window');

// Scale font sizes relative to a 375px baseline (iPhone SE / mid-range Android)
function fs(size: number): number {
  return Math.round(PixelRatio.roundToNearestPixel(size * (SCREEN_W / 375)));
}

export const Colors = {
  // Backgrounds
  bg: '#0A0E1A',
  surface: '#111827',
  surfaceElevated: '#1A2236',
  surfaceBorder: '#1E2D45',

  // Accent
  gold: '#C9A84C',
  goldLight: '#E8C97A',
  goldDim: '#C9A84C22',

  // Status
  success: '#22C55E',
  successDim: '#22C55E18',
  warning: '#F59E0B',
  warningDim: '#F59E0B18',
  error: '#EF4444',
  errorDim: '#EF444418',
  info: '#3B82F6',
  infoDim: '#3B82F618',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  textInverse: '#0A0E1A',
} as const;

export const Typography = {
  // Sizes — scaled to screen width
  xs:   fs(11),
  sm:   fs(13),
  base: fs(15),
  lg:   fs(17),
  xl:   fs(20),
  '2xl': fs(24),
  '3xl': fs(30),

  // Weights
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

// Responsive helpers
export const isSmallScreen = SCREEN_W < 360;
export const screenWidth   = SCREEN_W;
