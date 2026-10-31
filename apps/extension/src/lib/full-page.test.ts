import { describe, expect, it } from "vitest";
import { scrollPositions } from "./full-page";

describe("scrollPositions", () => {
  it("takes one shot when the page fits", () => {
    expect(scrollPositions(700, 800)).toEqual([0]);
  });

  it("steps by a viewport and ends flush with the bottom", () => {
    expect(scrollPositions(2500, 1000)).toEqual([0, 1000, 1500]);
    expect(scrollPositions(3000, 1000)).toEqual([0, 1000, 2000]);
  });
});
