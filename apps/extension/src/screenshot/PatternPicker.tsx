import { Ban } from "lucide-react";
import { useId } from "react";
import { type Fill, PATTERN_KINDS, patternSwatch, type ShotPattern } from "../lib/shot-fills";
import { ColorInput, Slider } from "./controls";

/** Pattern drawn over the background: its kind, color, opacity and size. */
export function PatternPicker({
  value,
  background,
  onChange,
}: {
  value: ShotPattern;
  background: Fill;
  onChange: (pattern: ShotPattern) => void;
}) {
  const name = useId();
  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Pattern" className="grid grid-cols-4 gap-2">
        {PATTERN_KINDS.map(({ kind, label }) => {
          const selected = value.kind === kind;
          const image = kind === "none" ? null : patternSwatch({ ...value, kind }, background);
          return (
            <label
              key={kind}
              title={label}
              className={`relative grid aspect-[4/3] cursor-pointer place-items-center rounded-xl bg-raised bg-center bg-cover text-muted ring-offset-2 ring-offset-surface transition-shadow has-focus-visible:ring-2 has-focus-visible:ring-fg/40 ${
                selected ? "ring-2 ring-fg" : "ring-1 ring-line hover:ring-subtle"
              }`}
              style={image ? { backgroundImage: `url("${image}")` } : undefined}
            >
              {kind === "none" && <Ban className="size-5" aria-hidden />}
              <input
                type="radio"
                name={name}
                aria-label={label}
                checked={selected}
                onChange={() => onChange({ ...value, kind })}
                className="sr-only"
              />
            </label>
          );
        })}
      </div>

      {value.kind !== "none" && (
        <>
          <ColorInput
            label="Pattern color"
            value={value.color}
            onChange={(color) => onChange({ ...value, color })}
          />
          <Slider
            label="Opacity"
            value={value.opacity}
            min={0.05}
            max={1}
            step={0.05}
            format={(opacity) => `${Math.round(opacity * 100)}%`}
            onChange={(opacity) => onChange({ ...value, opacity })}
          />
          <Slider
            label="Pattern size"
            value={value.scale}
            min={0.5}
            max={3}
            step={0.1}
            format={(scale) => `${Math.round(scale * 100)}%`}
            onChange={(scale) => onChange({ ...value, scale })}
          />
        </>
      )}
    </div>
  );
}
