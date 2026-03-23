function makeSvgCursor(body: string, hx: number, hy: number, fallback: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hx} ${hy}, ${fallback}`;
}

export const SHEARS_CURSOR = makeSvgCursor(
  '<circle cx="6" cy="6" r="3" fill="none" stroke="#333" stroke-width="1.5"/>' +
    '<circle cx="6" cy="18" r="3" fill="none" stroke="#333" stroke-width="1.5"/>' +
    '<line x1="20" y1="4" x2="8.12" y2="12" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>' +
    '<line x1="14.47" y1="14.48" x2="20" y2="20" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>' +
    '<line x1="8.12" y1="12" x2="14.47" y2="14.48" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>',
  12,
  12,
  "crosshair",
);

export const WATER_CURSOR = makeSvgCursor(
  '<path d="M12 3c0 0-7 8-7 13a7 7 0 0 0 14 0C19 11 12 3 12 3z" fill="#4a90d9" stroke="#336699" stroke-width="1"/>',
  12,
  20,
  "pointer",
);
