/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#f7f8f6",
        "background-dark": "#0f1210",
        surface: "#ffffff",
        "surface-dark": "#191d1a",
        foreground: "#171a18",
        "foreground-dark": "#f4f7f4",
        "muted-foreground": "#68706b",
        "muted-foreground-dark": "#aeb7b1",
        primary: "#174d3a",
        "primary-dark": "#62c493",
        "primary-hover": "#103d2e",
        "primary-foreground": "#ffffff",
        "primary-foreground-dark": "#102117",
        secondary: "#e6eee9",
        "secondary-dark": "#26342d",
        accent: "#d95d50",
        "accent-dark": "#f09a90",
        border: "#dce2de",
        "border-dark": "#343b37",
        destructive: "#b42318",
        "destructive-dark": "#f97066",
        success: "#16794a",
        "success-dark": "#5bd59a",
        warning: "#a15c07"
      },
      borderRadius: {
        control: "6px",
        card: "8px"
      },
      fontSize: {
        display: ["32px", { lineHeight: "38px" }],
        title: ["24px", { lineHeight: "30px" }],
        heading: ["18px", { lineHeight: "24px" }],
        body: ["16px", { lineHeight: "24px" }],
        label: ["14px", { lineHeight: "20px" }],
        caption: ["12px", { lineHeight: "16px" }]
      },
      spacing: {
        18: "72px"
      }
    }
  },
  plugins: []
};
