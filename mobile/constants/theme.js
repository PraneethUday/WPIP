// WPIP Design System — matches web app teal/green palette exactly
// Primary: #0D9E88 · BG: #080E0C · Surface: #0D1512

export const DARK_COLORS = {
  // Teal primary — exact match to web --primary
  primary:          "#0D9E88",
  primaryDim:       "#12B8A0",
  primaryContainer: "#0A2826",

  // Amber accent
  amber:            "#E8933A",
  amberDim:         "#F0A854",
  amberContainer:   "#261509",

  // Semantic
  success:          "#22C55E",
  successContainer: "#0A2E18",
  error:            "#EF4444",
  errorContainer:   "#2E0A0A",
  info:             "#3B82F6",

  // Dark green surface hierarchy — matches web token stack
  background:       "#080E0C",
  surface:          "#0D1512",
  surfaceLow:       "#0A1210",
  surfaceContainer: "#152019",
  surfaceHigh:      "#1C2E26",
  surfaceHighest:   "#233A30",

  // Text — matches web --white / --muted / --faint
  white:      "#DCE8E4",
  textMuted:  "#B8CECA",
  textFaint:  "#7A9E98",

  // Borders
  border:       "rgba(50,75,68,0.65)",
  borderActive: "rgba(13,158,136,0.5)",

  // Legacy aliases for backward compat
  secondary:  "#152019",
  accent:     "#E8933A",
  text:       "#B8CECA",
  gray:       "#1C2E26",
  lightGray:  "#0A1210",
};

export const LIGHT_COLORS = {
  primary:          "#0A7A68",
  primaryDim:       "#0D9E88",
  primaryContainer: "#D8F0EB",

  amber:            "#B55B00",
  amberDim:         "#7A3D00",
  amberContainer:   "#FFF0E0",

  success:          "#15803D",
  successContainer: "#DCFCE7",
  error:            "#B91C1C",
  errorContainer:   "#FEE2E2",
  info:             "#1D4ED8",

  background:       "#EDF2EF",
  surface:          "#FFFFFF",
  surfaceLow:       "#F5FAF8",
  surfaceContainer: "#EBF3EF",
  surfaceHigh:      "#E0EDEA",
  surfaceHighest:   "#D4E8E4",

  white:      "#0D1F1A",
  textMuted:  "#2C4A3E",
  textFaint:  "#557468",

  border:       "rgba(100,140,128,0.3)",
  borderActive: "rgba(13,158,136,0.5)",

  secondary:  "#EBF3EF",
  accent:     "#B55B00",
  text:       "#2C4A3E",
  gray:       "#E0EDEA",
  lightGray:  "#F5FAF8",
};

// Default export: dark theme
export const COLORS = DARK_COLORS;

export const FONTS = {
  display:        "EBGaramond_700Bold",
  displayMedium:  "EBGaramond_500Medium",
  displayRegular: "EBGaramond_400Regular",
  bold:           "Inter_700Bold",
  semiBold:       "Inter_600SemiBold",
  medium:         "Inter_500Medium",
  regular:        "Inter_400Regular",
};

export const SIZES = {
  base:       8,
  font:       14,
  radius:     12,
  radiusFull: 100,
  padding:    20,

  h1:    30,
  h2:    22,
  h3:    18,
  body:  15,
  small: 13,
  tiny:  11,
};

export const GRADIENTS = {
  primary: ["#0A7A68", "#0D9E88"],
  amber:   ["#E8933A", "#F0A854"],
  surface: ["#0D1512", "#152019"],
};

export const SHADOWS = {
  card: {
    shadowColor: "#0D9E88",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 4,
  },
  button: {
    shadowColor: "#0D9E88",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const THEME = { COLORS, FONTS, SIZES, GRADIENTS, SHADOWS };
export default THEME;
