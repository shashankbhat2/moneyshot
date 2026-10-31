// Frames around the screenshot. A frame adds space on some sides of the screenshot (insets) and
// draws into the card: window bars, rulers, a border, or cards stacked behind it.

export type Frame =
  | "none"
  | "line"
  | "macos-light"
  | "macos-dark"
  | "windows"
  | "ruler"
  | "arc"
  | "stack-light"
  | "stack-dark";

export const FRAMES: { id: Frame; label: string }[] = [
  { id: "none", label: "None" },
  { id: "line", label: "Line" },
  { id: "macos-light", label: "macOS light" },
  { id: "macos-dark", label: "macOS dark" },
  { id: "windows", label: "Windows" },
  { id: "ruler", label: "Ruler" },
  { id: "arc", label: "Arc" },
  { id: "stack-light", label: "Stack light" },
  { id: "stack-dark", label: "Stack dark" },
];

export function toFrame(value: unknown): Frame {
  if (value === "window") return "macos-light";
  return FRAMES.some((frame) => frame.id === value) ? (value as Frame) : "none";
}

export type Insets = { top: number; right: number; bottom: number; left: number };

/** Space the frame adds around the screenshot, in px for a screenshot `unit` × 1000 px wide. */
export function frameInsets(frame: Frame, unit: number): Insets {
  const none = { top: 0, right: 0, bottom: 0, left: 0 };
  switch (frame) {
    case "macos-light":
    case "macos-dark":
    case "windows":
      return { ...none, top: Math.max(24, Math.round(36 * unit)) };
    case "ruler": {
      const ruler = Math.max(14, Math.round(22 * unit));
      return { ...none, top: ruler, left: ruler };
    }
    case "arc": {
      const border = Math.max(6, Math.round(10 * unit));
      return { top: border, right: border, bottom: border, left: border };
    }
    case "stack-light":
    case "stack-dark":
      return { ...none, bottom: Math.max(12, Math.round(28 * unit)) };
    default:
      return none;
  }
}

type Drawable = CanvasImageSource & { width: number; height: number };

function trafficLights(context: CanvasRenderingContext2D, bar: number) {
  const radius = bar * 0.17;
  ["#ff5f57", "#febc2e", "#28c840"].forEach((color, index) => {
    context.fillStyle = color;
    context.beginPath();
    context.arc(bar * 0.55 + index * bar * 0.52, bar / 2, radius, 0, Math.PI * 2);
    context.fill();
  });
}

function windowsButtons(
  context: CanvasRenderingContext2D,
  width: number,
  bar: number,
  unit: number,
) {
  const cell = bar * 1.3;
  const glyph = bar * 0.26;
  const y = bar / 2;
  context.strokeStyle = "#1f1f1f";
  context.lineWidth = Math.max(1, unit);
  context.beginPath();
  // Close, maximize, minimize from the right.
  let x = width - cell / 2;
  context.moveTo(x - glyph / 2, y - glyph / 2);
  context.lineTo(x + glyph / 2, y + glyph / 2);
  context.moveTo(x + glyph / 2, y - glyph / 2);
  context.lineTo(x - glyph / 2, y + glyph / 2);
  x -= cell;
  context.rect(x - glyph / 2, y - glyph / 2, glyph, glyph);
  x -= cell;
  context.moveTo(x - glyph / 2, y);
  context.lineTo(x + glyph / 2, y);
  context.stroke();
}

function rulers(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  size: number,
  unit: number,
) {
  context.fillStyle = "#f7f7f8";
  context.fillRect(0, 0, width, size);
  context.fillRect(0, 0, size, height);
  context.strokeStyle = "#a1a1aa";
  context.fillStyle = "#71717a";
  context.lineWidth = Math.max(1, 0.75 * unit);
  context.font = `500 ${Math.max(7, size * 0.36)}px ui-sans-serif, system-ui, sans-serif`;
  context.textBaseline = "top";

  // Ticks every 10 screenshot px, longer every 50, labelled every 100.
  const step = 10 * unit;
  context.beginPath();
  for (let i = 0; size + i * step <= width; i++) {
    const x = size + i * step;
    const length = i % 10 === 0 ? size : i % 5 === 0 ? size * 0.5 : size * 0.25;
    context.moveTo(x, size);
    context.lineTo(x, size - length);
    if (i % 10 === 0 && i > 0) context.fillText(String(i * 10), x + 3 * unit, size * 0.12);
  }
  for (let i = 0; size + i * step <= height; i++) {
    const y = size + i * step;
    const length = i % 10 === 0 ? size : i % 5 === 0 ? size * 0.5 : size * 0.25;
    context.moveTo(size, y);
    context.lineTo(size - length, y);
  }
  context.stroke();

  context.strokeStyle = "#d4d4d8";
  context.beginPath();
  context.moveTo(size, size);
  context.lineTo(width, size);
  context.moveTo(size, size);
  context.lineTo(size, height);
  context.stroke();
}

