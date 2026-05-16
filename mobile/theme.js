// ================================================
// ZAVARA THEME v4.0 - DESIGN SYSTEM
// The Island's Pulse 🌴
// ================================================
// Inspired by:
// - Material Design 3 (color roles)
// - Shopee (shade system)
// - Apple HIG (semantic tokens)
// - Tailwind CSS (mathematical scale)
// ================================================

// ============================================
// RAW PALETTE - The source of truth
// Everything derives from these base colors
// Like Material Design's tonal palette
// ============================================
const palette = {

  // ── ZAVARA GOLD (Primary Brand) ─────────────
  // The signature color - warm, premium, Filipino
  gold: {
    50:  '#FFFDF5',
    100: '#FBF3DE',
    200: '#F5E4B0',
    300: '#EDD07A',
    400: '#DFBC5E',
    500: '#C4951E',  // ← MAIN
    600: '#9E7818',
    700: '#7A5C12',
    800: '#5C430D',
    900: '#3D2D08',
  },

  // ── ISLAND GREEN (Farmer/Nature) ────────────
  // Bohol's lush nature, farmers, fresh produce
  green: {
    50:  '#F0FBF4',
    100: '#EDF8F0',
    200: '#C8EDDA',
    300: '#8DD5AD',
    400: '#4BB87D',
    500: '#1D8348',  // ← MAIN
    600: '#176A3A',
    700: '#11522C',
    800: '#0B3A1F',
    900: '#062212',
  },

  // ── OCEAN BLUE (Transport/Haven) ────────────
  // Bohol's famous sea, transport, trust
  ocean: {
    50:  '#F0F8FB',
    100: '#EDF6FA',
    200: '#C8E5F0',
    300: '#8DCAE2',
    400: '#4AADD0',
    500: '#1A6B8A',  // ← MAIN
    600: '#155672',
    700: '#10425A',
    800: '#0B2E42',
    900: '#061A29',
  },

  // ── CORAL (Food/Warmth) ──────────────────────
  // Filipino warmth, food, energy
  coral: {
    50:  '#FDF8F6',
    100: '#FDF0EC',
    200: '#F8CFCA',
    300: '#F0A095',
    400: '#E47A66',
    500: '#D4654A',  // ← MAIN
    600: '#AA503B',
    700: '#813C2C',
    800: '#58281E',
    900: '#2F140F',
  },

  // ── HAVEN PURPLE (Hotels/Luxury) ────────────
  // Premium feel, hospitality
  purple: {
    50:  '#F8F5FD',
    100: '#F5EFF8',
    200: '#DFD0EE',
    300: '#C0A3DA',
    400: '#9B72C2',
    500: '#7B4FA6',  // ← MAIN
    600: '#633F87',
    700: '#4C3069',
    800: '#34214A',
    900: '#1C122C',
  },

  // ── NEUTRALS ────────────────────────────────
  // Warm-tinted neutrals (not cold grey)
  // Based on Bohol's sandy beaches
  sand: {
    0:   '#FFFFFF',
    50:  '#FAFAF7',
    100: '#F5F2EC',
    200: '#EDE5D5',
    300: '#D9CDB5',
    400: '#C4B49A',
    500: '#B5A892',
    600: '#8A7D68',
    700: '#5C4F3A',
    800: '#3D3226',
    900: '#1C1710',
  },

  // ── STATUS COLORS ───────────────────────────
  red: {
    100: '#FCEFED',
    500: '#C0392B',
    600: '#A93226',
  },
  amber: {
    100: '#FDF6E5',
    500: '#D4920A',
    600: '#B87D08',
  },
  emerald: {
    100: '#EDF8F0',
    500: '#1D8348',
    600: '#176A3A',
  },
  blue: {
    100: '#EDF6FA',
    500: '#1A6B8A',
    600: '#155672',
  },
};

