import type { Theme } from "./theme";

export type ScreenshotKind = "visible" | "full" | "selection";
export type SelectionRect = { x: number; y: number; width: number; height: number };

const ICONS: Record<ScreenshotKind, string> = {
  visible:
    '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  full: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 7v8"/><path d="m9 12 3 3 3-3"/>',
  selection: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
};

const OPTIONS: { kind: ScreenshotKind; label: string; key: string }[] = [
  { kind: "visible", label: "Visible area", key: "1" },
  { kind: "full", label: "Full page", key: "2" },
  { kind: "selection", label: "Selection", key: "3" },
];

const LIGHT = `
  --fg: #17171c; --scrim: rgb(245 245 248 / 0.5); --tile-bg: rgb(255 255 255 / 0.85);
  --tile-hover: #ffffff; --tile-ring: rgb(23 23 28 / 0.08); --muted: rgb(23 23 28 / 0.55);
  --button-bg: rgb(23 23 28 / 0.08); --button-hover: rgb(23 23 28 / 0.14);
`;

const STYLES = `
  :host { all: initial; }
  .backdrop {
    --fg: #fff; --scrim: rgb(10 10 14 / 0.4); --tile-bg: rgb(255 255 255 / 0.1);
    --tile-hover: rgb(255 255 255 / 0.18); --tile-ring: rgb(255 255 255 / 0.12);
    --muted: rgb(255 255 255 / 0.6); --button-bg: rgb(255 255 255 / 0.14);
    --button-hover: rgb(255 255 255 / 0.24);
    position: fixed; inset: 0; display: grid; place-items: center; align-content: center; gap: 24px;
    font: 500 13px/1.2 ui-sans-serif, system-ui, sans-serif; color: var(--fg);
    background: var(--scrim); backdrop-filter: blur(6px); animation: fade-in 200ms ease-out;
  }
  .backdrop[data-theme="light"] { ${LIGHT} }
  @media (prefers-color-scheme: light) { .backdrop[data-theme="system"] { ${LIGHT} } }
  .options { display: flex; gap: 12px; animation: rise 260ms ease-out; }
  .option {
    display: grid; justify-items: center; gap: 12px; width: 132px; padding: 22px 12px 16px;
    border: 0; border-radius: 20px; cursor: pointer; font: inherit; color: var(--fg);
    background: var(--tile-bg); box-shadow: inset 0 0 0 1px var(--tile-ring);
    transition: background 120ms, transform 120ms;
  }
  .option:hover, .option:focus-visible { background: var(--tile-hover); transform: translateY(-2px); outline: none; }
  .option svg { width: 28px; height: 28px; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
  .option kbd { font: inherit; font-size: 11px; color: var(--muted); }
  .cancel {
    padding: 8px 14px; border-radius: 999px; border: 0; cursor: pointer; font: inherit;
    color: var(--fg); background: var(--button-bg);
  }
  .cancel:hover { background: var(--button-hover); }
  .cancel kbd { font: inherit; opacity: 0.6; margin-left: 6px; }
  @keyframes fade-in { from { opacity: 0; } }
  @keyframes rise { from { opacity: 0; transform: translateY(6px); } }
`;

const SELECT_STYLES = `
  :host { all: initial; }
  .layer { position: fixed; inset: 0; cursor: crosshair; background: rgb(0 0 0 / 0.35); }
  .layer.dragging { background: transparent; }
  .box {
    position: fixed; display: none; border: 1.5px solid #fff; border-radius: 2px;
    box-shadow: 0 0 0 100vmax rgb(0 0 0 / 0.35); box-sizing: border-box;
    /* The box sits over the layer; let the drag's moves and release reach the layer. */
    pointer-events: none;
  }
  .size {
    position: absolute; right: 0; top: calc(100% + 6px); padding: 3px 7px; border-radius: 6px;
    font: 500 11px/1 ui-sans-serif, system-ui, sans-serif; color: #fff; background: rgb(0 0 0 / 0.7);
    font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  .hint {
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 8px 14px;
    border-radius: 999px; font: 500 13px/1 ui-sans-serif, system-ui, sans-serif; color: #fff;
    background: rgb(0 0 0 / 0.7); pointer-events: none;
  }
`;

