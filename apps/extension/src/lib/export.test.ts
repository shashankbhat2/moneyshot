import { describe, expect, it } from "vitest";
import { exportDimensions, exportFileName, exportScale, toExportOptions } from "./export";

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

  it("drops formats that are no longer offered from saved options", () => {
    expect(toExportOptions({ format: "svg", size: "4k" })).toEqual({ format: "png", size: "4k" });
    expect(toExportOptions({ format: "webp" })).toEqual({ format: "webp", size: "2x" });
    expect(toExportOptions(null)).toEqual({ format: "png", size: "2x" });
  });
});
