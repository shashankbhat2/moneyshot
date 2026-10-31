// Exporting the styled screenshot: PNG, JPG, WebP or SVG, at 1x, 2x or 4K.
import { drawShot, type ShotStyle } from "./screenshot-style";

export type ExportFormat = "png" | "jpeg" | "webp" | "svg";
export type ExportSize = "1x" | "2x" | "4k";
export type ExportOptions = { format: ExportFormat; size: ExportSize };

export const DEFAULT_EXPORT: ExportOptions = { format: "png", size: "2x" };

export const FORMATS: { id: ExportFormat; label: string; extension: string; mime: string }[] = [
  { id: "png", label: "PNG", extension: "png", mime: "image/png" },
  { id: "jpeg", label: "JPG", extension: "jpg", mime: "image/jpeg" },
  { id: "webp", label: "WebP", extension: "webp", mime: "image/webp" },
  { id: "svg", label: "SVG", extension: "svg", mime: "image/svg+xml" },
];

export const SIZES: { id: ExportSize; label: string }[] = [
  { id: "1x", label: "1x" },
  { id: "2x", label: "2x" },
  { id: "4k", label: "4K" },
];

/** 4K UHD: the longer side is 3840 px. */
const UHD = 3840;

export const formatFor = (id: ExportFormat) =>
  FORMATS.find((format) => format.id === id) ?? (FORMATS[0] as (typeof FORMATS)[number]);

/** How much to scale an image of `width` × `height` for an export size. */
export function exportScale(width: number, height: number, size: ExportSize) {
  if (size === "1x") return 1;
  if (size === "2x") return 2;
  return UHD / Math.max(width, height);
}

export function exportDimensions(width: number, height: number, size: ExportSize) {
  const scale = exportScale(width, height, size);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function exportFileName(format: ExportFormat, date = new Date()) {
  const stamp = date.toISOString().slice(0, 19).replace(/[T:]/g, "-");
  return `moneyshot-${stamp}.${formatFor(format).extension}`;
}

/**
 * Screenshots are pixels, so the SVG wraps the rendered PNG. It still scales cleanly in design
 * tools and on the web, and keeps transparency.
 */
export function svgWrapping(pngDataUrl: string, width: number, height: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image href="${pngDataUrl}" width="${width}" height="${height}"/></svg>`;
}

const canvasBlob = (canvas: HTMLCanvasElement, mime: string, quality?: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      mime,
      quality,
    ),
  );

type Drawable = CanvasImageSource & { width: number; height: number };

/** Render the screenshot at the chosen size and encode it in the chosen format. */
export async function renderExport(
  image: Drawable,
  style: ShotStyle,
  background: Drawable | null,
  { format, size }: ExportOptions,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const { output } = drawShot(canvas, image, style, background);
  const scale = exportScale(output.width, output.height, size);
  if (scale !== 1) drawShot(canvas, image, style, background, { scale });

  if (format === "svg") {
    const png = canvas.toDataURL("image/png");
    return new Blob([svgWrapping(png, canvas.width, canvas.height)], { type: "image/svg+xml" });
  }
  if (format === "jpeg") {
    // JPG has no transparency; put transparent areas on white rather than black.
    const flat = document.createElement("canvas");
    flat.width = canvas.width;
    flat.height = canvas.height;
    const context = flat.getContext("2d");
    if (!context) throw new Error("Export failed");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, flat.width, flat.height);
    context.drawImage(canvas, 0, 0);
    return canvasBlob(flat, "image/jpeg", 0.92);
  }
  return canvasBlob(canvas, formatFor(format).mime, format === "webp" ? 0.92 : undefined);
}
