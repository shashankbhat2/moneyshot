// Canvas sizes for the screenshot editor: plain ratios, and exact sizes for social posts and
// store listings. Exact sizes export at those pixel dimensions.

export type SizeGroup = "ratio" | "social" | "store";

export type SizePreset = {
  id: string;
  label: string;
  group: SizeGroup;
  /** Width / height, or null to fit the screenshot. */
  ratio: number | null;
  /** Exact export size in px, for social and store sizes. */
  pixels?: { width: number; height: number };
};

const ratio = (id: string, width: number, height: number): SizePreset => ({
  id,
  label: id,
  group: "ratio",
  ratio: width / height,
});

const exact = (
  id: string,
  label: string,
  group: SizeGroup,
  width: number,
  height: number,
): SizePreset => ({ id, label, group, ratio: width / height, pixels: { width, height } });

export const SIZES: SizePreset[] = [
  { id: "auto", label: "Auto", group: "ratio", ratio: null },
  ratio("16:9", 16, 9),
  ratio("4:3", 4, 3),
  ratio("1:1", 1, 1),
  ratio("4:5", 4, 5),
  ratio("9:16", 9, 16),
  exact("x-post", "X post", "social", 1600, 900),
  exact("x-header", "X header", "social", 1500, 500),
  exact("linkedin", "LinkedIn post", "social", 1200, 627),
  exact("instagram", "Instagram post", "social", 1080, 1080),
  exact("instagram-portrait", "Instagram portrait", "social", 1080, 1350),
  exact("story", "Story / Reel", "social", 1080, 1920),
  exact("youtube", "YouTube thumbnail", "social", 1280, 720),
  exact("dribbble", "Dribbble shot", "social", 1600, 1200),
  exact("product-hunt", "Product Hunt", "store", 1270, 760),
  exact("app-store-iphone", "App Store iPhone", "store", 1290, 2796),
  exact("app-store-ipad", "App Store iPad", "store", 2048, 2732),
  exact("play-phone", "Play Store phone", "store", 1080, 1920),
  exact("play-feature", "Play Store feature", "store", 1024, 500),
  exact("chrome-web-store", "Chrome Web Store", "store", 1280, 800),
];

export const SIZE_GROUPS: { id: SizeGroup; label: string }[] = [
  { id: "ratio", label: "Ratio" },
  { id: "social", label: "Social" },
  { id: "store", label: "Stores" },
];

export const sizeFor = (id: string): SizePreset =>
  SIZES.find((size) => size.id === id) ?? (SIZES[0] as SizePreset);
