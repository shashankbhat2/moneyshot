import { useId, useState } from "react";
import { Segmented } from "../components/Segmented";
import { SIZE_GROUPS, SIZES, type SizeGroup, sizeFor } from "../lib/shot-sizes";

/** A small outline in the size's proportions. */
function Shape({ ratio }: { ratio: number | null }) {
  const box = 22;
  const width = ratio ? (ratio >= 1 ? box : Math.max(8, box * ratio)) : box;
  const height = ratio ? (ratio >= 1 ? Math.max(8, box / ratio) : box) : box * 0.7;
  return (
    <span className="grid size-6 shrink-0 place-items-center" aria-hidden>
      <span
        className={`rounded-[3px] border-[1.5px] ${ratio ? "border-current" : "border-current border-dashed"}`}
        style={{ width, height }}
      />
    </span>
  );
}

export function SizePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [group, setGroup] = useState<SizeGroup>(() => sizeFor(value).group);
  const name = useId();
  return (
    <div className="space-y-3">
      <Segmented
        label="Size type"
        value={group}
        onChange={setGroup}
        options={SIZE_GROUPS.map((candidate) => ({ value: candidate.id, label: candidate.label }))}
      />
      <div role="radiogroup" aria-label="Size" className="grid grid-cols-2 gap-1.5">
        {SIZES.filter((size) => size.group === group).map((size) => {
          const selected = size.id === value;
          return (
            <label
              key={size.id}
              className={`relative flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-fg/30 ${
                selected
                  ? "bg-raised text-fg ring-1 ring-fg"
                  : "text-muted hover:bg-raised/60 hover:text-fg"
              }`}
            >
              <Shape ratio={size.ratio} />
              <span className="min-w-0">
                <span className="block truncate font-medium text-xs">{size.label}</span>
                {size.pixels && (
                  <span className="block text-[11px] text-subtle tabular-nums">
                    {size.pixels.width} × {size.pixels.height}
                  </span>
                )}
              </span>
              <input
                type="radio"
                name={name}
                aria-label={size.label}
                checked={selected}
                onChange={() => onChange(size.id)}
                className="sr-only"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
