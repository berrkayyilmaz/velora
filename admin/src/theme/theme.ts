export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "velora.admin.theme";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getTheme(): Theme {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  return storedTheme === "light" || storedTheme === "dark" ? storedTheme : getSystemTheme();
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function setTheme(theme: Theme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

export function initializeTheme() {
  applyTheme(getTheme());
}
