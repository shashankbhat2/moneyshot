import { Check, Copy, Download, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Accordion } from "../components/Accordion";
import { DotPad } from "../components/DotPad";
import { Logo } from "../components/Logo";
import { DEFAULT_STYLE, normalizeStyle, type ShotStyle } from "../lib/screenshot-style";
import { type Fill, fillLabel, PATTERN_KINDS } from "../lib/shot-fills";
import { FRAMES } from "../lib/shot-frames";
import { sizeFor } from "../lib/shot-sizes";
import { getShot } from "../lib/shots";
import { BackgroundPicker, useAssetUrl } from "./BackgroundPicker";
import { Slider } from "./controls";
import { FramePicker } from "./FramePicker";
import { PatternPicker } from "./PatternPicker";
import { PreviewCanvas } from "./PreviewCanvas";
import { SizePicker } from "./SizePicker";
import { TextSettings } from "./TextSettings";

const STYLE_KEY = "shotStyle";

/** Load an image from a URL; null until it's ready. */
function useImage(url: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    setImage(null);
    if (!url) return;
    const element = new Image();
    element.onload = () => setImage(element);
    element.src = url;
  }, [url]);
  return image;
}

/** Load the latest screenshot as an image element; null while loading, false if none. */
function useLatestShot() {
  const [url, setUrl] = useState<string | null | false>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    getShot().then((blob) => {
      if (!blob) return setUrl(false);
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);
  const image = useImage(url || null);
  return url === false ? false : image;
}

/** The style is remembered between screenshots (saved shortly after changes stop, e.g. drags). */
function useShotStyle() {
  const [style, setStyle] = useState<ShotStyle>(DEFAULT_STYLE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(STYLE_KEY).then(({ [STYLE_KEY]: saved }) => {
      if (saved) setStyle(normalizeStyle(saved));
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      chrome.storage.local.set({ [STYLE_KEY]: style }).catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [style, loaded]);

  const update = (patch: Partial<ShotStyle>) => setStyle((current) => ({ ...current, ...patch }));
  return [style, update, loaded] as const;
}

const fileName = () =>
  `moneyshot-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-")}.png`;

const percent = (value: number) => `${Math.round(value * 100)}%`;
const degrees = (value: number) => `${value}°`;

type Tab = "layout" | "style" | "text" | "annotate";
const TABS: { id: Tab; label: string; soon?: boolean }[] = [
  { id: "layout", label: "Layout" },
  { id: "style", label: "Style" },
  { id: "text", label: "Text" },
  { id: "annotate", label: "Annotate", soon: true },
];

const tiltLabel = ({ x, y }: { x: number; y: number }) =>
  x === 0 && y === 0 ? "Flat" : `${Math.round(Math.hypot(x, y) * 100)}%`;

export function ScreenshotEditor() {
  const image = useLatestShot();
  const [style, update, loaded] = useShotStyle();
  const backgroundUrl = useAssetUrl(style.background.kind === "image" ? style.background.id : null);
  const backgroundImage = useImage(backgroundUrl);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<Tab>("layout");
  const size = sizeFor(style.aspect);

  const toBlob = () =>
    new Promise<Blob>((resolve, reject) =>
      canvasRef.current?.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
        "image/png",
      ),
    );

  async function download() {
    const url = URL.createObjectURL(await toBlob());
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName();
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copy() {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": toBlob() })]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (image === false) {
    return (
      <div className="grid h-screen place-items-center bg-canvas p-6 text-center text-fg">
        <div className="space-y-3">
          <Logo className="mx-auto h-8 w-auto" />
          <p className="text-muted">There's no screenshot yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-fg">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-3">
          <Logo className="h-7 w-auto" />
          <span className="h-5 w-px bg-line" aria-hidden />
          <h1 className="font-medium text-muted">Screenshot</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copy}
            disabled={!image}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 font-medium text-sm hover:bg-raised disabled:opacity-50"
          >
            {copied ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={download}
            disabled={!image}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 font-semibold text-sm text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            <Download className="size-4" aria-hidden />
            Download PNG
          </button>
        </div>
      </header>

      {/* Preview (2/3) and settings (1/3) share one container, split by a line. */}
      <main className="mx-auto max-w-5xl px-6 pb-8">
        <div className="grid overflow-hidden rounded-2xl border border-line bg-surface lg:h-[calc(100vh-7.5rem)] lg:grid-cols-[2fr_1fr]">
          <section
            aria-label="Preview"
            className="grid min-h-0 place-items-center bg-raised/40 p-6 lg:p-8"
          >
            <PreviewCanvas
              ref={canvasRef}
              image={image}
              background={backgroundImage}
              style={style}
              onMoveCard={(position) => update({ position })}
              onMoveText={(offset) => update({ text: { ...style.text, offset } })}
            />
          </section>

          <aside
            aria-label="Style"
            className="flex min-h-0 flex-col border-line border-t lg:border-t-0 lg:border-l"
          >
            <div
              role="tablist"
              aria-label="Settings"
              className="flex gap-1 border-line border-b p-2"
            >
              {TABS.map(({ id, label, soon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  aria-label={soon ? `${label} (coming soon)` : undefined}
                  onClick={() => setTab(id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-sm transition-colors ${
                    tab === id ? "bg-raised text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {label}
                  {soon && (
                    <span className="rounded-full bg-raised px-1.5 py-px font-medium text-[10px] text-subtle">
                      Soon
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              aria-label={TABS.find((candidate) => candidate.id === tab)?.label}
              className="relative min-h-0 flex-1 overflow-y-auto"
            >
              {tab === "layout" && (
                <>
                  <Accordion
                    title="Size"
                    summary={
                      size.pixels ? `${size.pixels.width} × ${size.pixels.height}` : size.label
                    }
                    defaultOpen
                  >
                    {/* Remount once the saved style is in, so it opens on that size's group. */}
                    <SizePicker
                      key={loaded ? "saved" : "default"}
                      value={style.aspect}
                      onChange={(aspect) => update({ aspect })}
                    />
                  </Accordion>
                  <Accordion title="Padding" summary={percent(style.padding)} defaultOpen>
                    <Slider
                      label="Padding"
                      value={style.padding}
                      min={0}
                      max={0.25}
                      step={0.01}
                      format={percent}
                      onChange={(padding) => update({ padding })}
                    />
                  </Accordion>
                  <Accordion title="Zoom" summary={percent(style.zoom)} defaultOpen>
                    <Slider
                      label="Zoom"
                      value={style.zoom}
                      min={0.5}
                      max={1.5}
                      step={0.01}
                      format={percent}
                      onChange={(zoom) => update({ zoom })}
                    />
                  </Accordion>
                  <Accordion
                    title="Position"
                    summary={
                      style.position.x === 0 && style.position.y === 0 ? "Centered" : "Moved"
                    }
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-32 shrink-0">
                        <DotPad
                          label="Position"
                          value={style.position}
                          onChange={(position) => update({ position })}
                        />
                      </div>
                      <p className="pt-6 text-muted text-xs leading-relaxed">
                        Or drag the screenshot on the canvas. It snaps to the center.
                      </p>
                    </div>
                  </Accordion>
                  <Accordion title="Rotation" summary={degrees(style.rotation)}>
                    <Slider
                      label="Rotation"
                      value={style.rotation}
                      min={-180}
                      max={180}
                      step={1}
                      format={degrees}
                      onChange={(rotation) => update({ rotation })}
                    />
                    <div className="flex flex-wrap gap-1">
                      {[-90, -15, 0, 15, 90].map((angle) => (
                        <button
                          key={angle}
                          type="button"
                          onClick={() => update({ rotation: angle })}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-xs tabular-nums transition-colors ${
                            style.rotation === angle
                              ? "bg-raised text-fg"
                              : "text-muted hover:bg-raised hover:text-fg"
                          }`}
                        >
                          {angle === 0 && <RotateCcw className="size-3" aria-hidden />}
                          {angle === 0 ? "Reset" : `${angle > 0 ? "+" : ""}${angle}°`}
                        </button>
                      ))}
                    </div>
                  </Accordion>
                  <Accordion title="Tilt" summary={tiltLabel(style.tilt)}>
                    <div className="w-32">
                      <DotPad
                        label="Tilt"
                        value={style.tilt}
                        onChange={(tilt) => update({ tilt })}
                      />
                    </div>
                  </Accordion>
                </>
              )}

              {tab === "style" && (
                <>
                  <Accordion title="Background" summary={fillLabel(style.background)} defaultOpen>
                    {/* Remount once the saved style is in, so it opens on that background's tab. */}
                    <BackgroundPicker
                      key={loaded ? "saved" : "default"}
                      value={style.background}
                      onChange={(background: Fill) => update({ background })}
                    />
                  </Accordion>
                  <Accordion
                    title="Pattern"
                    summary={
                      PATTERN_KINDS.find((pattern) => pattern.kind === style.pattern.kind)?.label
                    }
                  >
                    <PatternPicker
                      value={style.pattern}
                      background={style.background}
                      onChange={(pattern) => update({ pattern })}
                    />
                  </Accordion>
                  <Accordion
                    title="Frame"
                    summary={FRAMES.find((frame) => frame.id === style.frame)?.label}
                    defaultOpen
                  >
                    <FramePicker value={style.frame} onChange={(frame) => update({ frame })} />
                    <Slider
                      label="Corner radius"
                      value={style.radius}
                      min={0}
                      max={40}
                      step={1}
                      format={(value) => `${value}`}
                      onChange={(radius) => update({ radius })}
                    />
                  </Accordion>
                  <Accordion
                    title="Shadow"
                    summary={style.shadow === 0 ? "None" : percent(style.shadow)}
                    defaultOpen
                  >
                    <Slider
                      label="Shadow"
                      value={style.shadow}
                      min={0}
                      max={1}
                      step={0.01}
                      format={(value) => (value === 0 ? "None" : percent(value))}
                      onChange={(shadow) => update({ shadow })}
                    />
                  </Accordion>
                </>
              )}

              {tab === "text" && (
                <TextSettings
                  text={style.text}
                  watermark={style.watermark}
                  onText={(text) => update({ text })}
                  onWatermark={(watermark) => update({ watermark })}
                />
              )}

              {tab === "annotate" && (
                <div className="space-y-2 px-5 py-10 text-center">
                  <p className="font-medium">Annotations are coming soon</p>
                  <p className="text-muted text-sm">
                    Arrows, underlines, highlights and callouts, drawn right on the canvas.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
