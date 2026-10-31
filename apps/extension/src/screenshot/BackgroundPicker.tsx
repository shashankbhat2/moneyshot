import { BookmarkPlus, ImageUp, Shuffle, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Segmented } from "../components/Segmented";
import {
  CATEGORIES,
  CHECKERBOARD,
  categoryOf,
  type Fill,
  type FillCategory,
  type FillPreset,
  fillLabel,
  fillSwatch,
  randomMesh,
  sameFill,
  toFill,
} from "../lib/shot-fills";
import { deleteAsset, getAsset, putAsset } from "../lib/shots";
import { ColorInput } from "./controls";

const SAVED_KEY = "shotBackgrounds";
const MAX_SAVED = 24;

/** Backgrounds the user saved or uploaded, newest first. */
function useSavedBackgrounds() {
  const [saved, setSaved] = useState<Fill[]>([]);
  useEffect(() => {
    chrome.storage.local.get(SAVED_KEY).then(({ [SAVED_KEY]: value }) => {
      if (Array.isArray(value)) setSaved(value.map(toFill));
    });
  }, []);
  const change = (next: Fill[]) => {
    setSaved(next);
    chrome.storage.local.set({ [SAVED_KEY]: next }).catch(() => {});
  };
  const add = (fill: Fill) =>
    change([fill, ...saved.filter((item) => !sameFill(item, fill))].slice(0, MAX_SAVED));
  const remove = (fill: Fill) => change(saved.filter((item) => !sameFill(item, fill)));
  return { saved, add, remove };
}

/** Object URL for an uploaded image, while mounted. */
export function useAssetUrl(id: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return setUrl(null);
    let objectUrl: string | null = null;
    let active = true;
    getAsset(id).then((blob) => {
      if (!blob || !active) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  return url;
}

function Swatch({
  fill,
  label,
  name,
  selected,
  onSelect,
}: {
  fill: Fill;
  label: string;
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const assetUrl = useAssetUrl(fill.kind === "image" ? fill.id : null);
  const image = fill.kind === "image" ? assetUrl : fillSwatch(fill);
  const fallback = fill.kind === "solid" ? fill.color : "var(--color-raised)";
  return (
    <label
      title={label}
      className={`relative block aspect-[4/3] cursor-pointer rounded-xl bg-center bg-cover ring-offset-2 ring-offset-surface transition-shadow has-focus-visible:ring-2 has-focus-visible:ring-fg/40 ${
        selected ? "ring-2 ring-fg" : "ring-1 ring-line hover:ring-subtle"
      }`}
      style={{
        background: fill.kind === "none" ? CHECKERBOARD : undefined,
        backgroundColor: fill.kind === "none" ? undefined : fallback,
        backgroundImage: image ? `url("${image}")` : undefined,
      }}
    >
      <input
        type="radio"
        name={name}
        aria-label={label}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
    </label>
  );
}

const tileButton =
  "grid aspect-[4/3] place-items-center rounded-xl text-muted ring-1 ring-line transition-colors hover:bg-raised hover:text-fg disabled:pointer-events-none disabled:opacity-40";

export function BackgroundPicker({
  value,
  onChange,
}: {
  value: Fill;
  onChange: (fill: Fill) => void;
}) {
  const [category, setCategory] = useState<FillCategory>(() => categoryOf(value));
  const { saved, add, remove } = useSavedBackgrounds();
  const upload = useRef<HTMLInputElement>(null);
  const name = useId();
  const presets = CATEGORIES.find((candidate) => candidate.id === category)?.presets ?? [];
  const images = category === "images";

  async function onUpload(file: File | undefined) {
    if (!file) return;
    const fill: Fill = { kind: "image", id: crypto.randomUUID() };
    await putAsset(fill.id, file);
    add(fill);
    onChange(fill);
  }

  function onRemove(fill: Fill) {
    remove(fill);
    // Keep the image if it's still the current background.
    if (fill.kind === "image" && !sameFill(fill, value)) deleteAsset(fill.id).catch(() => {});
  }

  const swatch = (preset: FillPreset, removable: boolean) => (
    <div key={JSON.stringify(preset.fill)} className="group relative">
      <Swatch
        fill={preset.fill}
        label={preset.label}
        name={name}
        selected={sameFill(preset.fill, value)}
        onSelect={() => onChange(preset.fill)}
      />
      {removable && (
        <button
          type="button"
          onClick={() => onRemove(preset.fill)}
          aria-label={`Remove ${preset.label}`}
          className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-fg text-surface opacity-0 shadow transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
        >
          <X className="size-3" aria-hidden />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <Segmented
        label="Background type"
        value={category}
        onChange={setCategory}
        options={CATEGORIES.map((candidate) => ({ value: candidate.id, label: candidate.label }))}
      />

      <div role="radiogroup" aria-label="Background" className="grid grid-cols-4 gap-2">
        {images && (
          <>
            <button
              type="button"
              onClick={() => upload.current?.click()}
              title="Upload image"
              aria-label="Upload image"
              className={tileButton}
            >
              <ImageUp className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => add(value)}
              disabled={value.kind === "none" || saved.some((fill) => sameFill(fill, value))}
              title="Save current background"
              aria-label="Save current background"
              className={tileButton}
            >
              <BookmarkPlus className="size-5" aria-hidden />
            </button>
            {saved.map((fill) => swatch({ fill, label: fillLabel(fill) }, true))}
          </>
        )}
        {presets.map((preset) => swatch(preset, false))}
      </div>
      <input
        ref={upload}
        type="file"
        accept="image/*"
        aria-label="Background image file"
        className="hidden"
        onChange={(event) => {
          onUpload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {images && saved.length === 0 && (
        <p className="text-muted text-xs">
          Upload your own image, or save the current background to reuse it.
        </p>
      )}

      {category === "solid" && (
        <ColorInput
          label="Custom color"
          value={value.kind === "solid" ? value.color : "#ffffff"}
          onChange={(color) => onChange({ kind: "solid", color })}
        />
      )}

      {category === "mesh" && (
        <button
          type="button"
          onClick={() => onChange(randomMesh())}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-muted text-xs hover:bg-raised hover:text-fg"
        >
          <Shuffle className="size-3.5" aria-hidden />
          Shuffle mesh
        </button>
      )}
    </div>
  );
}
