// Screenshot backgrounds, and the pattern layered over them. Every fill is drawn by paintFill
// and every pattern by paintPattern, so the swatches, the preview and the exported PNG all come
// from the same code.

export type MeshPoint = { x: number; y: number; color: string };
export type PatternKind = "dots" | "grid" | "waves" | "stripes" | "checks" | "plus";

export type Fill =
  | { kind: "none" }
  | { kind: "solid"; color: string }
  | { kind: "gradient"; stops: [string, string] }
  | { kind: "mesh"; base: string; points: MeshPoint[] }
  /** Layered hills under a sky, like the macOS wallpapers. */
  | { kind: "wallpaper"; sky: [string, string]; bands: string[]; seed: number }
  /** An uploaded image, stored in IndexedDB under `id`. */
  | { kind: "image"; id: string };

export type FillPreset = { label: string; fill: Fill };

/** A pattern drawn over the background. */
export type ShotPattern = {
  kind: PatternKind | "none";
  color: string;
  opacity: number;
  /** Size relative to the default spacing. */
  scale: number;
};

export const NO_PATTERN: ShotPattern = { kind: "none", color: "#ffffff", opacity: 0.35, scale: 1 };

export const PATTERN_KINDS: { kind: ShotPattern["kind"]; label: string }[] = [
  { kind: "none", label: "None" },
  { kind: "dots", label: "Dots" },
  { kind: "grid", label: "Grid" },
  { kind: "waves", label: "Waves" },
  { kind: "stripes", label: "Stripes" },
  { kind: "checks", label: "Checks" },
  { kind: "plus", label: "Plus" },
];

export const MESHES: FillPreset[] = [
  {
    label: "Aurora",
    fill: {
      kind: "mesh",
      base: "#1e1b4b",
      points: [
        { x: 0.1, y: 0.15, color: "#6237ff" },
        { x: 0.85, y: 0.2, color: "#22d3ee" },
        { x: 0.6, y: 0.9, color: "#f472b6" },
      ],
    },
  },
  {
    label: "Sherbet",
    fill: {
      kind: "mesh",
      base: "#fff7ed",
      points: [
        { x: 0.05, y: 0.1, color: "#fb923c" },
        { x: 0.9, y: 0.3, color: "#f9a8d4" },
        { x: 0.3, y: 0.95, color: "#fde047" },
      ],
    },
  },
  {
    label: "Lagoon",
    fill: {
      kind: "mesh",
      base: "#ecfeff",
      points: [
        { x: 0.15, y: 0.8, color: "#2dd4bf" },
        { x: 0.8, y: 0.1, color: "#60a5fa" },
        { x: 0.9, y: 0.9, color: "#a7f3d0" },
      ],
    },
  },
  {
    label: "Orchid",
    fill: {
      kind: "mesh",
      base: "#faf5ff",
      points: [
        { x: 0.2, y: 0.2, color: "#c084fc" },
        { x: 0.85, y: 0.75, color: "#818cf8" },
        { x: 0.1, y: 0.9, color: "#f0abfc" },
      ],
    },
  },
  {
    label: "Ember",
    fill: {
      kind: "mesh",
      base: "#1c1917",
      points: [
        { x: 0.2, y: 0.85, color: "#ea580c" },
        { x: 0.8, y: 0.15, color: "#be123c" },
        { x: 0.6, y: 0.6, color: "#f59e0b" },
      ],
    },
  },
  {
    label: "Mint",
    fill: {
      kind: "mesh",
      base: "#f0fdf4",
      points: [
        { x: 0.9, y: 0.1, color: "#86efac" },
        { x: 0.1, y: 0.3, color: "#bae6fd" },
        { x: 0.5, y: 0.95, color: "#d9f99d" },
      ],
    },
  },
  {
    label: "Midnight",
    fill: {
      kind: "mesh",
      base: "#020617",
      points: [
        { x: 0.15, y: 0.1, color: "#1d4ed8" },
        { x: 0.9, y: 0.85, color: "#7c3aed" },
        { x: 0.5, y: 0.5, color: "#0f766e" },
      ],
    },
  },
  {
    label: "Blush",
    fill: {
      kind: "mesh",
      base: "#fff1f2",
      points: [
        { x: 0.8, y: 0.2, color: "#fda4af" },
        { x: 0.15, y: 0.75, color: "#fecdd3" },
        { x: 0.5, y: 0.05, color: "#fed7aa" },
      ],
    },
  },
];

