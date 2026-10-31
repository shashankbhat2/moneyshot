// Service worker: clicking the toolbar icon (or the shortcut) shows the screenshot picker on
// the page; the capture is saved and opened in the editor.
import {
  type Message,
  RESTRICTED_URL,
  type ScreenshotResult,
  toErrorResponse,
} from "./lib/messages";
import { putShot } from "./lib/shots";

// Chrome allows ~2 captureVisibleTab calls per second.
const MIN_CAPTURE_INTERVAL_MS = 550;
const PNG = { format: "png" } as const;

let lastCaptureAt = 0;
/** Tab showing the screenshot picker, and full-page tiles captured so far. */
let shotTabId: number | null = null;
let shotTiles: { y: number; dataUrl: string }[] = [];

function sendToTab(tabId: number, message: Message) {
  return chrome.tabs.sendMessage(tabId, message);
}

async function detachFromTab(tabId: number | null) {
  if (tabId === null) return;
  await sendToTab(tabId, { type: "content:teardown" }).catch(() => {}); // Tab closed.
}

/** captureVisibleTab, spaced out to stay under Chrome's rate limit. */
async function captureTab(windowId: number, options: chrome.extensionTypes.ImageDetails) {
  const wait = lastCaptureAt + MIN_CAPTURE_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastCaptureAt = Date.now();
  return chrome.tabs.captureVisibleTab(windowId, options);
}

const toBitmap = async (dataUrl: string) => createImageBitmap(await (await fetch(dataUrl)).blob());

// --- Screenshots -------------------------------------------------------------------

async function startScreenshot(tabId: number) {
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url || RESTRICTED_URL.test(tab.url)) {
    throw new Error("Chrome's own pages can't be captured. Switch to a website and try again.");
  }
  if (shotTabId !== null && shotTabId !== tabId) await detachFromTab(shotTabId);

  shotTabId = tabId;
  shotTiles = [];
  await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
  await sendToTab(tabId, { type: "content:screenshot" });
}

async function screenshotTile(sender: chrome.runtime.MessageSender, y: number) {
  if (sender.tab?.id !== shotTabId || !sender.tab) return;
  shotTiles.push({ y, dataUrl: await captureTab(sender.tab.windowId, PNG) });
}

async function finishScreenshot(sender: chrome.runtime.MessageSender, result: ScreenshotResult) {
  const tab = sender.tab;
  if (!tab?.id || tab.id !== shotTabId) return;

  try {
    let blob: Blob;
    if (result.kind === "full") {
      blob = await stitch(shotTiles, result.height, result.viewportWidth);
    } else {
      const dataUrl = await captureTab(tab.windowId, PNG);
      blob =
        result.kind === "selection"
          ? await crop(dataUrl, result.rect, result.viewportWidth)
          : await (await fetch(dataUrl)).blob();
    }
    await putShot(blob);
  } finally {
    await endScreenshot();
  }
  await chrome.tabs.create({ url: chrome.runtime.getURL("screenshot.html") });
}

async function endScreenshot() {
  const tabId = shotTabId;
  shotTabId = null;
  shotTiles = [];
  await detachFromTab(tabId);
}

/** Crop a viewport capture to a selection given in CSS px. */
async function crop(
  dataUrl: string,
  rect: { x: number; y: number; width: number; height: number },
  viewportWidth: number,
) {
  const bitmap = await toBitmap(dataUrl);
  const scale = bitmap.width / viewportWidth;
  const [x, y, width, height] = [rect.x, rect.y, rect.width, rect.height].map((value) =>
    Math.round(value * scale),
  ) as [number, number, number, number];
  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext("2d")?.drawImage(bitmap, x, y, width, height, 0, 0, width, height);
  return canvas.convertToBlob({ type: "image/png" });
}

/** Stitch viewport captures taken at scroll offsets `y` into one full-page image. */
async function stitch(
  tiles: { y: number; dataUrl: string }[],
  height: number,
  viewportWidth: number,
) {
  if (tiles.length === 0) throw new Error("Nothing was captured");
  const bitmaps = await Promise.all(tiles.map((tile) => toBitmap(tile.dataUrl)));
  const first = bitmaps[0] as ImageBitmap;
  const scale = first.width / viewportWidth;
  const canvas = new OffscreenCanvas(first.width, Math.round(height * scale));
  const context = canvas.getContext("2d");
  tiles.forEach((tile, index) => {
    const bitmap = bitmaps[index];
    if (bitmap) context?.drawImage(bitmap, 0, Math.round(tile.y * scale));
  });
  return canvas.convertToBlob({ type: "image/png" });
}

// --- Toolbar icon ------------------------------------------------------------------

/**
 * The icon is disabled (grayed out) by default and enabled by declarativeContent rules on
 * pages that can be captured. Chrome evaluates the rules itself, without access to tab URLs.
 */
async function setUpIconRules() {
  await chrome.action.disable();
  await chrome.declarativeContent.onPageChanged.removeRules();
  await chrome.declarativeContent.onPageChanged.addRules([
    {
      conditions: ["http", "https", "file"].map(
        (scheme) =>
          new chrome.declarativeContent.PageStateMatcher({ pageUrl: { schemes: [scheme] } }),
      ),
      actions: [new chrome.declarativeContent.ShowAction()],
    },
  ]);
}

chrome.runtime.onInstalled.addListener(() => {
  setUpIconRules().catch(console.error);
});

// Clicking the icon and the shortcut both count as invoking the extension, so the tab can be
// captured.
chrome.action.onClicked.addListener((tab) => {
  if (tab.id !== undefined) startScreenshot(tab.id).catch(console.error);
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "take-screenshot" && tab?.id !== undefined) {
    startScreenshot(tab.id).catch(console.error);
  }
});

// --- Messages ----------------------------------------------------------------------

async function handle(message: Message, sender: chrome.runtime.MessageSender) {
  switch (message.type) {
    case "screenshot:tile":
      return screenshotTile(sender, message.y);
    case "screenshot:done":
      return finishScreenshot(sender, message.result);
    case "screenshot:cancel":
      return endScreenshot();
    default:
      return; // content:* is handled by the content script.
  }
}

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (message.type.startsWith("content:")) return false;
  handle(message, sender).then(sendResponse, (error: unknown) => {
    console.error(error);
    sendResponse(toErrorResponse(error));
  });
  return true;
});
