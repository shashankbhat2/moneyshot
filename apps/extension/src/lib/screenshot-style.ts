// Styling for the screenshot editor: background, frame, shadow, layout, text
// and watermark. layoutShot is pure; drawShot renders the same layout onto a canvas, so the
// preview and the exported PNG are identical.

import {
  DEFAULT_FILL,
  type Fill,
  legacyPattern,
  NO_PATTERN,
  paintFill,
  paintPattern,
  type ShotPattern,
  toFill,
} from "./shot-fills";
import { type Frame, frameInsets, type Insets, paintCard, toFrame } from "./shot-frames";
import { sizeFor } from "./shot-sizes";

export type TextFont = "sans" | "serif" | "mono";
export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type Point = { x: number; y: number };

export type ShotText = {
  value: string;
  placement: "top" | "bottom";
  /** Font size in px at 1000px screenshot width. */
  size: number;
  font: TextFont;
  color: string;
  /** Moved from its place above/below the screenshot, as a fraction of the canvas size. */
  offset: Point;
};

export type Watermark = {
  value: string;
  corner: Corner;
  opacity: number;
  color: "light" | "dark";
};

export type ShotStyle = {
  background: Fill;
  pattern: ShotPattern;
  /** Canvas size: a ratio, or a social/store size (see shot-sizes). */
  aspect: string;
  /** Space inside the frame around the screenshot, as a fraction of its shorter side. */
  inset: number;
  /** Color of the inset: "auto" samples the screenshot's edges. */
  insetColor: string;
  /** Corner radius in px at 1000px screenshot width. */
  radius: number;
  frame: Frame;
  /** Shadow strength, 0 (none) to 1. */
  shadow: number;
  /** Screenshot size inside the canvas (the canvas size doesn't change). */
  zoom: number;
  /** -1…1 on each axis: where the screenshot sits in the container's free space. */
  position: Point;
  /** -1…1 on each axis: which edge tilts toward the viewer, and how far. */
  tilt: Point;
  /** In-plane rotation in degrees. */
  rotation: number;
  text: ShotText;
  watermark: Watermark;
  /** Extra images placed on the canvas, drawn above the screenshot in order. */
  overlays: ShotOverlay[];
};

/** An uploaded image on the canvas. */
export type ShotOverlay = {
  /** Also the id of the image in the asset store. */
  id: string;
  /** Center, as a fraction of the canvas size. */
  x: number;
  y: number;
  /** Width as a fraction of the canvas width; the height follows the image. */
  width: number;
};

export const DEFAULT_STYLE: ShotStyle = {
  background: DEFAULT_FILL,
  pattern: NO_PATTERN,
  aspect: "auto",
  inset: 0,
  insetColor: "auto",
  radius: 12,
  frame: "none",
  shadow: 0.5,
  zoom: 1,
  position: { x: 0, y: 0 },
  tilt: { x: 0, y: 0 },
  rotation: 0,
  text: {
    value: "",
    placement: "top",
    size: 48,
    font: "sans",
    color: "#ffffff",
    offset: { x: 0, y: 0 },
  },
  watermark: { value: "", corner: "bottom-right", opacity: 0.7, color: "light" },
  overlays: [],
};

/** A saved style, filled in with defaults and upgraded from older versions. */
export function normalizeStyle(saved: unknown): ShotStyle {
  const value = (saved && typeof saved === "object" ? saved : {}) as Record<string, unknown>;
  return {
    ...DEFAULT_STYLE,
    ...(value as Partial<ShotStyle>),
    background:
      value.background === undefined ? DEFAULT_STYLE.background : toFill(value.background),
    pattern: legacyPattern(value.background) ?? {
      ...DEFAULT_STYLE.pattern,
      ...(value.pattern as Partial<ShotPattern> | undefined),
    },
    frame: toFrame(value.frame ?? DEFAULT_STYLE.frame),
    aspect: sizeFor(String(value.aspect ?? DEFAULT_STYLE.aspect)).id,
    shadow:
      typeof value.shadow === "number"
        ? value.shadow
        : (LEGACY_SHADOWS[String(value.shadow)] ?? DEFAULT_STYLE.shadow),
    text: { ...DEFAULT_STYLE.text, ...(value.text as Partial<ShotText> | undefined) },
    watermark: {
      ...DEFAULT_STYLE.watermark,
      ...(value.watermark as Partial<Watermark> | undefined),
    },
    overlays: Array.isArray(value.overlays) ? (value.overlays as ShotOverlay[]) : [],
  };
}

/** Canvas margin around the card at 100% size, as a fraction of the card's shorter side. */
const MARGIN = 0.1;

