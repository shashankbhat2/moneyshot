/** Longest page we stitch, in CSS px; beyond this canvases get too large. */
export const MAX_FULL_PAGE_PX = 12000;

/** Scroll offsets that cover a page of `total` px with a viewport of `viewport` px. */
export function scrollPositions(total: number, viewport: number): number[] {
  if (total <= viewport) return [0];
  const positions: number[] = [];
  for (let y = 0; y < total - viewport; y += viewport) positions.push(y);
  positions.push(total - viewport);
  return positions;
}

export const afterRepaint = (extraMs = 0) =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, extraMs))),
  );

/** Hide fixed and sticky elements (headers, chat widgets) so they don't repeat in every tile. */
function hidePinnedElements() {
  const hidden: { element: HTMLElement; visibility: string }[] = [];
  for (const element of document.querySelectorAll<HTMLElement>("body *")) {
    const { position } = getComputedStyle(element);
    if (position === "fixed" || position === "sticky") {
      hidden.push({ element, visibility: element.style.visibility });
      element.style.visibility = "hidden";
    }
  }
  return () => {
    for (const { element, visibility } of hidden) element.style.visibility = visibility;
  };
}

/**
 * Scroll through the page, asking `captureTile(y)` to screenshot each viewport. Returns the
 * page height covered. Scroll position and pinned elements are restored afterwards.
 */
export async function captureFullPage(captureTile: (y: number) => Promise<void>) {
  const root = document.scrollingElement ?? document.documentElement;
  const startY = window.scrollY;
  const viewport = window.innerHeight;
  const height = Math.min(root.scrollHeight, MAX_FULL_PAGE_PX);
  const scrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";
  let restorePinned: (() => void) | null = null;

  try {
    const positions = scrollPositions(height, viewport);
    for (const [index, y] of positions.entries()) {
      window.scrollTo(0, y);
      await afterRepaint(150); // Let lazy content and scroll-linked effects settle.
      if (index === 1) {
        restorePinned = hidePinnedElements();
        await afterRepaint();
      }
      await captureTile(window.scrollY);
    }
  } finally {
    restorePinned?.();
    window.scrollTo(0, startY);
    document.documentElement.style.scrollBehavior = scrollBehavior;
  }
  return { height, viewportWidth: window.innerWidth };
}