function mount(tag: string, css: string) {
  const host = document.createElement(tag);
  host.style.cssText = "position: fixed; inset: 0; z-index: 2147483647;";
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = css;
  root.append(style);
  document.documentElement.append(host);
  return { host, root };
}

/**
 * Step 2 of a screenshot: the same blurred overlay as the recording countdown, with
 * Visible area / Full page / Selection (also keys 1–3). Removed before `onPick` runs.
 */
export function showScreenshotPicker({
  theme,
  onPick,
  onCancel,
}: {
  theme: Theme;
  onPick: (kind: ScreenshotKind) => void;
  onCancel: () => void;
}) {
  const { host, root } = mount("moneyshot-picker", STYLES);
  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  backdrop.dataset.theme = theme;
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.setAttribute("aria-label", "Take a screenshot");

  const options = document.createElement("div");
  options.className = "options";
  for (const option of OPTIONS) {
    const button = document.createElement("button");
    button.className = "option";
    button.dataset.kind = option.kind;
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[option.kind]}</svg><span>${option.label}</span><kbd>${option.key}</kbd>`;
    button.addEventListener("click", () => finish(() => onPick(option.kind)));
    options.append(button);
  }

  const cancel = document.createElement("button");
  cancel.className = "cancel";
  cancel.innerHTML = "Cancel<kbd>Esc</kbd>";
  cancel.addEventListener("click", () => finish(onCancel));

  backdrop.append(options, cancel);
  root.append(backdrop);
  options.querySelector<HTMLButtonElement>("button")?.focus();

  let finished = false;
  function finish(callback: () => void) {
    if (finished) return;
    finished = true;
    document.removeEventListener("keydown", onKeyDown, true);
    host.remove();
    callback();
  }

  function onKeyDown(event: KeyboardEvent) {
    const option = OPTIONS.find((candidate) => candidate.key === event.key);
    if (!option && event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    finish(option ? () => onPick(option.kind) : onCancel);
  }
  document.addEventListener("keydown", onKeyDown, true);

  return () => finish(() => {});
}

/** Let the user drag a rectangle; resolves with it in viewport CSS px, or null if cancelled. */
export function selectArea(): Promise<SelectionRect | null> {
  return new Promise((resolve) => {
    const { host, root } = mount("moneyshot-selection", SELECT_STYLES);
    const layer = document.createElement("div");
    layer.className = "layer";
    const box = document.createElement("div");
    box.className = "box";
    const size = document.createElement("span");
    size.className = "size";
    box.append(size);
    const hint = document.createElement("div");
    hint.className = "hint";
    hint.textContent = "Drag to select an area · Esc to cancel";
    root.append(layer, box, hint);

    let start: { x: number; y: number } | null = null;
    let rect: SelectionRect | null = null;

    const done = (result: SelectionRect | null) => {
      document.removeEventListener("keydown", onKeyDown, true);
      host.remove();
      resolve(result);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      done(null);
    };
    document.addEventListener("keydown", onKeyDown, true);

    layer.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      // Keep receiving moves and the release even if the pointer leaves the window.
      layer.setPointerCapture?.(event.pointerId);
      start = { x: event.clientX, y: event.clientY };
      hint.remove();
    });
    layer.addEventListener("pointermove", (event) => {
      if (!start) return;
      rect = {
        x: Math.min(start.x, event.clientX),
        y: Math.min(start.y, event.clientY),
        width: Math.abs(event.clientX - start.x),
        height: Math.abs(event.clientY - start.y),
      };
      layer.classList.add("dragging");
      Object.assign(box.style, {
        display: "block",
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
      size.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    });
    layer.addEventListener("pointerup", () => {
      if (!start) return;
      // A click without dragging isn't a selection; keep waiting for a drag.
      if (!rect || rect.width < 8 || rect.height < 8) {
        start = null;
        rect = null;
        layer.classList.remove("dragging");
        box.style.display = "none";
        return;
      }
      done(rect);
    });
  });
}
