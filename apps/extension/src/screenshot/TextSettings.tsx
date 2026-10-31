import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight, RotateCcw } from "lucide-react";
import { Accordion } from "../components/Accordion";
import { Segmented } from "../components/Segmented";
import type { Corner, ShotText, TextFont, Watermark } from "../lib/screenshot-style";
import { ColorInput, Field, Slider } from "./controls";

const percent = (value: number) => `${Math.round(value * 100)}%`;
const TEXT_COLORS = ["#ffffff", "#17171c"];

/** Headline text and the corner watermark. */
export function TextSettings({
  text,
  watermark,
  onText,
  onWatermark,
}: {
  text: ShotText;
  watermark: Watermark;
  onText: (text: ShotText) => void;
  onWatermark: (watermark: Watermark) => void;
}) {
  const setText = (patch: Partial<ShotText>) => onText({ ...text, ...patch });
  const setWatermark = (patch: Partial<Watermark>) => onWatermark({ ...watermark, ...patch });
  const moved = text.offset.x !== 0 || text.offset.y !== 0;

  return (
    <>
      <Accordion title="Text" summary={text.value.trim() ? text.value.trim() : "Off"} defaultOpen>
        <label className="block">
          <span className="mb-1 block text-muted text-xs">Text</span>
          <textarea
            value={text.value}
            rows={2}
            onChange={(event) => setText({ value: event.target.value })}
            placeholder="Add a headline…"
            className="w-full resize-none rounded-lg bg-raised px-3 py-2 text-sm outline-none placeholder:text-subtle focus:ring-2 focus:ring-fg/15"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Placement">
            <Segmented
              label="Text placement"
              value={text.placement}
              onChange={(placement: "top" | "bottom") => setText({ placement })}
              options={[
                { value: "top", label: "Above" },
                { value: "bottom", label: "Below" },
              ]}
            />
          </Field>
          <Field label="Font">
            <Segmented
              label="Font"
              value={text.font}
              onChange={(font: TextFont) => setText({ font })}
              options={[
                { value: "sans", label: "Sans" },
                { value: "serif", label: "Serif" },
                { value: "mono", label: "Mono" },
              ]}
            />
          </Field>
        </div>
        <Slider
          label="Text size"
          value={text.size}
          min={20}
          max={120}
          step={1}
          format={(value) => `${value}`}
          onChange={(size) => setText({ size })}
        />
        <div className="flex items-center justify-between gap-3 text-muted text-xs">
          <span>Drag the text on the canvas to move it.</span>
          {moved && (
            <button
              type="button"
              onClick={() => setText({ offset: { x: 0, y: 0 } })}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 font-medium hover:bg-raised hover:text-fg"
            >
              <RotateCcw className="size-3" aria-hidden />
              Reset position
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {TEXT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color === "#ffffff" ? "White text" : "Black text"}
              aria-pressed={text.color === color}
              onClick={() => setText({ color })}
              className={`size-7 rounded-lg ring-offset-2 ring-offset-surface ${
                text.color === color ? "ring-2 ring-fg" : "ring-1 ring-line"
              }`}
              style={{ background: color }}
            />
          ))}
          <span className="mx-1 h-5 w-px bg-line" aria-hidden />
          <ColorInput
            label="Text color"
            value={text.color}
            onChange={(color) => setText({ color })}
          />
        </div>
      </Accordion>

      <Accordion
        title="Watermark"
        summary={watermark.value.trim() ? watermark.value.trim() : "Off"}
        defaultOpen
      >
        <label className="block">
          <span className="mb-1 block text-muted text-xs">Watermark</span>
          <input
            value={watermark.value}
            onChange={(event) => setWatermark({ value: event.target.value })}
            placeholder="yourcompany.com"
            className="w-full rounded-lg bg-raised px-3 py-2 text-sm outline-none placeholder:text-subtle focus:ring-2 focus:ring-fg/15"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Corner">
            <Segmented
              label="Watermark corner"
              value={watermark.corner}
              onChange={(corner: Corner) => setWatermark({ corner })}
              options={[
                {
                  value: "top-left",
                  label: "Top left",
                  icon: ArrowUpLeft,
                  iconOnly: true,
                },
                {
                  value: "top-right",
                  label: "Top right",
                  icon: ArrowUpRight,
                  iconOnly: true,
                },
                {
                  value: "bottom-left",
                  label: "Bottom left",
                  icon: ArrowDownLeft,
                  iconOnly: true,
                },
                {
                  value: "bottom-right",
                  label: "Bottom right",
                  icon: ArrowDownRight,
                  iconOnly: true,
                },
              ]}
            />
          </Field>
          <Field label="Color">
            <Segmented
              label="Watermark color"
              value={watermark.color}
              onChange={(color: "light" | "dark") => setWatermark({ color })}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </Field>
        </div>
        <Slider
          label="Opacity"
          value={watermark.opacity}
          min={0.1}
          max={1}
          step={0.05}
          format={percent}
          onChange={(opacity) => setWatermark({ opacity })}
        />
      </Accordion>
    </>
  );
}
