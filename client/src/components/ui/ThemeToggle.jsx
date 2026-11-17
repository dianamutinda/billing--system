
import { useTheme } from "../../hooks/useTheme";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title="Toggle theme"
    >
      {isDark ? "☀ Light mode" : "☾ Dark mode"}
    </button>
  );
}
