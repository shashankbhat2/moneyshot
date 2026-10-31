import { describe, expect, it } from "vitest";
import { CATEGORIES, categoryOf, fillLabel, randomMesh, sameFill, toFill } from "./shot-fills";

describe("fills", () => {
  it("has images, mesh, solid and gradient presets", () => {
    expect(CATEGORIES.map((category) => category.label)).toEqual([
      "Images",
      "Mesh",
      "Solid",
      "Gradient",
    ]);
    for (const category of CATEGORIES) expect(category.presets.length).toBeGreaterThan(3);
  });

  it("names presets and falls back for custom fills", () => {
    expect(fillLabel({ kind: "gradient", stops: ["#22d3ee", "#6366f1"] })).toBe("Sea");
    expect(fillLabel({ kind: "solid", color: "#123456" })).toBe("#123456");
    expect(fillLabel({ kind: "image", id: "a" })).toBe("Image");
  });

  it("opens the picker on the fill's category", () => {
    expect(categoryOf({ kind: "image", id: "a" })).toBe("images");
    expect(categoryOf({ kind: "none" })).toBe("solid");
    expect(categoryOf(randomMesh())).toBe("mesh");
  });

  it("reads saved fills and legacy preset ids", () => {
    expect(toFill("ink")).toEqual({ kind: "solid", color: "#17171c" });
    const mesh = randomMesh(() => 0.5);
    expect(sameFill(toFill(mesh), mesh)).toBe(true);
    // Patterns used to be backgrounds; their background color stays as the fill.
    expect(
      toFill({ kind: "pattern", pattern: "dots", background: "#17171c", color: "#3f3f46" }),
    ).toEqual({ kind: "solid", color: "#17171c" });
  });
});
