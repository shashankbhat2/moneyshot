// Injected into the tab when a screenshot starts (chrome.scripting.executeScript), possibly
// several times. Built as a standalone IIFE (vite.content.config.ts).
import { afterRepaint, captureFullPage } from "./lib/full-page";
import { type Message, sendMessage } from "./lib/messages";
import { type ScreenshotKind, selectArea, showScreenshotPicker } from "./lib/screenshot-overlay";

declare global {
  interface Window {
    __moneyshotAttached?: boolean;
  }
}

if (!window.__moneyshotAttached) {
  window.__moneyshotAttached = true;
  attach();
}

function send(message: Message) {
  return chrome.runtime.sendMessage(message).catch(() => {
    // Extension was reloaded; nothing to do.
  });
}

function attach() {
  let closePicker: (() => void) | null = null;

  const onMessage = (message: Message) => {
    switch (message.type) {
      case "content:screenshot":
        closePicker?.();
        closePicker = showScreenshotPicker({
          theme: "system",
          onPick: (kind) => {
            takeScreenshot(kind).catch(() => send({ type: "screenshot:cancel" }));
          },
          onCancel: () => send({ type: "screenshot:cancel" }),
        });
        break;
      case "content:teardown":
        teardown();
        break;
    }
  };

  function teardown() {
    closePicker?.();
    chrome.runtime.onMessage.removeListener(onMessage);
    window.__moneyshotAttached = false;
  }

  chrome.runtime.onMessage.addListener(onMessage);
}

/** The picker is already gone; capture after the page has repainted without it. */
async function takeScreenshot(kind: ScreenshotKind) {
  if (kind === "selection") {
    const rect = await selectArea();
    if (!rect) return send({ type: "screenshot:cancel" });
    await afterRepaint(80);
    return send({
      type: "screenshot:done",
      result: { kind, rect, viewportWidth: window.innerWidth },
    });
  }
  if (kind === "visible") {
    await afterRepaint(80);
    return send({ type: "screenshot:done", result: { kind } });
  }
  const page = await captureFullPage((y) => sendMessage({ type: "screenshot:tile", y }));
  return send({ type: "screenshot:done", result: { kind, ...page } });
}