// ============================================
// SEMANTIC COLOR TOKENS
// ← This is what screens actually USE
// Named by PURPOSE not appearance
// Like Apple's "label" not "black"
// ============================================
export const colors = {

  // ── BRAND ───────────────────────────────────
  primary:      palette.gold[500],
  primaryDark:  palette.gold[600],
  primaryLight: palette.gold[400],
  primaryPale:  palette.gold[100],
  primaryGlow:  'rgba(196,149,30,0.12)',
  primaryGlow2: 'rgba(196,149,30,0.06)',

  // ── CORAL ───────────────────────────────────
  coral:     palette.coral[500],
  coralLight: palette.coral[400],
  coralPale: palette.coral[100],

  // ── SURFACES (light mode) ───────────────────
  // Like Material Design's surface roles
  background:      palette.sand[50],
  backgroundWarm:  '#FDF9F3',
  cardBackground:  palette.sand[0],
  cardWarm:        '#FFFCF7',
  inputBackground: palette.sand[100],
  surfaceElevated: palette.sand[0],

  // ── GLASS TOKENS ────────────────────────────
  // Replaces hardcoded rgba() strings in screens
  // Named by opacity percentage
  glass05: 'rgba(255,255,255,0.05)',
  glass08: 'rgba(255,255,255,0.08)',
  glass10: 'rgba(255,255,255,0.10)',
  glass15: 'rgba(255,255,255,0.15)',
  glass20: 'rgba(255,255,255,0.20)',
  glass30: 'rgba(255,255,255,0.30)',
  glass50: 'rgba(255,255,255,0.50)',
  glass75: 'rgba(255,255,255,0.75)',
  glass90: 'rgba(255,255,255,0.90)',
  glass92: 'rgba(255,255,255,0.92)',

  // Dark glass (for light backgrounds)
  darkGlass05: 'rgba(28,23,16,0.05)',
  darkGlass08: 'rgba(28,23,16,0.08)',
  darkGlass12: 'rgba(28,23,16,0.12)',
  darkGlass20: 'rgba(28,23,16,0.20)',

  // ── HEADER / NAV ────────────────────────────
  headerBg:     palette.sand[0],
  headerBorder: 'rgba(196,149,30,0.15)',
  navBg:        palette.sand[0],
  navBorder:    palette.sand[200],
  navActive:    palette.gold[500],
  navInactive:  palette.sand[600],

  // ── TEXT ────────────────────────────────────
  // Like Apple's label/secondaryLabel system
  textDark:   palette.sand[900],   // Primary text
  textMedium: palette.sand[700],   // Secondary text
  textLight:  palette.sand[600],   // Tertiary text
  textMuted:  palette.sand[500],   // Placeholder/hint
  textWhite:  '#FFFFFF',
  textCream:  '#FDF6E8',
  textGold:   palette.gold[500],

  // ── BORDERS ─────────────────────────────────
  border:       palette.sand[200],
  borderLight:  '#F5F0E5',
  borderMedium: palette.sand[300],
  borderGold:   'rgba(196,149,30,0.20)',
  borderGold2:  'rgba(196,149,30,0.40)',

  // ── OVERLAYS ────────────────────────────────
  overlay:      'rgba(28,23,16,0.70)',
  overlayLight: 'rgba(28,23,16,0.30)',
  overlayWhite: 'rgba(255,255,255,0.95)',

  // ── DARK SURFACES ───────────────────────────
  dark:     palette.sand[900],
  darkCard: '#28201A',

  // ── STATUS COLORS ───────────────────────────
  // Each has: main, pale, border pattern
  // Like Material Design's color roles

  success:      palette.emerald[500],
  successLight: 'rgba(29,131,72,0.10)',
  successPale:  palette.emerald[100],

  danger:       palette.red[500],
  dangerLight:  'rgba(192,57,43,0.10)',
  dangerPale:   palette.red[100],

  warning:      palette.amber[500],
  warningLight: 'rgba(212,146,10,0.10)',
  warningPale:  palette.amber[100],

  info:         palette.blue[500],
  infoLight:    'rgba(26,107,138,0.10)',
  infoPale:     palette.blue[100],

  // ── ROLE COLORS ─────────────────────────────
  // Each role has: color, bg, border
  // Consistent pattern like Grab's role system

  farmerColor:  palette.green[500],
  farmerBg:     palette.green[100],
  farmerBorder: 'rgba(29,131,72,0.15)',

  vendorColor:  palette.gold[500],
  vendorBg:     palette.gold[100],
  vendorBorder: 'rgba(196,149,30,0.15)',

  riderColor:   palette.ocean[500],
  riderBg:      palette.ocean[100],
  riderBorder:  'rgba(26,107,138,0.15)',

  havenColor:   palette.purple[500],
  havenBg:      palette.purple[100],
  havenBorder:  'rgba(123,79,166,0.15)',

  cuisineColor: palette.coral[500],
  cuisineBg:    palette.coral[100],
  cuisineBorder: 'rgba(212,101,74,0.15)',

  adminColor:   '#34495E',
  adminBg:      '#EDF0F2',
  adminBorder:  'rgba(52,73,94,0.15)',

  // ── RAW PALETTE ACCESS ──────────────────────
  // For when screens need specific shades
  // Like Shopee's color.gold[200]
  palette,
};

