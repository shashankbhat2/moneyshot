import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DotPad } from "./DotPad";

function renderPad(value = { x: 0, y: 0 }) {
  const onChange = vi.fn();
  render(<DotPad label="Position" value={value} onChange={onChange} />);
  const pad = screen.getByRole("group", { name: "Position" });
  pad.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
  return { pad, onChange };
}

describe("DotPad", () => {
  it("has nine dots and marks the current one", () => {
    const { pad } = renderPad({ x: 1, y: -1 });

    expect(within(pad).getAllByRole("button")).toHaveLength(9);
    expect(within(pad).getByRole("button", { name: "Top right" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("jumps to a clicked dot", async () => {
    const { pad, onChange } = renderPad();

    await userEvent.click(within(pad).getByRole("button", { name: "Bottom left" }));

    expect(onChange).toHaveBeenCalledWith({ x: -1, y: 1 });
  });

  it("follows the pointer while dragging, snapping near dots", () => {
    const { pad, onChange } = renderPad();

    fireEvent.pointerDown(pad, { button: 0, clientX: 75, clientY: 30 });
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.5, y: expect.closeTo(-0.4) });

    fireEvent.pointerMove(pad, { clientX: 97, clientY: 52 });
    expect(onChange).toHaveBeenLastCalledWith({ x: 1, y: 0 });

    fireEvent.pointerUp(pad);
    fireEvent.pointerMove(pad, { clientX: 10, clientY: 10 });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("resets to the center on double-click, but not when double-clicking a dot", () => {
    const { pad, onChange } = renderPad({ x: 1, y: 1 });

    fireEvent.doubleClick(within(pad).getByRole("button", { name: "Left" }));
    expect(onChange).not.toHaveBeenCalledWith({ x: 0, y: 0 });

    fireEvent.doubleClick(pad);
    expect(onChange).toHaveBeenCalledWith({ x: 0, y: 0 });
  });
});