/**
 * Draw the card at 1:1: the frame, the inset, and the screenshot inside them with rounded
 * corners. `radius` is in card px.
 */
export function paintCard(
  canvas: HTMLCanvasElement,
  image: Drawable,
  frame: Frame,
  insets: Insets,
  radius: number,
  unit: number,
  /** Space around the screenshot inside the frame, and its color. */
  inset: { size: number; color: string } = { size: 0, color: "transparent" },
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.imageSmoothingQuality = "high";
  const { width, height } = canvas;
  const stacked = frame === "stack-light" || frame === "stack-dark";
  const front = { width, height: height - (stacked ? insets.bottom : 0) };

  if (stacked) {
    // Two narrower cards peeking out below, the farthest first.
    const colors =
      frame === "stack-light"
        ? ["rgb(255 255 255 / 0.4)", "rgb(255 255 255 / 0.7)"]
        : ["rgb(24 24 27 / 0.45)", "rgb(24 24 27 / 0.75)"];
    [2, 1].forEach((depth, index) => {
      const inset = width * 0.045 * depth;
      context.fillStyle = colors[index] as string;
      context.beginPath();
      context.roundRect(
        inset,
        (insets.bottom / 2) * depth,
        width - 2 * inset,
        front.height,
        radius,
      );
      context.fill();
    });
  }

  context.save();
  context.beginPath();
  context.roundRect(0, 0, front.width, front.height, radius);
  context.clip();

  if (frame === "arc") {
    context.fillStyle = "rgb(255 255 255 / 0.55)";
    context.fillRect(0, 0, width, height);
  }
  const bar = insets.top;
  if (frame === "macos-light" || frame === "macos-dark") {
    const dark = frame === "macos-dark";
    context.fillStyle = dark ? "#2a2a2f" : "#ececee";
    context.fillRect(0, 0, width, bar);
    context.fillStyle = dark ? "rgb(0 0 0 / 0.5)" : "rgb(0 0 0 / 0.08)";
    context.fillRect(0, bar - Math.max(1, unit), width, Math.max(1, unit));
    trafficLights(context, bar);
  }
  if (frame === "windows") {
    context.fillStyle = "#f3f3f3";
    context.fillRect(0, 0, width, bar);
    windowsButtons(context, width, bar, unit);
  }
  if (frame === "ruler") rulers(context, width, height, insets.top, unit);

  // The inset fills the space between the frame and the screenshot.
  if (inset.size > 0) {
    context.fillStyle = inset.color;
    context.fillRect(
      insets.left,
      insets.top,
      image.width + 2 * inset.size,
      image.height + 2 * inset.size,
    );
  }
  const x = insets.left + inset.size;
  const y = insets.top + inset.size;
  if (frame === "arc" || inset.size > 0) {
    // Inside a border or an inset, the screenshot gets its own, slightly smaller corners.
    const inner = frame === "arc" && inset.size === 0 ? radius - insets.left / 2 : radius * 0.6;
    context.save();
    context.beginPath();
    context.roundRect(x, y, image.width, image.height, Math.max(0, inner));
    context.clip();
    context.drawImage(image, x, y, image.width, image.height);
    context.restore();
  } else {
    context.drawImage(image, x, y, image.width, image.height);
  }
  context.restore();

  if (frame === "line") {
    const line = Math.max(1, 1.5 * unit);
    context.strokeStyle = "rgb(0 0 0 / 0.14)";
    context.lineWidth = line;
    context.beginPath();
    context.roundRect(line / 2, line / 2, width - line, height - line, radius);
    context.stroke();
  }
}
