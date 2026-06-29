export const designTokens = {
  colors: {
    light: {
      background: "#f7f8f6",
      surface: "#ffffff",
      foreground: "#171a18",
      mutedForeground: "#68706b",
      primary: "#174d3a",
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
      accent: "#f09a90",
      border: "#343b37",
      destructive: "#f97066",
      success: "#5bd59a"
    }
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "2rem"
  },
  radius: {
    control: "0.375rem",
    card: "0.5rem"
  },
  typography: {
    display: { fontSize: "2rem", lineHeight: "2.375rem" },
    title: { fontSize: "1.5rem", lineHeight: "1.875rem" },
    heading: { fontSize: "1.125rem", lineHeight: "1.5rem" },
    body: { fontSize: "1rem", lineHeight: "1.5rem" },
    label: { fontSize: "0.875rem", lineHeight: "1.25rem" },
    caption: { fontSize: "0.75rem", lineHeight: "1rem" }
  }
} as const;
