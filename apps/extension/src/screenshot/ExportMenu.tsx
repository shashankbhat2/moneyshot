import { ChevronDown, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Segmented } from "../components/Segmented";
import {
  type ExportFormat,
  type ExportOptions,
  type ExportSize,
  exportDimensions,
  FORMATS,
  formatFor,
  SIZES,
} from "../lib/export";

/**
 * Download button with export options (format and size) behind the chevron. `getBase` returns
 * the image's size at 1x, read when the menu renders so it matches the drawn preview.
 */
export function ExportMenu({
  options,
  getBase,
  disabled,
  onChange,
  onDownload,
}: {
  options: ExportOptions;
  getBase: () => { width: number; height: number } | null;
  disabled: boolean;
  onChange: (options: ExportOptions) => void;
  onDownload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const base = open ? getBase() : null;
  const dimensions = base ? exportDimensions(base.width, base.height, options.size) : null;
  const label = formatFor(options.format).label;

  return (
    <div ref={root} className="relative flex">
      <button
        type="button"
        onClick={onDownload}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-l-xl bg-brand py-2 pr-3 pl-4 font-semibold text-sm text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
      >
        <Download className="size-4" aria-hidden />
        Download {label}
      </button>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Export options"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="rounded-r-xl border-white/25 border-l bg-brand px-2 text-white transition-colors hover:bg-brand-600"
      >
        <ChevronDown
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Export options"
          className="absolute top-full right-0 z-30 mt-2 w-72 space-y-4 rounded-2xl border border-line bg-surface p-4 shadow-xl"
        >
          <div className="space-y-1.5">
            <p className="text-muted text-xs">Format</p>
            <Segmented
              label="Format"
              value={options.format}
              onChange={(format: ExportFormat) => onChange({ ...options, format })}
              options={FORMATS.map((format) => ({ value: format.id, label: format.label }))}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-muted text-xs">Size</p>
            <Segmented
              label="Export size"
              value={options.size}
              onChange={(size: ExportSize) => onChange({ ...options, size })}
              options={SIZES.map((size) => ({ value: size.id, label: size.label }))}
            />
          </div>
          <p className="text-muted text-xs tabular-nums">
            {dimensions ? `${dimensions.width} × ${dimensions.height} px` : null}
            {options.format === "svg" && (
              <span className="mt-1 block text-subtle">
                The screenshot is embedded as an image inside the SVG.
              </span>
            )}
            {options.format === "jpeg" && (
              <span className="mt-1 block text-subtle">Transparent areas become white.</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
