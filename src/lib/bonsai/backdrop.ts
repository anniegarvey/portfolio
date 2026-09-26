// ─── Tend-view backdrop ───────────────────────────────────────────────────────
//
// The tend view shows a tree much larger than the garden does, and the scene
// behind it should be the patch of garden that tree is actually standing on,
// enlarged by the same amount. Both views draw the tree with the same art, so
// the tree's own art coordinates are the shared frame: record where they sit
// in each view, and the garden scene can be scaled and shifted to match.

/** Where a tree's art sits within a box, in that box's own pixels. */
export interface TreeFrame {
  /** Pixel position of the tree art's (0, 0) point within the box. */
  originX: number;
  originY: number;
  /** Pixels per unit of tree art. */
  scale: number;
  /** The box itself. */
  width: number;
  height: number;
}

export interface BackdropBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Where to draw the whole garden scene inside the tend view so the tree sits
 * against the same part of it as in the garden.
 *
 * `garden` is the tree measured in the garden, `tend` the same tree in the tend
 * view. A tree planted right against the garden's edge would pull the scene
 * past the tend view's edge and leave a bare strip, so the scene is kept
 * covering the view: the one place the match gives way.
 */
export function placeBackdrop(garden: TreeFrame, tend: TreeFrame): BackdropBox {
  const k = tend.scale / garden.scale;
  const width = garden.width * k;
  const height = garden.height * k;
  const left = tend.originX - garden.originX * k;
  const top = tend.originY - garden.originY * k;
  return {
    left: Math.min(0, Math.max(tend.width - width, left)),
    top: Math.min(0, Math.max(tend.height - height, top)),
    width,
    height,
  };
}

/**
 * Measures a tree's art against the padding box of `box`, which is what an
 * absolutely placed scene inside it fills. `art` wraps the tree's `<svg>`
 * exactly (same left, top and width) and is never itself rotated, so it stands
 * in for an svg that may be mid-sway.
 */
export function measureTreeFrame(
  box: HTMLElement,
  art: HTMLElement,
): TreeFrame | null {
  const vb = art.querySelector("svg")?.viewBox.baseVal;
  if (!(vb?.width && box.offsetWidth)) return null;
  const boxRect = box.getBoundingClientRect();
  const artRect = art.getBoundingClientRect();
  // The tend view zooms with a transform, which bounding rects include and
  // layout sizes do not; divide it back out so the frame is in layout pixels.
  const zoom = boxRect.width / box.offsetWidth;
  const scale = artRect.width / zoom / vb.width;
  return {
    originX:
      (artRect.left - boxRect.left) / zoom - box.clientLeft - vb.x * scale,
    originY: (artRect.top - boxRect.top) / zoom - box.clientTop - vb.y * scale,
    scale,
    width: box.clientWidth,
    height: box.clientHeight,
  };
}
