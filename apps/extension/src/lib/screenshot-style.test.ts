import { describe, expect, it } from "vitest";
import {
  DEFAULT_STYLE,
  layoutShot,
  normalizeStyle,
  placeCard,
  positionForCenter,
  shadowFor,
  textBox,
  tiltedPoint,
  wrapLines,
} from "./screenshot-style";

const image = { width: 1000, height: 600 };

describe("layoutShot", () => {
  it("pads around the screenshot and centers it", () => {
    const layout = layoutShot(image, {
      ...DEFAULT_STYLE,
      padding: 0.1,
      aspect: "auto",
      frame: "none",
    });

    expect(layout).toMatchObject({ width: 1120, height: 720 });
    expect(layout.image).toEqual({ x: 60, y: 60, width: 1000, height: 600 });
  });

  it("grows the container to the chosen aspect ratio", () => {
    const square = layoutShot(image, { ...DEFAULT_STYLE, padding: 0, aspect: "1:1" });
    expect(square.width).toBe(square.height);
    expect(square.image.y).toBe(200);

    const tall = layoutShot(image, { ...DEFAULT_STYLE, padding: 0, aspect: "9:16" });
    expect(tall.width / tall.height).toBeCloseTo(9 / 16, 2);
  });

  it("adds a title bar above the screenshot for window frames", () => {
    const layout = layoutShot(image, { ...DEFAULT_STYLE, padding: 0, frame: "macos-dark" });

    expect(layout.insets.top).toBe(36);
    expect(layout.card.height).toBe(636);
    expect(layout.image.y).toBe(36);
  });

  it("makes room for rulers, borders and stacked cards", () => {
    const ruler = layoutShot(image, { ...DEFAULT_STYLE, padding: 0, frame: "ruler" });
    expect(ruler.image).toMatchObject({ x: 22, y: 22 });
    expect(ruler.card).toMatchObject({ width: 1022, height: 622 });

    const arc = layoutShot(image, { ...DEFAULT_STYLE, padding: 0, frame: "arc" });
    expect(arc.card).toMatchObject({ width: 1020, height: 620 });

    const stack = layoutShot(image, { ...DEFAULT_STYLE, padding: 0, frame: "stack-light" });
    expect(stack.image.y).toBe(0);
    expect(stack.card.height).toBe(628);
  });

  it("puts text above the screenshot and keeps the screenshot centered below it", () => {
    const plain = layoutShot(image, { ...DEFAULT_STYLE, padding: 0.1 });
    const layout = layoutShot(image, {
      ...DEFAULT_STYLE,
      padding: 0.1,
      text: { ...DEFAULT_STYLE.text, value: "Ship faster", size: 50, placement: "top" },
    });

    expect(layout.text?.lines).toEqual(["Ship faster"]);
    expect(layout.height).toBeGreaterThan(plain.height);
    expect(layout.text?.y).toBe(60);
    expect(layout.image.y).toBeGreaterThan((layout.text?.y ?? 0) + (layout.text?.lineHeight ?? 0));
    expect(layout.height - (layout.image.y + layout.image.height)).toBe(60);
  });

  it("puts text below the screenshot", () => {
    const layout = layoutShot(image, {
      ...DEFAULT_STYLE,
      padding: 0.1,
      text: { ...DEFAULT_STYLE.text, value: "Caption", placement: "bottom" },
    });

    expect(layout.image.y).toBe(60);
    expect(layout.text?.y).toBeGreaterThan(layout.image.y + layout.image.height);
  });
});

describe("sizes", () => {
  it("exports social and store sizes at their exact pixels, in their proportions", () => {
    const layout = layoutShot(image, { ...DEFAULT_STYLE, aspect: "product-hunt" });

    expect(layout.output).toEqual({ width: 1270, height: 760 });
    expect(layout.width / layout.height).toBeCloseTo(1270 / 760, 2);
  });

  it("exports plain ratios at the layout's own size", () => {
    const layout = layoutShot(image, { ...DEFAULT_STYLE, aspect: "1:1" });
    expect(layout.output).toEqual({ width: layout.width, height: layout.height });
  });
});

describe("shadowFor", () => {
  it("grows with strength and is off at zero", () => {
    expect(shadowFor(0).alpha).toBe(0);
    expect(shadowFor(1).blur).toBeGreaterThan(shadowFor(0.3).blur);
  });
});

