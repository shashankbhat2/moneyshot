import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ShotOverlay } from "../lib/screenshot-style";
import { deleteAsset, getAsset, putAsset } from "../lib/shots";
import { Slider } from "./controls";

/** Load the overlay images by id; images still loading are missing from the map. */
export function useOverlayImages(overlays: ShotOverlay[]) {
  const [images, setImages] = useState<ReadonlyMap<string, HTMLImageElement>>(new Map());
  const urls = useRef(new Map<string, string>());
  const ids = overlays.map((overlay) => overlay.id).join(",");

  useEffect(() => {
    const wanted = new Set(ids ? ids.split(",") : []);
    let active = true;
    // Drop images that were removed.
    for (const [id, url] of urls.current) {
      if (wanted.has(id)) continue;
      URL.revokeObjectURL(url);
      urls.current.delete(id);
      setImages((current) => {
        const next = new Map(current);
        next.delete(id);
        return next;
      });
    }
    // Load new ones.
    for (const id of wanted) {
      if (urls.current.has(id)) continue;
      urls.current.set(id, "");
      getAsset(id).then((blob) => {
        if (!blob || !active) return urls.current.delete(id);
        const url = URL.createObjectURL(blob);
        urls.current.set(id, url);
        const image = new Image();
        image.onload = () => setImages((current) => new Map(current).set(id, image));
        image.src = url;
      });
    }
    return () => {
      active = false;
    };
  }, [ids]);

  useEffect(
    () => () => {
      for (const url of urls.current.values()) if (url) URL.revokeObjectURL(url);
    },
    [],
  );

  return images;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

/** Images placed on the canvas, like logos or other screenshots: add, resize and remove. */
export function ImageLayers({
  overlays,
  images,
  onChange,
}: {
  overlays: ShotOverlay[];
  images: ReadonlyMap<string, HTMLImageElement>;
  onChange: (overlays: ShotOverlay[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  async function add(files: FileList | null) {
    const added: ShotOverlay[] = [];
    for (const file of files ?? []) {
      if (!file.type.startsWith("image/")) continue;
      const id = crypto.randomUUID();
      await putAsset(id, file);
      // Stagger several uploads so they don't land exactly on top of each other.
      const offset = (overlays.length + added.length) * 0.04;
      added.push({ id, x: 0.5 + offset, y: 0.5 + offset, width: 0.25 });
    }
    if (added.length) onChange([...overlays, ...added]);
  }

  function update(id: string, patch: Partial<ShotOverlay>) {
    onChange(overlays.map((overlay) => (overlay.id === id ? { ...overlay, ...patch } : overlay)));
  }

  function remove(id: string) {
    onChange(overlays.filter((overlay) => overlay.id !== id));
    deleteAsset(id).catch(() => {});
  }

  return (
    <div className="space-y-4">
      {overlays.length > 0 && (
        <ul aria-label="Images on the canvas" className="space-y-4">
          {overlays.map((overlay, index) => {
            const image = images.get(overlay.id);
            return (
              <li key={overlay.id} className="flex items-end gap-3">
                <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-raised">
                  {image && <img src={image.src} alt="" className="max-h-full max-w-full" />}
                </span>
                <div className="min-w-0 flex-1">
                  <Slider
                    label={`Image ${index + 1} size`}
                    value={overlay.width}
                    min={0.05}
                    max={1}
                    step={0.01}
                    format={percent}
                    onChange={(width) => update(overlay.id, { width })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(overlay.id)}
                  aria-label={`Remove image ${index + 1}`}
                  className="mb-0.5 shrink-0 rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 font-medium text-sm hover:bg-raised"
      >
        <ImagePlus className="size-4" aria-hidden />
        Add image
      </button>
      <p className="text-muted text-xs">
        Logos, stickers or other screenshots. Drag them on the canvas to place them.
      </p>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        aria-label="Add image file"
        className="hidden"
        onChange={(event) => {
          add(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
