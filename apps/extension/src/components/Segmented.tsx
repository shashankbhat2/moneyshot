import type { LucideIcon } from "lucide-react";
import { useId } from "react";

/** Pill-style single choice, built on native radio inputs. */
type Option<T> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  /** Show only the icon; the label becomes the accessible name. */
  iconOnly?: boolean;
};

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-xl bg-raised p-1">
      {options.map((option) => {
        const selected = option.value === value;
        const Icon = option.icon;
        return (
          <label
            key={option.value}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-xs transition-colors has-focus-visible:ring-2 has-focus-visible:ring-fg/20 ${
              selected ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={selected}
              onChange={() => onChange(option.value)}
              aria-label={option.iconOnly ? option.label : undefined}
              className="sr-only"
            />
            {Icon && <Icon className="size-3.5" aria-hidden />}
            {!option.iconOnly && option.label}
          </label>
        );
      })}
    </div>
  );
}