/** At the edge positions the screenshot slides this far (of its size) past the container edge. */
const BLEED = 0.25;
/** Tilt at the edge of the pad, in radians. */
const MAX_TILT = (28 * Math.PI) / 180;
/** Tiles per side when drawing a tilted screenshot. */
const MESH = 16;

/** Shadows were S/M/L before they became a strength. */
const LEGACY_SHADOWS: Record<string, number> = { none: 0, sm: 0.2, md: 0.5, lg: 1 };

/** Blur and offset (px at 1000px screenshot width) and opacity for a shadow strength. */
export function shadowFor(strength: number) {
  if (strength <= 0) return { blur: 0, y: 0, alpha: 0 };
  return { blur: 64 * strength, y: 24 * strength, alpha: 0.12 + 0.25 * strength };
}

const FONTS: Record<TextFont, string> = {
  sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  serif: "ui-serif, Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

export const textFont = (font: TextFont, px: number) =>
  `${font === "mono" ? 600 : 700} ${px}px ${FONTS[font]}`;

/** Width of `text` in `font`. drawShot measures on the canvas; this estimate is for tests. */
export type Measure = (text: string, font: string) => number;
const estimate: Measure = (text, font) =>
  text.length * Number.parseFloat(font.split(" ")[1] ?? "16") * 0.55;

/** Split on newlines, then wrap each paragraph to `maxWidth`. */
export function wrapLines(value: string, font: string, maxWidth: number, measure: Measure) {
  const lines: string[] = [];
  for (const paragraph of value.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && measure(next, font) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}

export type Rect = { x: number; y: number; width: number; height: number };

export type ShotLayout = {
  width: number;
  height: number;
  /** The framed screenshot: frame insets plus the screenshot. */
  card: Rect;
  image: Rect;
  insets: Insets;
  /** Space between the frame and the screenshot, in layout units. */
  inset: number;
  /** Area the card is centered in, and moved within by position and zoom. */
  stage: Rect;
  text: {
    lines: string[];
    /** Center of the text block. */
    x: number;
    /** Top of the first line. */
    y: number;
    lineHeight: number;
    font: string;
    /** Width of the longest line. */
    width: number;
  } | null;
  /** Size of the exported image: the layout scaled to the chosen social/store size. */
  output: { width: number; height: number };
  /** Multiplier for sizes given at 1000px screenshot width. */
  unit: number;
};

export function layoutShot(
  image: { width: number; height: number },
  style: ShotStyle,
  measure: Measure = estimate,
): ShotLayout {
  const unit = image.width / 1000;
  const insets = frameInsets(style.frame, unit);
  const inset = Math.round(Math.min(image.width, image.height) * style.inset);
  const cardWidth = image.width + 2 * inset + insets.left + insets.right;
  const cardHeight = image.height + 2 * inset + insets.top + insets.bottom;

  // The canvas is the card plus a margin, grown to the chosen ratio. It depends only on the
  // screenshot, frame and inset, so text and size never move or resize the screenshot.
  const margin = Math.round(Math.min(cardWidth, cardHeight) * MARGIN);
  let width = cardWidth + 2 * margin;
  let height = cardHeight + 2 * margin;
  const preset = sizeFor(style.aspect);
  const ratio = preset.ratio;
  if (ratio) {
    if (width / height < ratio) width = Math.round(height * ratio);
    else height = Math.round(width / ratio);
  }

  // Text is drawn on the canvas, near the top or bottom edge, and can be dragged anywhere.
  const value = style.text.value.trim();
  let text: ShotLayout["text"] = null;
  if (value) {
    const size = Math.max(8, Math.round(style.text.size * unit));
    const font = textFont(style.text.font, size);
    const lineHeight = Math.round(size * 1.2);
    const lines = wrapLines(value, font, width * 0.85, measure);
    const textWidth = Math.max(...lines.map((line) => measure(line, font)));
    const block = lines.length * lineHeight;
    const edge = Math.max(Math.round(height * 0.05), Math.round(size * 0.5));
    const y = style.text.placement === "top" ? edge : height - edge - block;
    text = {
      lines,
      x: width / 2 + style.text.offset.x * width,
      y: y + style.text.offset.y * height,
      lineHeight,
      font,
      width: textWidth,
    };
  }

  const card = {
    x: Math.round((width - cardWidth) / 2),
    y: Math.round((height - cardHeight) / 2),
    width: cardWidth,
    height: cardHeight,
  };
  return {
    width,
    height,
    card,
    image: {
      x: card.x + insets.left + inset,
      y: card.y + insets.top + inset,
      width: image.width,
      height: image.height,
    },
    insets,
    inset,
    stage: { x: 0, y: 0, width, height },
    text,
    unit,
    output: preset.pixels ?? { width, height },
  };
}

/** Where an overlay image goes on the canvas, in layout units. */
export function overlayRect(
  layout: Pick<ShotLayout, "width" | "height">,
  overlay: ShotOverlay,
  image: { width: number; height: number },
): Rect {
  const width = overlay.width * layout.width;
  const height = image.width > 0 ? (width * image.height) / image.width : width;
  return {
    x: overlay.x * layout.width - width / 2,
    y: overlay.y * layout.height - height / 2,
    width,
    height,
  };
}

/**
 * Where the (zoomed) card goes. Position 0 centers it in the stage; ±1 slides it to that edge
 * and past it by BLEED of its size, so it's cropped by the container ("behind" the edge).
 * Zoomed past the container, the same range pans across the screenshot.
 */
export function placeCard(layout: ShotLayout, style: Pick<ShotStyle, "zoom" | "position">): Rect {
  const { stage } = layout;
  const width = layout.card.width * style.zoom;
  const height = layout.card.height * style.zoom;
  const freeX = (stage.width - width) / 2;
  const freeY = (stage.height - height) / 2;
  const travelX = Math.abs(freeX) + width * BLEED;
  const travelY = Math.abs(freeY) + height * BLEED;
  return {
    // `+ 0` turns -0 into 0.
    x: stage.x + freeX + style.position.x * travelX + 0,
    y: stage.y + freeY + style.position.y * travelY + 0,
    width,
    height,
  };
}

/** The position (see placeCard) that puts the card's center at `center`, within -1…1. */
export function positionForCenter(
  layout: ShotLayout,
  style: Pick<ShotStyle, "zoom">,
  center: Point,
): Point {
  const { stage } = layout;
  const width = layout.card.width * style.zoom;
  const height = layout.card.height * style.zoom;
  const freeX = (stage.width - width) / 2;
  const freeY = (stage.height - height) / 2;
  const travelX = Math.abs(freeX) + width * BLEED;
  const travelY = Math.abs(freeY) + height * BLEED;
  const clamp = (value: number) => Math.max(-1, Math.min(1, value)) + 0;
  return {
    x: clamp((center.x - width / 2 - stage.x - freeX) / travelX),
    y: clamp((center.y - height / 2 - stage.y - freeY) / travelY),
  };
}

/** The text block's bounds, for picking it up on the canvas. */
export function textBox(layout: ShotLayout): Rect | null {
  const { text } = layout;
  if (!text) return null;
  return {
    x: text.x - text.width / 2,
    y: text.y,
    width: text.width,
    height: text.lines.length * text.lineHeight,
  };
}

/**
 * Perspective projection of a point on the card (u, v in 0…1) tilted by `tilt`, relative to the
 * card's center. The handle's side comes toward the viewer: tilt.x > 0 enlarges the right edge.
 */
export function tiltedPoint(
  u: number,
  v: number,
  width: number,
  height: number,
  tilt: Point,
): Point {
  const dx = (u - 0.5) * width;
  const dy = (v - 0.5) * height;
  const rotateY = -tilt.x * MAX_TILT;
  const rotateX = tilt.y * MAX_TILT;
  const x1 = dx * Math.cos(rotateY);
  const z1 = -dx * Math.sin(rotateY);
  const y2 = dy * Math.cos(rotateX) - z1 * Math.sin(rotateX);
  const z2 = dy * Math.sin(rotateX) + z1 * Math.cos(rotateX);
  const distance = Math.max(width, height) * 2.2;
  const scale = distance / (distance - z2);
  return { x: x1 * scale, y: y2 * scale };
}

/** Draw `source` stretched onto a triangle, by mapping three source points to three destination points. */
function drawTriangle(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  [s0, s1, s2]: [Point, Point, Point],
  [d0, d1, d2]: [Point, Point, Point],
) {
  const det = (s0.x - s2.x) * (s1.y - s2.y) - (s1.x - s2.x) * (s0.y - s2.y);
  if (det === 0) return;
  const a = ((d0.x - d2.x) * (s1.y - s2.y) - (d1.x - d2.x) * (s0.y - s2.y)) / det;
  const b = ((d0.y - d2.y) * (s1.y - s2.y) - (d1.y - d2.y) * (s0.y - s2.y)) / det;
  const c = ((d1.x - d2.x) * (s0.x - s2.x) - (d0.x - d2.x) * (s1.x - s2.x)) / det;
  const d = ((d1.y - d2.y) * (s0.x - s2.x) - (d0.y - d2.y) * (s1.x - s2.x)) / det;
  const e = d2.x - a * s2.x - c * s2.y;
  const f = d2.y - b * s2.x - d * s2.y;

  // Grow the clip slightly so neighbouring triangles overlap and no seams show.
  const cx = (d0.x + d1.x + d2.x) / 3;
  const cy = (d0.y + d1.y + d2.y) / 3;
  const grow = (p: Point) => {
    const length = Math.hypot(p.x - cx, p.y - cy) || 1;
    return { x: p.x + ((p.x - cx) / length) * 1.5, y: p.y + ((p.y - cy) / length) * 1.5 };
  };
  const [g0, g1, g2] = [grow(d0), grow(d1), grow(d2)];

  context.save();
  context.beginPath();
  context.moveTo(g0.x, g0.y);
  context.lineTo(g1.x, g1.y);
  context.lineTo(g2.x, g2.y);
  context.closePath();
  context.clip();
  context.transform(a, b, c, d, e, f);
  const minX = Math.max(0, Math.floor(Math.min(s0.x, s1.x, s2.x)) - 1);
  const minY = Math.max(0, Math.floor(Math.min(s0.y, s1.y, s2.y)) - 1);
  const maxX = Math.ceil(Math.max(s0.x, s1.x, s2.x)) + 1;
  const maxY = Math.ceil(Math.max(s0.y, s1.y, s2.y)) + 1;
  context.drawImage(
    source,
    minX,
    minY,
    maxX - minX,
    maxY - minY,
    minX,
    minY,
    maxX - minX,
    maxY - minY,
  );
  context.restore();
}

/** Draw the card onto `context` at `place`, tilted in perspective. */
function drawTilted(
  context: CanvasRenderingContext2D,
  card: HTMLCanvasElement,
  place: Rect,
  tilt: Point,
) {
  const centerX = place.x + place.width / 2;
  const centerY = place.y + place.height / 2;
  const grid: Point[][] = [];
  for (let j = 0; j <= MESH; j++) {
    const row: Point[] = [];
    for (let i = 0; i <= MESH; i++) {
      const p = tiltedPoint(i / MESH, j / MESH, place.width, place.height, tilt);
      row.push({ x: centerX + p.x, y: centerY + p.y });
    }
    grid.push(row);
  }
  const sx = card.width / MESH;
  const sy = card.height / MESH;
  for (let j = 0; j < MESH; j++) {
    for (let i = 0; i < MESH; i++) {
      const s00 = { x: i * sx, y: j * sy };
      const s10 = { x: (i + 1) * sx, y: j * sy };
      const s01 = { x: i * sx, y: (j + 1) * sy };
      const s11 = { x: (i + 1) * sx, y: (j + 1) * sy };
      const d00 = grid[j]?.[i] as Point;
      const d10 = grid[j]?.[i + 1] as Point;
      const d01 = grid[j + 1]?.[i] as Point;
      const d11 = grid[j + 1]?.[i + 1] as Point;
      drawTriangle(context, card, [s00, s10, s11], [d00, d10, d11]);
      drawTriangle(context, card, [s00, s11, s01], [d00, d11, d01]);
    }
  }
}

type Drawable = CanvasImageSource & { width: number; height: number };

function drawWatermark(
  context: CanvasRenderingContext2D,
  watermark: Watermark,
  width: number,
  height: number,
  /** Output px per layout unit; shadows ignore the canvas transform. */
  scale: number,
) {
  const value = watermark.value.trim();
  if (!value) return;
  const size = Math.max(12, Math.round(Math.min(width, height) * 0.024));
  const margin = Math.round(size * 1.2);
  context.save();
  context.font = `600 ${size}px ${FONTS.sans}`;
  context.globalAlpha = watermark.opacity;
  const light = watermark.color === "light";
  context.fillStyle = light ? "#ffffff" : "#17171c";
  if (light) {
    context.shadowColor = "rgb(0 0 0 / 0.3)";
    context.shadowBlur = size * 0.4 * scale;
  }
  const [vertical, horizontal] = watermark.corner.split("-");
  context.textAlign = horizontal === "left" ? "left" : "right";
  context.textBaseline = vertical === "top" ? "top" : "bottom";
  context.fillText(
    value,
    horizontal === "left" ? margin : width - margin,
    vertical === "top" ? margin : height - margin,
  );
  context.restore();
}

const edgeColors = new WeakMap<object, string>();

/** Average color of the screenshot's border pixels, for an "auto" inset. */
export function edgeColor(image: Drawable): string {
  const cached = edgeColors.get(image);
  if (cached) return cached;
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return "#ffffff";
  context.drawImage(image, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);
  let [r, g, b, count] = [0, 0, 0, 0];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x !== 0 && y !== 0 && x !== size - 1 && y !== size - 1) continue;
      const index = (y * size + x) * 4;
      r += data[index] ?? 0;
      g += data[index + 1] ?? 0;
      b += data[index + 2] ?? 0;
      count++;
    }
  }
  const hex = (value: number) =>
    Math.round(value / count)
      .toString(16)
      .padStart(2, "0");
  const color = `#${hex(r)}${hex(g)}${hex(b)}`;
  edgeColors.set(image, color);
  return color;
}

