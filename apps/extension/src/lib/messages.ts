import type { SelectionRect } from "./screenshot-overlay";
import type { Theme } from "./theme";

/** Messages between the background worker and the content script. */
export type Message =
  // content → background
  | { type: "screenshot:tile"; y: number }
  | { type: "screenshot:done"; result: ScreenshotResult }
  | { type: "screenshot:cancel" }
  // background → content
  | { type: "content:screenshot"; theme: Theme }
  | { type: "content:teardown" };

export type ScreenshotResult =
  | { kind: "visible" }
  | { kind: "selection"; rect: SelectionRect; viewportWidth: number }
  /** Tiles were sent one by one with screenshot:tile. */
  | { kind: "full"; height: number; viewportWidth: number };

export type ErrorResponse = { error: string };

/** Listeners reply with this instead of throwing, which would leave the sender hanging. */
export function toErrorResponse(error: unknown): ErrorResponse {
  return { error: error instanceof Error ? error.message : String(error) };
}

/** Send a message to the extension and throw if the receiver replied with an error. */
export async function sendMessage<T = void>(message: Message): Promise<T> {
  const response = await chrome.runtime.sendMessage(message);
  if (response && typeof response === "object" && "error" in response) {
    throw new Error(String(response.error));
  }
  return response as T;
}

/** Pages Chrome doesn't let extensions capture. */
export const RESTRICTED_URL =
  /^(chrome|chrome-extension|chrome-untrusted|devtools|edge|about|view-source):|^https:\/\/chromewebstore\.google\.com/;