/** Original wallpapers in the style of the macOS ones: soft hills under a gradient sky. */
export const WALLPAPERS: FillPreset[] = [
  {
    label: "Meadow",
    fill: {
      kind: "wallpaper",
      sky: ["#7dd3fc", "#e0f2fe"],
      bands: ["#86efac", "#4ade80", "#16a34a", "#166534"],
      seed: 1,
    },
  },
  {
    label: "Dune",
    fill: {
      kind: "wallpaper",
      sky: ["#fdba74", "#fef3c7"],
      bands: ["#fb923c", "#ea580c", "#c2410c", "#7c2d12"],
      seed: 2,
    },
  },
  {
    label: "Bloom",
    fill: {
      kind: "wallpaper",
      sky: ["#c4b5fd", "#fce7f3"],
      bands: ["#f0abfc", "#c084fc", "#9333ea", "#581c87"],
      seed: 3,
    },
  },
  {
    label: "Tide",
    fill: {
      kind: "wallpaper",
      sky: ["#a5f3fc", "#ecfeff"],
      bands: ["#67e8f9", "#22d3ee", "#0891b2", "#164e63"],
      seed: 4,
    },
  },
  {
    label: "Ridge",
    fill: {
      kind: "wallpaper",
      sky: ["#fecaca", "#fff7ed"],
      bands: ["#fca5a5", "#ef4444", "#2563eb", "#1e3a8a"],
      seed: 5,
    },
  },
  {
    label: "Night",
    fill: {
      kind: "wallpaper",
      sky: ["#0f172a", "#312e81"],
      bands: ["#4338ca", "#3730a3", "#1e1b4b", "#020617"],
      seed: 6,
    },
  },
];

export const GRADIENTS: FillPreset[] = [
  { label: "Dusk", fill: { kind: "gradient", stops: ["#6237ff", "#c084fc"] } },
  { label: "Peach", fill: { kind: "gradient", stops: ["#fb923c", "#f472b6"] } },
  { label: "Sea", fill: { kind: "gradient", stops: ["#22d3ee", "#6366f1"] } },
  { label: "Meadow", fill: { kind: "gradient", stops: ["#bef264", "#22c55e"] } },
  { label: "Haze", fill: { kind: "gradient", stops: ["#e0e7ff", "#fae8ff"] } },
  { label: "Slate", fill: { kind: "gradient", stops: ["#334155", "#0f172a"] } },
];

export const SOLIDS: FillPreset[] = [
  { label: "Transparent", fill: { kind: "none" } },
  { label: "White", fill: { kind: "solid", color: "#ffffff" } },
  { label: "Mist", fill: { kind: "solid", color: "#ececf1" } },
  { label: "Sand", fill: { kind: "solid", color: "#f5efe6" } },
  { label: "Ink", fill: { kind: "solid", color: "#17171c" } },
  { label: "Violet", fill: { kind: "solid", color: "#6237ff" } },
  { label: "Sky", fill: { kind: "solid", color: "#bae6fd" } },
  { label: "Rose", fill: { kind: "solid", color: "#fecdd3" } },
];

export type FillCategory = "images" | "mesh" | "solid" | "gradient";

/** Images also lists saved and uploaded backgrounds, ahead of the wallpapers. */
export const CATEGORIES: { id: FillCategory; label: string; presets: FillPreset[] }[] = [
  { id: "images", label: "Images", presets: WALLPAPERS },
  { id: "mesh", label: "Mesh", presets: MESHES },
  { id: "solid", label: "Solid", presets: SOLIDS },
  { id: "gradient", label: "Gradient", presets: GRADIENTS },
];

