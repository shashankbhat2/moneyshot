import { vi } from "vitest";

type Listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => void;

function createStorageArea(name: string, listeners: Set<Listener>) {
  const data: Record<string, unknown> = {};
  return {
    data,
    get: vi.fn(async (key: string) => (key in data ? { [key]: data[key] } : {})),
    remove: vi.fn(async (key: string) => {
      delete data[key];
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      const changes: Record<string, chrome.storage.StorageChange> = {};
      for (const [key, newValue] of Object.entries(items)) {
        changes[key] = { oldValue: data[key], newValue };
      }
      Object.assign(data, items);
      for (const listener of listeners) listener(changes, name);
    }),
  };
}

/** Minimal in-memory stand-in for the chrome.* APIs the extension UI uses. */
export function createChromeStub() {
  const listeners = new Set<Listener>();
  return {
    storage: {
      session: createStorageArea("session", listeners),
      local: createStorageArea("local", listeners),
      onChanged: {
        addListener: (listener: Listener) => listeners.add(listener),
        removeListener: (listener: Listener) => listeners.delete(listener),
      },
    },
    runtime: {
      sendMessage: vi.fn(async () => undefined),
      getURL: (path: string) => `chrome-extension://test/${path}`,
      connect: vi.fn(() => ({ disconnect: vi.fn() })),
      getManifest: () => ({ version: "0.0.0" }),
    },
    tabs: {
      query: vi.fn(async () => [{ id: 42 }]),
      create: vi.fn(async () => ({})),
    },
    commands: {
      getAll: vi.fn(async () => [{ name: "toggle-recording", shortcut: "Alt+Shift+R" }]),
    },
    tabCapture: {
      getMediaStreamId: vi.fn(async () => "stream-1"),
    },
  };
}

export type ChromeStub = ReturnType<typeof createChromeStub>;
