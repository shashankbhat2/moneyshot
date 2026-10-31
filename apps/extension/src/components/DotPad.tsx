import { useRef } from "react";
import type { Point } from "../lib/screenshot-style";

const STOPS = [-1, 0, 1] as const;
const NAMES = {
  "-1": ["Top", "Left"],
  "0": ["Middle", "Center"],
  "1": ["Bottom", "Right"],
} as const;
/** Values this close to a dot snap to it. */
const SNAP = 0.14;

const clamp = (value: number) => Math.max(-1, Math.min(1, value));
const snap = (value: number) => STOPS.find((stop) => Math.abs(stop - value) < SNAP) ?? value;

function dotName(x: number, y: number) {
  if (x === 0 && y === 0) return "Center";
  const row = NAMES[String(y) as keyof typeof NAMES][0];
  const column = NAMES[String(x) as keyof typeof NAMES][1];
  if (y === 0) return column;
  if (x === 0) return row;
  return `${row} ${column.toLowerCase()}`;
}

type DotPadProps = {
  label: string;
  value: Point;
  onChange: (value: Point) => void;
};

/**
 * 2D control: drag the handle anywhere on the pad, or click one of the 3×3
 * dots. Values are -1…1 per axis, snapping to the dots; double-click to reset.
 */
export function DotPad({ label, value, onChange }: DotPadProps) {
  const pad = useRef<HTMLFieldSetElement>(null);
  const dragging = useRef(false);

  const fromPointer = (event: React.PointerEvent) => {
    const rect = pad.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    onChange({
      x: snap(clamp(((event.clientX - rect.left) / rect.width) * 2 - 1)),
      y: snap(clamp(((event.clientY - rect.top) / rect.height) * 2 - 1)),
    });
  };

  return (
    <div className="space-y-1.5">
      <p className="text-muted text-xs">{label}</p>
      <fieldset
        ref={pad}
        aria-label={label}
        onPointerDown={(event) => {
          if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
          dragging.current = true;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          fromPointer(event);
        }}
        onPointerMove={(event) => dragging.current && fromPointer(event)}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onDoubleClick={(event) => {
          // Double-clicking a dot just selects it; double-clicking the pad resets.
          if (!(event.target as HTMLElement).closest("button")) onChange({ x: 0, y: 0 });
        }}
        className="relative m-0 aspect-square min-w-0 cursor-crosshair touch-none rounded-xl border-0 bg-raised p-0"
      >
        {STOPS.map((y) =>
          STOPS.map((x) => {
            const active = value.x === x && value.y === y;
            return (
              <button
                key={`${x},${y}`}
                type="button"
                aria-label={dotName(x, y)}
                aria-pressed={active}
                onClick={() => onChange({ x, y })}
                className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                style={{ left: `${(x + 1) * 40 + 10}%`, top: `${(y + 1) * 40 + 10}%` }}
              >
                <span
                  className={`size-1.5 rounded-full transition-colors ${active ? "bg-transparent" : "bg-subtle"}`}
                />
              </button>
            );
          }),
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg shadow ring-4 ring-fg/15"
          style={{ left: `${(value.x + 1) * 40 + 10}%`, top: `${(value.y + 1) * 40 + 10}%` }}
        />
      </fieldset>
    </div>
  );
}
