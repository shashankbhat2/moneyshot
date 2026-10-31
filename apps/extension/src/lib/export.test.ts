import { describe, expect, it } from "vitest";
import { exportDimensions, exportFileName, exportScale, svgWrapping } from "./export";

describe("export sizes", () => {
  it("doubles for 2x and fits the longer side to 3840 px for 4K", () => {
    expect(exportScale(1200, 800, "1x")).toBe(1);
    expect(exportDimensions(1200, 800, "2x")).toEqual({ width: 2400, height: 1600 });
    expect(exportDimensions(1200, 800, "4k")).toEqual({ width: 3840, height: 2560 });
    expect(exportDimensions(1080, 1920, "4k")).toEqual({ width: 2160, height: 3840 });
  });
});

describe("export files", () => {
  it("names files by format", () => {
    const date = new Date("2026-11-01T10:20:30Z");
    expect(exportFileName("jpeg", date)).toBe("moneyshot-2026-11-01-10-20-30.jpg");
    expect(exportFileName("webp", date)).toBe("moneyshot-2026-11-01-10-20-30.webp");
  });

  it("wraps the rendered image in an SVG of the same size", () => {
    const svg = svgWrapping("data:image/png;base64,AAA", 400, 300);
    expect(svg).toContain('viewBox="0 0 400 300"');
    expect(svg).toContain('<image href="data:image/png;base64,AAA" width="400" height="300"/>');
  });
});
