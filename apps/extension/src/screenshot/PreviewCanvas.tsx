import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  drawShot,
  type Point,
  placeCard,
  positionForCenter,
  type Rect,
  type ShotLayout,
  type ShotStyle,
  textBox,
} from "../lib/screenshot-style";
import { CHECKERBOARD } from "../lib/shot-fills";

type Drawable = CanvasImageSource & { width: number; height: number };
type Target = "card" | "text";

/** Screen px within which a dragged item snaps to the canvas center. */
const SNAP = 6;

const inside = (rect: Rect, x: number, y: number, margin = 0) =>
  x >= rect.x - margin &&
  x <= rect.x + rect.width + margin &&
  y >= rect.y - margin &&
  y <= rect.y + rect.height + margin;

const center = (rect: Rect) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

/**
 * The styled screenshot. Drag the screenshot or the text to move them; they snap to the
 * canvas center, with guides showing while they're centered.
 */
export const PreviewCanvas = forwardRef<
  HTMLCanvasElement | null,
  {
    image: Drawable | null;
    background: Drawable | null;
    style: ShotStyle;
    onMoveCard: (position: Point) => void;
    onMoveText: (offset: Point) => void;
  }
>(function PreviewCanvas({ image, background, style, onMoveCard, onMoveText }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const layout = useRef<ShotLayout | null>(null);
  const drag = useRef<{ target: Target; start: Point; origin: Point } | null>(null);
  const [guides, setGuides] = useState({ x: false, y: false });
  const [hover, setHover] = useState<Target | null>(null);
  useImperativeHandle(ref, () => canvas.current as HTMLCanvasElement);

  useEffect(() => {
    if (canvas.current && image) {
      layout.current = drawShot(canvas.current, image, style, background);
    }
  }, [image, style, background]);

  /** Pointer position in layout units, and layout units per screen px. */
  function locate(event: React.PointerEvent) {
    const bounds = canvas.current?.getBoundingClientRect();
    const current = layout.current;
    if (!bounds || !current || bounds.width === 0) return null;
    const scale = current.width / bounds.width;
    return {
      x: (event.clientX - bounds.left) * scale,
      y: (event.clientY - bounds.top) * (current.height / bounds.height),
      scale,
      layout: current,
    };
  }

  function targetAt(event: React.PointerEvent): { target: Target; origin: Point } | null {
    const point = locate(event);
    if (!point) return null;
    const text = textBox(point.layout);
    if (text && inside(text, point.x, point.y, 8 * point.scale)) {
      return { target: "text", origin: center(text) };
    }
    const card = placeCard(point.layout, style);
    if (inside(card, point.x, point.y)) return { target: "card", origin: center(card) };
    return null;
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) return;
    const hit = targetAt(event);
    if (!hit) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { ...hit, start: { x: event.clientX, y: event.clientY } };
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const current = drag.current;
    if (!current) {
      setHover(targetAt(event)?.target ?? null);
      return;
    }
    const point = locate(event);
    if (!point) return;
    const { layout: shot, scale } = point;
    let x = current.origin.x + (event.clientX - current.start.x) * scale;
    // The canvas keeps its aspect ratio, so one scale works for both axes.
    let y = current.origin.y + (event.clientY - current.start.y) * scale;
    const snapX = Math.abs(x - shot.width / 2) < SNAP * scale;
    const snapY = Math.abs(y - shot.height / 2) < SNAP * scale;
    if (snapX) x = shot.width / 2;
    if (snapY) y = shot.height / 2;
    setGuides({ x: snapX, y: snapY });

    if (current.target === "card") {
      onMoveCard(positionForCenter(shot, style, { x, y }));
    } else {
      // The offset is relative to where the text sits without one.
      const box = textBox(shot);
      if (!box) return;
      const home = {
        x: center(box).x - style.text.offset.x * shot.width,
        y: center(box).y - style.text.offset.y * shot.height,
      };
      onMoveText({ x: (x - home.x) / shot.width + 0, y: (y - home.y) / shot.height + 0 });
    }
  }

  function endDrag() {
    drag.current = null;
    setGuides({ x: false, y: false });
  }

  return (
    <div className="relative max-h-full max-w-full">
      <canvas
        ref={canvas}
        role="img"
        aria-label="Styled screenshot"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => !drag.current && setHover(null)}
        className={`block h-auto max-h-[50vh] w-auto max-w-full touch-none rounded-md lg:max-h-[calc(100vh-11.5rem)] ${
          hover ? "cursor-move" : ""
        }`}
        style={{ background: CHECKERBOARD }}
      />
      {guides.x && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-fuchsia-500"
        />
      )}
      {guides.y && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-fuchsia-500"
        />
      )}
    </div>
  );
});
