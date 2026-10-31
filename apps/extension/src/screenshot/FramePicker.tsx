import { useId, useMemo } from "react";
import { DEFAULT_STYLE, drawShot } from "../lib/screenshot-style";
import { FRAMES, type Frame } from "../lib/shot-frames";

/** An empty page, so the thumbnail shows only the frame. */
function placeholderPage() {
  const page = document.createElement("canvas");
  page.width = 400;
  page.height = 250;
  const context = page.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 400, 250);
  return page;
}

const thumbnails = new Map<Frame, string>();

/** Each frame drawn by the real renderer around a placeholder page. */
function frameThumbnail(frame: Frame) {
  const cached = thumbnails.get(frame);
  if (cached) return cached;
  try {
    const page = placeholderPage();
    if (!page) return null;
    const canvas = document.createElement("canvas");
    drawShot(canvas, page, {
      ...DEFAULT_STYLE,
      // A neutral backdrop, so light frames and stacked cards stand out.
      background: { kind: "solid", color: "#a1a1aa" },
      aspect: "4:3",
      padding: 0.1,
      radius: 16,
      shadow: 0.2,
      frame,
    });
    const url = canvas.toDataURL();
    thumbnails.set(frame, url);
    return url;
  } catch {
    return null;
  }
}

export function FramePicker({
  value,
  onChange,
}: {
  value: Frame;
  onChange: (frame: Frame) => void;
}) {
  const name = useId();
  const images = useMemo(() => FRAMES.map((frame) => frameThumbnail(frame.id)), []);
  return (
    <div role="radiogroup" aria-label="Frame" className="grid grid-cols-3 gap-2">
      {FRAMES.map((frame, index) => {
        const selected = frame.id === value;
        const image = images[index];
        return (
          <label key={frame.id} className="group relative block cursor-pointer">
            <span
              className={`block aspect-[4/3] overflow-hidden rounded-xl bg-raised ring-offset-2 ring-offset-surface transition-shadow group-has-focus-visible:ring-2 group-has-focus-visible:ring-fg/40 ${
                selected ? "ring-2 ring-fg" : "ring-1 ring-line group-hover:ring-subtle"
              }`}
            >
              {image && <img src={image} alt="" className="size-full object-cover" />}
            </span>
            <span
              className={`mt-1 block truncate text-center text-[11px] ${selected ? "text-fg" : "text-muted"}`}
            >
              {frame.label}
            </span>
            <input
              type="radio"
              name={name}
              aria-label={frame.label}
              checked={selected}
              onChange={() => onChange(frame.id)}
              className="sr-only"
            />
          </label>
        );
      })}
    </div>
  );
}