export const DEFAULT_FILL = (MESHES[0] as FillPreset).fill;

/** Presets were saved by id before backgrounds became fills. */
const LEGACY_IDS: Record<string, Fill> = {
  none: { kind: "none" },
  white: { kind: "solid", color: "#ffffff" },
  mist: { kind: "solid", color: "#ececf1" },
  ink: { kind: "solid", color: "#17171c" },
  accent: { kind: "solid", color: "#6237ff" },
  dusk: { kind: "gradient", stops: ["#6237ff", "#c084fc"] },
  peach: { kind: "gradient", stops: ["#fb923c", "#f472b6"] },
  sea: { kind: "gradient", stops: ["#22d3ee", "#6366f1"] },
  meadow: { kind: "gradient", stops: ["#bef264", "#22c55e"] },
  haze: { kind: "gradient", stops: ["#e0e7ff", "#fae8ff"] },
};

const FILL_KINDS = new Set(["none", "solid", "gradient", "mesh", "wallpaper", "image"]);

export function toFill(value: unknown): Fill {
  if (typeof value === "string") return LEGACY_IDS[value] ?? DEFAULT_FILL;
  if (!value || typeof value !== "object" || !("kind" in value)) return DEFAULT_FILL;
  // Patterns used to be backgrounds; keep their background color (the pattern is split out).
  if (value.kind === "pattern" && "background" in value) {
    return { kind: "solid", color: String(value.background) };
  }
  return FILL_KINDS.has(String(value.kind)) ? (value as Fill) : DEFAULT_FILL;
}

/** The pattern of a background saved when patterns were backgrounds, if it was one. */
export function legacyPattern(value: unknown): ShotPattern | null {
  if (!value || typeof value !== "object") return null;
  const fill = value as { kind?: unknown; pattern?: unknown; color?: unknown; scale?: unknown };
  if (fill.kind !== "pattern") return null;
  return {
    kind: fill.pattern as PatternKind,
    color: String(fill.color),
    opacity: 1,
    scale: Number(fill.scale) || 1,
  };
}

export const sameFill = (a: Fill, b: Fill) => JSON.stringify(a) === JSON.stringify(b);

export function fillLabel(fill: Fill): string {
  for (const category of CATEGORIES) {
    const preset = category.presets.find((candidate) => sameFill(candidate.fill, fill));
    if (preset) return preset.label;
  }
  if (fill.kind === "image") return "Image";
  if (fill.kind === "solid") return fill.color.toUpperCase();
  return "Custom";
}

/** The tab a fill belongs to, so the picker opens where the current background is. */
export function categoryOf(fill: Fill): FillCategory {
  switch (fill.kind) {
    case "mesh":
      return "mesh";
    case "gradient":
      return "gradient";
    case "wallpaper":
    case "image":
      return "images";
    default:
      return "solid";
  }
}

const PALETTES = [
  ["#6237ff", "#22d3ee", "#f472b6", "#1e1b4b"],
  ["#fb923c", "#f9a8d4", "#fde047", "#fff7ed"],
  ["#2dd4bf", "#60a5fa", "#a7f3d0", "#ecfeff"],
  ["#c084fc", "#818cf8", "#f0abfc", "#faf5ff"],
  ["#ea580c", "#be123c", "#f59e0b", "#1c1917"],
  ["#1d4ed8", "#7c3aed", "#0f766e", "#020617"],
];

/** A new mesh from one of the palettes, with the points scattered. */
export function randomMesh(random: () => number = Math.random): Fill {
  const palette = PALETTES[Math.floor(random() * PALETTES.length)] ?? (PALETTES[0] as string[]);
  const round = (value: number) => Math.round(value * 100) / 100;
  return {
    kind: "mesh",
    base: palette[3] as string,
    points: palette.slice(0, 3).map((color) => ({ x: round(random()), y: round(random()), color })),
  };
}

// --- Painting -----------------------------------------------------------------------

