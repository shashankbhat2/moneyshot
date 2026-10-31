export type Theme = "system" | "light" | "dark";

/** chrome.storage.local key for the chosen theme. */
export const THEME_KEY = "theme";
/** localStorage copy, so pages open in the right theme without a flash. */
const CACHE_KEY = "moneyshot-theme";

const isTheme = (value: unknown): value is Theme =>
  value === "system" || value === "light" || value === "dark";

export function resolveTheme(theme: Theme, prefersDark: boolean): "light" | "dark" {
  if (theme === "system") return prefersDark ? "dark" : "light";
  return theme;
}

function readCachedTheme(): Theme {
  try {
    const value = localStorage.getItem(CACHE_KEY);
    return isTheme(value) ? value : "system";
  } catch {
    return "system";
  }
}

export async function getTheme(): Promise<Theme> {
  const { [THEME_KEY]: theme } = await chrome.storage.local.get(THEME_KEY);
  return isTheme(theme) ? theme : "system";
}

export async function setTheme(theme: Theme) {
  await chrome.storage.local.set({ [THEME_KEY]: theme });
}

/** Keep `data-theme` on <html> in sync with the chosen theme (and the system, for System). */
export function initTheme(root: HTMLElement = document.documentElement) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  let theme = readCachedTheme();

  const apply = () => {
    root.dataset.theme = resolveTheme(theme, media.matches);
  };
  const update = (next: Theme) => {
    theme = next;
    try {
      localStorage.setItem(CACHE_KEY, next);
    } catch {
      // Storage unavailable; the theme still applies, it's just not cached.
    }
    apply();
  };

  apply();
  media.addEventListener("change", apply);
  getTheme().then(update);
  chrome.storage.onChanged.addListener((changes, area) => {
    const change = changes[THEME_KEY];
    if (area === "local" && change) update(isTheme(change.newValue) ? change.newValue : "system");
  });
}