// ============================================
// TYPOGRAPHY SCALE
// Mathematical ratio: 1.25 (Major Third)
// Base: 13px
// Like Grab's type system
// ============================================
export const fonts = {
  // Size scale (mathematical, not arbitrary)
  size: {
    micro:   8,
    tiny:    10,
    small:   12,
    body:    13,   // ← Base
    medium:  15,
    large:   17,
    xlarge:  20,
    xxlarge: 24,
    huge:    28,
    display: 34,
    hero:    42,
    giant:   52,
  },

  // Weight tokens (not magic numbers)
  weight: {
    regular:   '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
    black:     '900',
  },

  // Letter spacing tokens
  tracking: {
    tight:   -0.5,
    normal:  0,
    wide:    0.5,
    wider:   1,
    widest:  2,
    ultra:   4,
    extreme: 6,
  },

  // Line height tokens
  leading: {
    tight:   1.2,
    snug:    1.35,
    normal:  1.5,
    relaxed: 1.65,
    loose:   2,
  },
};

// ============================================
// SPACING SYSTEM
// 4pt base grid (like Material Design)
// All spacing is multiples of 4
// NEW - screens were using random numbers
// ============================================
export const spacing = {
  0:   0,
  1:   4,   // xs
  2:   8,   // sm
  3:   12,  // md
  4:   16,  // lg  (most common)
  5:   20,  // xl
  6:   24,  // 2xl
  7:   28,  // 3xl
  8:   32,  // 4xl
  10:  40,  // 5xl
  12:  48,  // 6xl
  14:  56,  // 7xl
  16:  64,  // 8xl
  20:  80,  // 9xl

  // Semantic spacing
  screenPadding: 20,
  cardPadding:   16,
  sectionGap:    24,
  itemGap:       12,
  chipGap:       8,
};

// ============================================
// BORDER RADIUS SYSTEM
// Like Shopee's rounded corner system
// ============================================
export const borderRadius = {
  none:    0,
  tiny:    4,
  small:   8,
  medium:  12,
  large:   16,
  xlarge:  20,
  xxlarge: 24,
  huge:    32,
  round:   999,

  // Semantic aliases
  chip:    999,
  card:    20,
  modal:   28,
  button:  16,
  input:   12,
  avatar:  999,
  badge:   999,
};

// ============================================
// ELEVATION / SHADOW SYSTEM
// Named by USE CASE not size
// Like Material Design's elevation levels
// ============================================

