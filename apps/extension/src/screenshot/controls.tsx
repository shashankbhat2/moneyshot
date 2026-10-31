// Small form controls shared by the screenshot editor's settings.

/**
 * A pill track with a grip handle. The native range input sits on top, invisible, so keyboard,
 * pointer and screen readers work as usual.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const fraction = max === min ? 0 : (Math.min(max, Math.max(min, value)) - min) / (max - min);
  return (
    <label className="block">
      <span className="mb-1.5 flex justify-between text-muted text-xs">
        {label}
        <span className="tabular-nums">{format(value)}</span>
      </span>
      <span className="relative block h-7">
        <span className="absolute inset-x-0 top-1/2 h-5 -translate-y-1/2 rounded-full bg-surface shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)] ring-1 ring-line" />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="peer absolute inset-0 size-full cursor-grab opacity-0 active:cursor-grabbing"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 flex h-7 w-8 items-center justify-center gap-[3px] rounded-[9px] bg-fg shadow-md ring-fg/25 ring-offset-0 peer-focus-visible:ring-4"
          style={{ left: `calc(${fraction} * (100% - 2rem))` }}
        >
          <span className="h-2.5 w-[2px] rounded-full bg-surface/70" />
          <span className="h-2.5 w-[2px] rounded-full bg-surface/70" />
        </span>
      </span>
    </label>
  );
}

/** A color well with its hex value next to it. */
export function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-muted text-xs">
      <span className="relative size-7 shrink-0 overflow-hidden rounded-lg ring-1 ring-line">
        <span className="absolute inset-0" style={{ background: value }} />
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </span>
      <span>
        {label}
        <span className="ml-1.5 font-mono text-subtle uppercase">{value}</span>
      </span>
    </label>
  );
}

/** A labelled row of controls inside an accordion. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted text-xs">{label}</p>
      {children}
    </div>
  );
}