/**
 * Render the styled screenshot. `background` is the loaded image for an uploaded-image
 * background; `overlays` are the loaded images for style.overlays, by id; `scale` multiplies
 * the output size (for 2x and 4K exports).
 */
export function drawShot(
  canvas: HTMLCanvasElement,
  image: Drawable,
  style: ShotStyle,
  background?: Drawable | null,
  {
    scale: exportScale = 1,
    overlays,
  }: { scale?: number; overlays?: ReadonlyMap<string, Drawable> } = {},
) {
  const context = canvas.getContext("2d");
  const measure: Measure | undefined = context
    ? (text, font) => {
        context.font = font;
        return context.measureText(text).width;
      }
    : undefined;
  const layout = layoutShot(image, style, measure);
  const width = Math.round(layout.output.width * exportScale);
  const height = Math.round(layout.output.height * exportScale);
  canvas.width = width;
  canvas.height = height;
  if (!context) return layout;
  // Resizing the canvas resets its state, so set this after. The default ("low") is visibly
  // softer, and aliases when shrinking the screenshot.
  context.imageSmoothingQuality = "high";
  // Draw in layout units, scaled to the output size.
  const scale = width / layout.width;
  const scaleY = height / layout.height;
  context.setTransform(scale, 0, 0, scaleY, 0, 0);
  context.clearRect(0, 0, layout.width, layout.height);
  paintFill(context, style.background, layout.width, layout.height, background);
  paintPattern(context, style.pattern, layout.width, layout.height, layout.unit);

  if (layout.text) {
    const { text } = layout;
    context.save();
    context.font = text.font;
    context.fillStyle = style.text.color;
    context.textAlign = "center";
    context.textBaseline = "top";
    text.lines.forEach((line, index) => {
      context.fillText(line, text.x, text.y + index * text.lineHeight);
    });
    context.restore();
  }

  const card = document.createElement("canvas");
  card.width = layout.card.width;
  card.height = layout.card.height;
  paintCard(card, image, style.frame, layout.insets, style.radius * layout.unit, layout.unit, {
    size: layout.inset,
    color: style.insetColor === "auto" ? edgeColor(image) : style.insetColor,
  });

  // Draw the placed (and maybe rotated or tilted) card on its own layer, then composite that
  // layer with the shadow, so the shadow follows the card's actual shape. The layer is at the
  // output resolution, so large exports stay sharp.
  const place = placeCard(layout, style);
  const layer = document.createElement("canvas");
  layer.width = width;
  layer.height = height;
  const layerContext = layer.getContext("2d");
  if (!layerContext) return layout;
  layerContext.imageSmoothingQuality = "high";
  layerContext.setTransform(scale, 0, 0, scaleY, 0, 0);
  if (style.rotation) {
    const centerX = place.x + place.width / 2;
    const centerY = place.y + place.height / 2;
    layerContext.translate(centerX, centerY);
    layerContext.rotate((style.rotation * Math.PI) / 180);
    layerContext.translate(-centerX, -centerY);
  }
  if (style.tilt.x === 0 && style.tilt.y === 0) {
    layerContext.drawImage(card, place.x, place.y, place.width, place.height);
  } else {
    drawTilted(layerContext, card, place, style.tilt);
  }

  const shadow = shadowFor(style.shadow);
  context.save();
  if (shadow.alpha > 0) {
    // Shadows ignore the canvas transform, so scale them to the output size here.
    context.shadowColor = `rgb(0 0 0 / ${shadow.alpha})`;
    context.shadowBlur = shadow.blur * layout.unit * style.zoom * scale;
    context.shadowOffsetY = shadow.y * layout.unit * style.zoom * scale;
  }
  // The layer is already at output size.
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.drawImage(layer, 0, 0);
  context.restore();

  for (const overlay of style.overlays) {
    const picture = overlays?.get(overlay.id);
    if (!picture) continue;
    const rect = overlayRect(layout, overlay, picture);
    context.drawImage(picture, rect.x, rect.y, rect.width, rect.height);
  }

  drawWatermark(context, style.watermark, layout.width, layout.height, scale);
  return layout;
}
