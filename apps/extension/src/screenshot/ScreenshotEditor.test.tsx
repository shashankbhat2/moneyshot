import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type ChromeStub, createChromeStub } from "../test/chrome";
import { ScreenshotEditor } from "./ScreenshotEditor";

const getShot = vi.fn<() => Promise<Blob | undefined>>();
const putAsset = vi.fn();
vi.mock("../lib/shots", () => ({
  getShot: () => getShot(),
  putShot: vi.fn(),
  getAsset: vi.fn(async () => new Blob(["png"], { type: "image/png" })),
  putAsset: (...args: unknown[]) => putAsset(...args),
  deleteAsset: vi.fn(async () => {}),
}));

let chromeStub: ChromeStub;

beforeEach(() => {
  chromeStub = createChromeStub();
  vi.stubGlobal("chrome", chromeStub);
  getShot.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
  putAsset.mockReset();
});

const tab = (name: string) => userEvent.click(screen.getByRole("tab", { name }));
const pick = (group: string, option: string) =>
  userEvent.click(
    within(screen.getByRole("radiogroup", { name: group })).getByRole("radio", { name: option }),
  );
/** Render, and let the saved style load (the picker reopens on its tab). */
async function renderEditor() {
  render(<ScreenshotEditor />);
  await screen.findByRole("img", { name: "Styled screenshot" });
  await new Promise((resolve) => setTimeout(resolve, 0));
}
const saved = () => chromeStub.storage.local.data.shotStyle as Record<string, unknown> | undefined;

const open = (title: string) =>
  userEvent.click(screen.getByRole("button", { name: new RegExp(`^${title}`) }));

describe("ScreenshotEditor", () => {
  it("starts on Layout, with Style, Text and a coming-soon Annotate tab", async () => {
    await renderEditor();

    expect(screen.getAllByRole("tab").map((element) => element.textContent)).toEqual([
      "Layout",
      "Style",
      "Text",
      "AnnotateSoon",
    ]);
    expect(screen.getByRole("tab", { name: "Layout" })).toHaveAttribute("aria-selected", "true");
    for (const title of ["Size", "Padding", "Zoom", "Position", "Rotation", "Tilt"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${title}`) })).toBeInTheDocument();
    }

    await tab("Style");
    for (const title of ["Background", "Pattern", "Frame", "Shadow"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${title}`) })).toBeInTheDocument();
    }

    await tab("Annotate (coming soon)");
    expect(screen.getByText("Annotations are coming soon")).toBeInTheDocument();
  });

  it("sizes the canvas for social posts and store listings", async () => {
    await renderEditor();

    await pick("Size type", "Stores");
    await pick("Size", "Product Hunt");
    await vi.waitFor(() => expect(saved()?.aspect).toBe("product-hunt"));
    expect(screen.getByRole("button", { name: /^Size/ })).toHaveTextContent("1270 × 760");

    await pick("Size type", "Social");
    await pick("Size", "X post");
    await vi.waitFor(() => expect(saved()?.aspect).toBe("x-post"));
  });

  it("sets padding, zoom, rotation and shadow with sliders", async () => {
    await renderEditor();

    fireEvent.change(screen.getByRole("slider", { name: /Padding/ }), { target: { value: "0.2" } });
    fireEvent.change(screen.getByRole("slider", { name: /Zoom/ }), { target: { value: "1.25" } });
    await open("Rotation");
    await userEvent.click(screen.getByRole("button", { name: "+15°" }));
    await tab("Style");
    fireEvent.change(screen.getByRole("slider", { name: /Shadow/ }), { target: { value: "0.8" } });

    await vi.waitFor(() =>
      expect(saved()).toMatchObject({ padding: 0.2, zoom: 1.25, rotation: 15, shadow: 0.8 }),
    );
  });

  it("offers image, mesh, solid and gradient backgrounds", async () => {
    await renderEditor();
    await tab("Style");

    await pick("Background type", "Images");
    await pick("Background", "Dune");
    await vi.waitFor(() => expect(saved()?.background).toMatchObject({ kind: "wallpaper" }));

    await pick("Background type", "Solid");
    fireEvent.change(screen.getByLabelText("Custom color"), { target: { value: "#123456" } });
    await vi.waitFor(() =>
      expect(saved()?.background).toEqual({ kind: "solid", color: "#123456" }),
    );
  });

  it("layers a pattern over the background", async () => {
    await renderEditor();
    await tab("Style");
    await open("Pattern");

    await pick("Pattern", "Waves");
    fireEvent.change(screen.getByLabelText("Pattern color"), { target: { value: "#ff0000" } });
    fireEvent.change(screen.getByRole("slider", { name: /Opacity/ }), { target: { value: "0.5" } });

    await vi.waitFor(() =>
      expect(saved()?.pattern).toEqual({ kind: "waves", color: "#ff0000", opacity: 0.5, scale: 1 }),
    );
    expect(saved()?.background).toMatchObject({ kind: "mesh" });
  });

  it("uploads an image background and keeps it with the images", async () => {
    await renderEditor();
    await tab("Style");

    await pick("Background type", "Images");
    expect(screen.getByText(/Upload your own image/)).toBeInTheDocument();
    const file = new File(["png"], "bg.png", { type: "image/png" });
    await userEvent.upload(screen.getByLabelText("Background image file"), file);

    await vi.waitFor(() => expect(saved()?.background).toMatchObject({ kind: "image" }));
    expect(putAsset).toHaveBeenCalledWith(expect.any(String), file);
    expect(chromeStub.storage.local.data.shotBackgrounds).toHaveLength(1);
    expect(screen.getByRole("radio", { name: "Image" })).toBeChecked();
  });

  it("saves the current background", async () => {
    await renderEditor();
    await tab("Style");

    await pick("Background type", "Gradient");
    await pick("Background", "Sea");
    await pick("Background type", "Images");
    await userEvent.click(screen.getByRole("button", { name: "Save current background" }));

    expect(chromeStub.storage.local.data.shotBackgrounds).toEqual([
      { kind: "gradient", stops: ["#22d3ee", "#6366f1"] },
    ]);
    expect(screen.getByRole("button", { name: "Save current background" })).toBeDisabled();
  });

  it("remembers frame, text and watermark", async () => {
    await renderEditor();

    await tab("Style");
    await pick("Frame", "macOS dark");
    await tab("Text");
    await userEvent.type(screen.getByPlaceholderText("Add a headline…"), "Ship faster");
    await pick("Text placement", "Below");
    await userEvent.type(screen.getByPlaceholderText("yourcompany.com"), "moneyshot.app");
    await pick("Watermark corner", "Top left");

    await vi.waitFor(() =>
      expect(saved()).toMatchObject({
        frame: "macos-dark",
        text: { value: "Ship faster", placement: "bottom" },
        watermark: { value: "moneyshot.app", corner: "top-left" },
      }),
    );
  });

  it("starts from the saved style, upgrading older saves", async () => {
    await chromeStub.storage.local.set({
      shotStyle: { background: "ink", frame: "window", shadow: "lg", aspect: "16:9" },
    });
    await renderEditor();

    expect(screen.getByRole("radio", { name: "16:9" })).toBeChecked();
    await tab("Style");
    expect(screen.getByRole("radio", { name: "Ink" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "macOS light" })).toBeChecked();
    expect(screen.getByRole("slider", { name: /Shadow/ })).toHaveValue("1");
  });

  it("explains when there's no screenshot", async () => {
    getShot.mockResolvedValue(undefined);
    render(<ScreenshotEditor />);

    expect(await screen.findByText("There's no screenshot yet.")).toBeInTheDocument();
  });
});
