import { afterEach, describe, expect, it, vi } from "vitest";
import { selectArea, showScreenshotPicker } from "./screenshot-overlay";

const shadow = (tag: string) => document.querySelector(tag)?.shadowRoot;

afterEach(() => {
  for (const tag of ["moneyshot-picker", "moneyshot-selection"]) {
    document.querySelector(tag)?.remove();
  }
});

describe("showScreenshotPicker", () => {
  it("offers visible area, full page and selection on the blurred overlay", () => {
    const onPick = vi.fn();
    showScreenshotPicker({ theme: "dark", onPick, onCancel: vi.fn() });

    const dialog = shadow("moneyshot-picker")?.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.dataset.theme).toBe("dark");
    expect([...dialog.querySelectorAll(".option span")].map((span) => span.textContent)).toEqual([
      "Visible area",
      "Full page",
      "Selection",
    ]);

    dialog.querySelector<HTMLButtonElement>('[data-kind="full"]')?.click();
    expect(onPick).toHaveBeenCalledWith("full");
    expect(document.querySelector("moneyshot-picker")).toBeNull();
  });

  it("supports number keys and Escape", () => {
    const onPick = vi.fn();
    const onCancel = vi.fn();
    showScreenshotPicker({ theme: "system", onPick, onCancel });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "3" }));
    expect(onPick).toHaveBeenCalledWith("selection");

    showScreenshotPicker({ theme: "system", onPick, onCancel });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

describe("selectArea", () => {
  const drag = (type: string, x: number, y: number) =>
    shadow("moneyshot-selection")
      ?.querySelector(".layer")
      ?.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, bubbles: true }));

  it("resolves with the dragged rectangle, in any drag direction", async () => {
    const selection = selectArea();
    drag("pointerdown", 300, 400);
    drag("pointermove", 100, 150);
    drag("pointerup", 100, 150);

    await expect(selection).resolves.toEqual({ x: 100, y: 150, width: 200, height: 250 });
    expect(document.querySelector("moneyshot-selection")).toBeNull();
  });

  it("ignores clicks without a drag and resolves null on Escape", async () => {
    const selection = selectArea();
    drag("pointerdown", 10, 10);
    drag("pointerup", 10, 10);
    expect(document.querySelector("moneyshot-selection")).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await expect(selection).resolves.toBeNull();
  });
});
