import { beforeEach, describe, expect, it, vi } from "vitest";
import { type ChromeStub, createChromeStub } from "../test/chrome";
import { initTheme, resolveTheme, setTheme } from "./theme";

let chromeStub: ChromeStub;

beforeEach(() => {
  chromeStub = createChromeStub();
  vi.stubGlobal("chrome", chromeStub);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  localStorage.clear();
});

describe("resolveTheme", () => {
  it("follows the system unless a theme is chosen", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
  });
});

describe("initTheme", () => {
  it("applies the saved theme and follows changes", async () => {
    await chromeStub.storage.local.set({ theme: "light" });
    const root = document.createElement("html");
    initTheme(root);
    expect(root.dataset.theme).toBe("dark"); // System (dark) until the setting loads.

    await vi.waitFor(() => expect(root.dataset.theme).toBe("light"));
    await setTheme("dark");
    expect(root.dataset.theme).toBe("dark");
    expect(localStorage.getItem("moneyshot-theme")).toBe("dark");
  });
});
