export type Theme = "system" | "light" | "dark";

export function resolveTheme(theme: Theme, prefersDark: boolean): "light" | "dark" {
  if (theme === "system") return prefersDark ? "dark" : "light";
  return theme;
}

/** Keep `data-theme` on <html> in sync with the system light/dark theme. */
export function initTheme(root: HTMLElement = document.documentElement) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    root.dataset.theme = resolveTheme("system", media.matches);
  };
  apply();
  media.addEventListener("change", apply);
}
