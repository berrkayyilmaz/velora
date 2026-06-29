import { Moon, Sun } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getTheme, setTheme, type Theme } from "@/theme/theme";

export function ThemeToggle() {
  const [theme, updateTheme] = useState<Theme>(getTheme);
  const isDark = theme === "dark";

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    updateTheme(nextTheme);
  };

  return (
    <Button
      aria-label={isDark ? "Use light theme" : "Use dark theme"}
      onClick={toggleTheme}
      size="icon"
      title={isDark ? "Use light theme" : "Use dark theme"}
      type="button"
      variant="outline"
    >
      {isDark ? <Sun aria-hidden="true" size={17} /> : <Moon aria-hidden="true" size={17} />}
    </Button>
  );
}
