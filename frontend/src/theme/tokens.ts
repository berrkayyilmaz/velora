export const designTokens = {
  colors: {
    light: {
      background: "#f7f8f6",
      surface: "#ffffff",
      foreground: "#171a18",
      mutedForeground: "#68706b",
      primary: "#174d3a",
      primaryForeground: "#ffffff",
      secondary: "#e6eee9",
      accent: "#d95d50",
      border: "#dce2de",
      destructive: "#b42318",
      success: "#16794a"
    },
    dark: {
      background: "#0f1210",
      surface: "#191d1a",
      foreground: "#f4f7f4",
      mutedForeground: "#aeb7b1",
      primary: "#62c493",
      primaryForeground: "#102117",
      secondary: "#26342d",
      accent: "#f09a90",
      border: "#343b37",
      destructive: "#f97066",
      success: "#5bd59a"
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 24,
    "3xl": 32
  },
  radius: {
    control: 6,
    card: 8
  },
  typography: {
    display: { fontSize: 32, lineHeight: 38 },
    title: { fontSize: 24, lineHeight: 30 },
    heading: { fontSize: 18, lineHeight: 24 },
    body: { fontSize: 16, lineHeight: 24 },
    label: { fontSize: 14, lineHeight: 20 },
    caption: { fontSize: 12, lineHeight: 16 }
  }
} as const;