export function parseHex(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value.slice(0, 6);
  const number = Number.parseInt(full, 16) || 0;
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

const rgba = (hex: string, alpha: number) => `rgb(${parseHex(hex).join(" ")} / ${alpha})`;

/** Mix a color toward black (amount > 0) or white (amount < 0). */
function shade(hex: string, amount: number) {
  const target = amount > 0 ? 0 : 255;
  const t = Math.abs(amount);
  const [r, g, b] = parseHex(hex).map((channel) => Math.round(channel + (target - channel) * t));
  return `rgb(${r} ${g} ${b})`;
}

/** Small deterministic pseudo-random sequence, so a wallpaper looks the same every time. */
function seeded(seed: number) {
  let state = seed * 9301 + 49297;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function paintWallpaper(
  context: CanvasRenderingContext2D,
  fill: Extract<Fill, { kind: "wallpaper" }>,
  width: number,
  height: number,
) {
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, fill.sky[0]);
  sky.addColorStop(1, fill.sky[1]);
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  const random = seeded(fill.seed);
  const count = fill.bands.length;
  fill.bands.forEach((color, index) => {
    const base = height * (0.3 + (0.62 * (index + 1)) / (count + 1));
    const amplitude = height * (0.05 + random() * 0.05);
    const [f1, f2] = [0.6 + random() * 1.2, 1.5 + random() * 2];
    const [p1, p2] = [random() * Math.PI * 2, random() * Math.PI * 2];
    context.beginPath();
    context.moveTo(0, height);
    const steps = 96;
    for (let step = 0; step <= steps; step++) {
      const u = step / steps;
      const y =
        base +
        amplitude *
          (0.7 * Math.sin(u * Math.PI * 2 * f1 + p1) + 0.3 * Math.sin(u * Math.PI * 2 * f2 + p2));
      context.lineTo(u * width, y);
    }
    context.lineTo(width, height);
    context.closePath();
    const band = context.createLinearGradient(0, base - amplitude, 0, height);
    band.addColorStop(0, color);
    band.addColorStop(1, shade(color, 0.3));
    context.fillStyle = band;
    context.fill();
  });
}

/** Draw `pattern` over whatever is on the canvas. */
export function paintPattern(
  context: CanvasRenderingContext2D,
  pattern: ShotPattern,
  width: number,
  height: number,
  unit: number,
) {
  if (pattern.kind === "none") return;
  context.save();
  context.globalAlpha = pattern.opacity;
  drawPattern(context, { ...pattern, kind: pattern.kind }, width, height, unit);
  context.restore();
}

function drawPattern(
  context: CanvasRenderingContext2D,
  fill: ShotPattern & { kind: PatternKind },
  width: number,
  height: number,
  unit: number,
) {
  const size = Math.max(4, 28 * fill.scale * unit);
  const line = Math.max(1, 1.5 * unit);
  context.fillStyle = fill.color;
  context.strokeStyle = fill.color;
  context.lineWidth = line;
  context.lineCap = "round";

  switch (fill.kind) {
    case "dots": {
      const radius = Math.max(1, size * 0.1);
      for (let y = size / 2; y < height + size; y += size) {
        for (let x = size / 2; x < width + size; x += size) {
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        }
      }
      return;
    }
    case "grid": {
      context.beginPath();
      for (let x = 0; x <= width; x += size) {
        context.moveTo(x, 0);
        context.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += size) {
        context.moveTo(0, y);
        context.lineTo(width, y);
      }
      context.stroke();
      return;
    }
    case "waves": {
      const gap = size * 0.7;
      const wave = size * 2;
      context.beginPath();
      for (let y = 0; y < height + gap; y += gap) {
        context.moveTo(0, y);
        for (let x = 0; x <= width; x += Math.max(2, wave / 16)) {
          context.lineTo(x, y + Math.sin((x / wave) * Math.PI * 2) * size * 0.2);
        }
      }
      context.stroke();
      return;
    }
    case "stripes": {
      context.lineWidth = size * 0.25;
      context.lineCap = "butt";
      context.beginPath();
      for (let x = -height; x < width + height; x += size * 0.6) {
        context.moveTo(x, 0);
        context.lineTo(x + height, height);
      }
      context.stroke();
      return;
    }
    case "checks": {
      for (let y = 0, row = 0; y < height; y += size, row++) {
        for (let x = (row % 2) * size; x < width; x += size * 2) context.fillRect(x, y, size, size);
      }
      return;
    }
    case "plus": {
      const arm = size * 0.14;
      context.beginPath();
      for (let y = size / 2; y < height + size; y += size) {
        for (let x = size / 2; x < width + size; x += size) {
          context.moveTo(x - arm, y);
          context.lineTo(x + arm, y);
          context.moveTo(x, y - arm);
          context.lineTo(x, y + arm);
        }
      }
      context.stroke();
      return;
    }
  }
}

type Drawable = CanvasImageSource & { width: number; height: number };

/**
 * Paint `fill` over the whole canvas. `image` is the loaded upload for image fills
 * (cover-fitted).
 */
export function paintFill(
  context: CanvasRenderingContext2D,
  fill: Fill,
  width: number,
  height: number,
  image?: Drawable | null,
) {
  context.save();
  switch (fill.kind) {
    case "none":
      break;
    case "solid":
      context.fillStyle = fill.color;
      context.fillRect(0, 0, width, height);
      break;
    case "gradient": {
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, fill.stops[0]);
      gradient.addColorStop(1, fill.stops[1]);
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      break;
    }
    case "mesh": {
      context.fillStyle = fill.base;
      context.fillRect(0, 0, width, height);
      const radius = Math.max(width, height) * 0.75;
      for (const point of fill.points) {
        const x = point.x * width;
        const y = point.y * height;
        const glow = context.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, rgba(point.color, 1));
        glow.addColorStop(0.5, rgba(point.color, 0.45));
        glow.addColorStop(1, rgba(point.color, 0));
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);
      }
      break;
    }
    case "wallpaper":
      paintWallpaper(context, fill, width, height);
      break;
    case "image": {
      if (!image) break;
      const scale = Math.max(width / image.width, height / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      context.drawImage(
        image,
        (width - drawWidth) / 2,
        (height - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );
      break;
    }
  }
  context.restore();
}

