// GigGuard Design System
// Brand: Ruby Red (#A51C30) · Prussian Blue (#04052E) · Ivory (#FFFDFB)
// Two variants: dark (Prussian Blue base) and light (Ivory base)

export const DARK_COLORS = {
  // Brand primaries
  primary: "#A51C30",           // Ruby Red — CTAs, active states, shields
  primaryDim: "#C73A52",        // Lighter ruby for highlights
  primaryContainer: "#2D080F",  // Deep ruby bg for chips/cards

  // Accent
  amber: "#C9A84C",             // Gold — alerts, urgency, warnings
  amberDim: "#E0C070",
  amberContainer: "#2A1E08",

  // Semantic
  success: "#22C55E",
  successContainer: "#0A2E18",
  error: "#EF4444",
  errorContainer: "#2E0A0A",
  info: "#3B82F6",

  // Surfaces — Prussian Blue layered system
  background: "#020416",        // Deepest base
  surface: "#04052E",           // Prussian Blue — main bg
  surfaceLow: "#060833",
  surfaceContainer: "#0A0E42",  // Card backgrounds
  surfaceHigh: "#0F144E",       // Elevated cards
  surfaceHighest: "#151A5C",    // Inputs / interactive

  // Text
  white: "#FFFDFB",             // Ivory — primary text
  textMuted: "#D4D0E8",         // Secondary text
  textFaint: "#8885A8",         // Placeholder / disabled

  // Borders
  border: "rgba(255, 253, 251, 0.1)",
  borderActive: "rgba(165, 28, 48, 0.6)",

  // Legacy aliases
  secondary: "#0A0E42",
  accent: "#C9A84C",
  text: "#D4D0E8",
  gray: "#2A2B4E",
  lightGray: "#060833",
};

export const LIGHT_COLORS = {
  // Brand primaries
  primary: "#A51C30",           // Ruby Red
  primaryDim: "#C73A52",
  primaryContainer: "#FFE8EB",  // Soft ruby bg

  // Accent
  amber: "#9A6B00",             // Deep gold for light mode
  amberDim: "#7A5400",
  amberContainer: "#FFF3D6",

  // Semantic
  success: "#16A34A",
  successContainer: "#DCFCE7",
  error: "#DC2626",
  errorContainer: "#FEE2E2",
  info: "#2563EB",

  // Surfaces — Ivory layered system
  background: "#FFFDFB",        // Ivory
  surface: "#FAF8F5",
  surfaceLow: "#F5F2EE",
  surfaceContainer: "#EDE9E4",  // Card backgrounds
  surfaceHigh: "#E5E0D9",
  surfaceHighest: "#D9D3CB",    // Inputs

  // Text
  white: "#04052E",             // Prussian Blue — primary text on light
  textMuted: "#2A2B4E",
  textFaint: "#6B6C8A",

  // Borders
  border: "rgba(4, 5, 46, 0.12)",
  borderActive: "rgba(165, 28, 48, 0.4)",

  // Legacy aliases
  secondary: "#EDE9E4",
  accent: "#9A6B00",
  text: "#2A2B4E",
  gray: "#8885A8",
  lightGray: "#F5F2EE",
};

// Default export: dark theme (backward compatibility)
export const COLORS = DARK_COLORS;

export const FONTS = {
  display: "EBGaramond_700Bold",
  displayMedium: "EBGaramond_500Medium",
  displayRegular: "EBGaramond_400Regular",
  bold: "Inter_700Bold",
  semiBold: "Inter_600SemiBold",
  medium: "Inter_500Medium",
  regular: "Inter_400Regular",
};

export const SIZES = {
  base: 8,
  font: 14,
  radius: 12,
  radiusFull: 100,
  padding: 20,

  h1: 28,
  h2: 22,
  h3: 18,
  body: 15,
  small: 13,
  tiny: 11,
};

export const GRADIENTS = {
  primary: ["#A51C30", "#C73A52"],
  amber: ["#C9A84C", "#E0C070"],
  surface: ["#0A0E42", "#0F144E"],
};

export const SHADOWS = {
  card: {
    shadowColor: "#A51C30",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  button: {
    shadowColor: "#A51C30",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const THEME = {
  COLORS,
  FONTS,
  SIZES,
  GRADIENTS,
  SHADOWS,
};

export default THEME;
