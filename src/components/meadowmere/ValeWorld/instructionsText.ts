/**
 * How to play. Shown by MeadowmerePage in a modal on first visit and from a
 * help trigger after that (both sit alongside the page's intro text), plus
 * rendered by ValeWorld permanently — but visually hidden — as the map's own
 * accessible description, so screen reader users always have it regardless
 * of whether the modal has ever been opened.
 *
 * Its own module, not a plain constant inside ValeWorld.tsx, so a .tsx file
 * that exports a component can still export this without breaking Fast
 * Refresh (biome's useComponentExportOnlyModules).
 */
export const HOW_TO_PLAY_TEXT =
  "Tap or click any place on the map to walk there and use it. Swipe the " +
  "map sideways — the valley is wider than the screen. With a keyboard: " +
  "arrow keys or W, A, S and D to walk, E to use whatever the farmer faces.";