describe("dragging", () => {
  const layout = layoutShot(image, { ...DEFAULT_STYLE, padding: 0.1 });

  it("turns a dragged center back into a position", () => {
    const place = placeCard(layout, { zoom: 1, position: { x: 0.5, y: -0.25 } });
    const center = { x: place.x + place.width / 2, y: place.y + place.height / 2 };
    const position = positionForCenter(layout, { zoom: 1 }, center);

    expect(position.x).toBeCloseTo(0.5);
    expect(position.y).toBeCloseTo(-0.25);
    expect(positionForCenter(layout, { zoom: 1 }, { x: 99999, y: 0 }).x).toBe(1);
  });

  it("moves the text by its offset", () => {
    const text = { ...DEFAULT_STYLE.text, value: "Hello" };
    const home = textBox(layoutShot(image, { ...DEFAULT_STYLE, text }));
    const moved = textBox(
      layoutShot(image, { ...DEFAULT_STYLE, text: { ...text, offset: { x: 0.1, y: 0.05 } } }),
    );
    const layoutWithText = layoutShot(image, { ...DEFAULT_STYLE, text });

    expect((moved?.x ?? 0) - (home?.x ?? 0)).toBeCloseTo(0.1 * layoutWithText.width);
    expect((moved?.y ?? 0) - (home?.y ?? 0)).toBeCloseTo(0.05 * layoutWithText.height);
  });
});

describe("wrapLines", () => {
  const measure = (text: string) => text.length * 10;

  it("wraps words to the width and keeps explicit line breaks", () => {
    expect(wrapLines("one two three\nfour", "", 80, measure)).toEqual(["one two", "three", "four"]);
  });
});

describe("normalizeStyle", () => {
  it("upgrades styles saved by older versions", () => {
    const style = normalizeStyle({ background: "sea", frame: "window", shadow: "lg" });

    expect(style.background).toEqual({ kind: "gradient", stops: ["#22d3ee", "#6366f1"] });
    expect(style.frame).toBe("macos-light");
    expect(style.shadow).toBe(1);
    expect(style.text).toEqual(DEFAULT_STYLE.text);
    expect(style.rotation).toBe(0);
    expect(style.pattern.kind).toBe("none");
  });

  it("splits a pattern background into a solid background and a pattern", () => {
    const style = normalizeStyle({
      background: {
        kind: "pattern",
        pattern: "waves",
        background: "#eef2ff",
        color: "#a5b4fc",
        scale: 2,
      },
    });

    expect(style.background).toEqual({ kind: "solid", color: "#eef2ff" });
    expect(style.pattern).toEqual({ kind: "waves", color: "#a5b4fc", opacity: 1, scale: 2 });
  });
});

describe("placeCard", () => {
  const layout = layoutShot(image, { ...DEFAULT_STYLE, padding: 0.1 });

  it("centers the card at 100% zoom", () => {
    expect(placeCard(layout, { zoom: 1, position: { x: 0, y: 0 } })).toEqual(layout.card);
  });

  it("scales the card without changing the container", () => {
    const small = placeCard(layout, { zoom: 0.5, position: { x: 0, y: 0 } });
    expect(small).toEqual({ x: 310, y: 210, width: 500, height: 300 });
  });

  it("slides past the top and bottom edges so the screenshot goes behind the container", () => {
    const bottom = placeCard(layout, { zoom: 1, position: { x: 0, y: 1 } });
    expect(bottom.y + bottom.height).toBe(layout.height + 0.25 * 600);

    const top = placeCard(layout, { zoom: 1, position: { x: 0, y: -1 } });
    expect(top.y).toBe(-0.25 * 600);
  });

  it("pans across a zoomed-in card", () => {
    const left = placeCard(layout, { zoom: 1.5, position: { x: -1, y: 0 } });
    const right = placeCard(layout, { zoom: 1.5, position: { x: 1, y: 0 } });
    expect(left.x + left.width).toBeLessThan(layout.width);
    expect(right.x).toBeGreaterThan(0);
  });
});

describe("tiltedPoint", () => {
  const edgeHeight = (u: number, tilt: { x: number; y: number }) =>
    tiltedPoint(u, 1, 1000, 600, tilt).y - tiltedPoint(u, 0, 1000, 600, tilt).y;

  it("is a flat rectangle without tilt", () => {
    expect(tiltedPoint(0, 0, 1000, 600, { x: 0, y: 0 })).toEqual({ x: -500, y: -300 });
    expect(tiltedPoint(1, 1, 1000, 600, { x: 0, y: 0 })).toEqual({ x: 500, y: 300 });
  });

  it("brings the side of the handle toward the viewer", () => {
    expect(edgeHeight(1, { x: 1, y: 0 })).toBeGreaterThan(edgeHeight(0, { x: 1, y: 0 }));
    expect(edgeHeight(0, { x: -1, y: 0 })).toBeGreaterThan(edgeHeight(1, { x: -1, y: 0 }));
  });
});
