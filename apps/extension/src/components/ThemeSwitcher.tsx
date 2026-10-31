import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { getTheme, setTheme, THEME_KEY, type Theme } from "../lib/theme";
import { Segmented } from "./Segmented";

/** System / Light / Dark, saved for every Moneyshot page. */
export function ThemeSwitcher() {
  const [theme, setLocal] = useState<Theme>("system");

  useEffect(() => {
    getTheme().then(setLocal);
    const onChange = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      const value = changes[THEME_KEY]?.newValue;
      if (area === "local" && value) setLocal(value as Theme);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  return (
    <Segmented
      label="Theme"
      value={theme}
      onChange={(next: Theme) => {
        setLocal(next);
        setTheme(next).catch(() => {});
      }}
      options={[
        { value: "system", label: "System theme", icon: Monitor, iconOnly: true },
        { value: "light", label: "Light theme", icon: Sun, iconOnly: true },
        { value: "dark", label: "Dark theme", icon: Moon, iconOnly: true },
      ]}
    />
  );
}