// Level 1 - Cards, list items
export const shadow = {
  shadowColor:   '#B8A070',
  shadowOffset:  { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius:  8,
  elevation:     2,
};

// Level 2 - Modals, sheets, floating elements
export const shadowMd = {
  shadowColor:   '#B8A070',
  shadowOffset:  { width: 0, height: 4 },
  shadowOpacity: 0.10,
  shadowRadius:  12,
  elevation:     4,
};

// Level 3 - Large modals, drawers
export const shadowLg = {
  shadowColor:   '#8A7D68',
  shadowOffset:  { width: 0, height: 6 },
  shadowOpacity: 0.12,
  shadowRadius:  16,
  elevation:     6,
};

// Level 4 - Full screen overlays
export const shadowDark = {
  shadowColor:   '#1C1710',
  shadowOffset:  { width: 0, height: 8 },
  shadowOpacity: 0.15,
  shadowRadius:  20,
  elevation:     8,
};

// Brand shadows - for CTAs and primary buttons
export const shadowGold = {
  shadowColor:   '#C4951E',
  shadowOffset:  { width: 0, height: 4 },
  shadowOpacity: 0.30,
  shadowRadius:  12,
  elevation:     6,
};

export const shadowStrong = {
  shadowColor:   '#C4951E',
  shadowOffset:  { width: 0, height: 6 },
  shadowOpacity: 0.20,
  shadowRadius:  16,
  elevation:     8,
};

// Semantic shadow aliases
// Use these in screens for clarity
export const shadows = {
  card:    shadow,
  modal:   shadowMd,
  drawer:  shadowLg,
  overlay: shadowDark,
  cta:     shadowGold,
  float:   shadowStrong,
};

// ============================================
// ANIMATION TOKENS
// NEW - standardizes motion across the app
// Like Framer Motion's presets
// ============================================
export const animation = {
  // Duration tokens (milliseconds)
  duration: {
    instant:  100,
    fast:     200,
    normal:   300,
    slow:     500,
    verySlow: 800,
    splash:   2800,
  },

  // Spring configs
  spring: {
    // Snappy - for buttons, badges
    snappy: {
      friction: 8,
      tension:  100,
    },
    // Bouncy - for cart badge, notifications
    bouncy: {
      friction: 4,
      tension:  60,
    },
    // Gentle - for page transitions
    gentle: {
      friction: 10,
      tension:  40,
    },
    // Stiff - for modals
    stiff: {
      friction: 12,
      tension:  120,
    },
  },

  // Stagger delay for list animations
  stagger: {
    fast:   50,
    normal: 80,
    slow:   120,
  },
};

// ============================================
// ICON SIZES
// Standardized across all screens
// No more random fontSize: 16, 18, 20
// ============================================
export const iconSize = {
  tiny:   14,
  small:  18,
  medium: 22,
  large:  28,
  xlarge: 34,
  huge:   42,
  hero:   52,
  giant:  70,
};

// ============================================
// HIT SLOP
// Minimum touch targets (Apple HIG: 44x44pt)
// ============================================
export const hitSlop = {
  small:  { top: 8,  bottom: 8,  left: 8,  right: 8  },
  medium: { top: 12, bottom: 12, left: 12, right: 12 },
  large:  { top: 16, bottom: 16, left: 16, right: 16 },
};

// ============================================
// AVATAR SIZES
// Standardized for consistency
// ============================================
export const avatarSize = {
  tiny:   24,
  small:  32,
  medium: 44,
  large:  56,
  xlarge: 72,
  huge:   92,
  giant:  120,
};

// ============================================
// Z-INDEX SYSTEM
// Prevents z-index wars between components
// ============================================
export const zIndex = {
  base:    0,
  raised:  1,
  overlay: 10,
  modal:   20,
  toast:   30,
  tooltip: 40,
  maximum: 999,
};

// ============================================
// LAYOUT CONSTANTS
// Screen-specific measurements
// ============================================
export const layout = {
  headerHeight:    90,   // paddingTop 52 + content
  bottomNavHeight: 66,
  tabBarHeight:    48,
  floatingCartH:   66,
  statusBarH:      52,

  // Content safe areas
  contentPaddingH: 20,
  contentPaddingV: 16,
};