/** CSS for the transparent checkerboard. */
export const CHECKERBOARD =
  "repeating-conic-gradient(#d4d4d8 0 25%, #fafafa 0 50%) 0 0 / 12px 12px";

const swatchCache = new Map<string, string>();

/** A small rendered thumbnail of a fill (data URL), or null where canvas isn't available. */
export function fillSwatch(fill: Fill): string | null {
  if (fill.kind === "none" || fill.kind === "image") return null;
  const key = JSON.stringify(fill);
  const cached = swatchCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 120;
  let context: CanvasRenderingContext2D | null = null;
  try {
    context = canvas.getContext("2d");
  } catch {
    return null;
  }
  if (!context) return null;
  paintFill(context, fill, canvas.width, canvas.height);
  const url = canvas.toDataURL();
  swatchCache.set(key, url);
  return url;
}

/** A thumbnail of a pattern over the background (a neutral one for uploaded images). */
export function patternSwatch(
  pattern: ShotPattern & { kind: PatternKind },
  background: Fill,
): string | null {
  const key = JSON.stringify([pattern, background]);
  const cached = swatchCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 120;
  let context: CanvasRenderingContext2D | null = null;
  try {
    context = canvas.getContext("2d");
  } catch {
    return null;
  }
  if (!context) return null;
  paintFill(
    context,
    background.kind === "image" ? { kind: "solid", color: "#a1a1aa" } : background,
    canvas.width,
    canvas.height,
  );
  // Patterns are hard to see at swatch size, so show them a bit stronger.
  paintPattern(
    context,
    { ...pattern, opacity: Math.max(pattern.opacity, 0.6) },
    canvas.width,
    canvas.height,
    0.4,
  );
  const url = canvas.toDataURL();
  swatchCache.set(key, url);
  return url;
}
