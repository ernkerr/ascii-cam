// ============================================================
// asciiConverter.ts — the "magic" of ASCII art, in one file.
//
// Pipeline per frame:
//   1. Shrink the source image/video onto a tiny "processing canvas"
//      sized in CHARACTERS (e.g. 120 cols × 70 rows), not pixels.
//   2. Read those pixels as a flat RGBA byte array.
//   3. For each pixel, compute brightness → adjust with contrast/brightness
//      knobs → pick a character from the ramp.
//   4. Draw those characters onto the big visible "output canvas".
//
// The hidden canvas is the trick: by drawing a 1920×1080 video onto a
// 120×70 canvas, the browser's built-in image scaler gives us the
// "average color" of each character cell for free.
// ============================================================

import type { AsciiOptions, Orientation } from '../types';
import { CHAR_SETS } from '../constants/charSets';

// Rectangle on the output canvas in pixel coordinates.
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Returns the visible region of the output canvas — i.e. the area NOT
// covered by orientation bars. Matches the bar math inside renderAscii
// exactly (both are derived from the same char-grid dimensions) so the
// watermark and export cropping land in pixel-perfect alignment.
export function getVisibleRegion(
  canvasWidth: number,
  canvasHeight: number,
  fontSize: number,
  orientation: Orientation,
): Rect {
  if (orientation === 'auto') {
    return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
  }

  // Same char-grid math renderAscii uses (ceil, not floor, so the last row
  // covers the remainder that would otherwise show as bg color).
  const charHeight = fontSize;
  const charWidth = fontSize * 0.6;
  const cols = Math.max(1, Math.ceil(canvasWidth / charWidth));
  const rows = Math.max(1, Math.ceil(canvasHeight / charHeight));

  if (orientation === 'portrait') {
    // Visible chars wide = min(cols, rows * 3/4). Convert back to pixels.
    const visibleCols = Math.min(cols, rows * (3 / 4));
    const barCols = Math.max(0, (cols - visibleCols) / 2);
    return {
      x: barCols * charWidth,
      y: 0,
      width: visibleCols * charWidth,
      height: canvasHeight,
    };
  }
  // Landscape — 16:9 region, top/bottom bars (matches standard iPhone
  // landscape video aspect — what you'd expect to share on socials).
  const visibleRows = Math.min(rows, cols * (9 / 16));
  const barRows = Math.max(0, (rows - visibleRows) / 2);
  return {
    x: 0,
    y: barRows * charHeight,
    width: canvasWidth,
    height: visibleRows * charHeight,
  };
}

// Pick the active ramp string based on options.
// If the user chose 'custom', use whatever they typed (fall back to a space if empty).
export function getRamp(opts: AsciiOptions): string {
  if (opts.charSetKey === 'custom') {
    return opts.customChars || ' ';
  }
  return CHAR_SETS[opts.charSetKey];
}

// Everything the renderer needs to do its job, bundled together.
// Using an interface here keeps the function signature short.
export interface RenderTargets {
  source: CanvasImageSource;               // a <video> or <img> element
  sourceWidth: number;                     // intrinsic width  (0 = unknown)
  sourceHeight: number;                    // intrinsic height (0 = unknown)
  // How the source should be fit into the visible region:
  //   'cover'   → fill the region, crop source edges (webcam, immersive)
  //   'contain' → preserve source aspect, pad outside with literal black bars
  fitMode: 'cover' | 'contain';
  processingCanvas: HTMLCanvasElement;     // hidden, character-sized
  outputCanvas: HTMLCanvasElement;         // visible, pixel-sized
}

// How much to compress the rendered content horizontally for a "flattering"
// slim effect, à la front-facing phone cameras. 0.96 = 4% narrower; subtle
// enough that it reads as natural-looking, not distorted. Implemented by
// taking a slightly *wider* crop of the source and stretching it into the
// canvas width — so the slim effect has NO visible bars on the sides.
const SLIM_FACTOR = 0.96;

// The renderer. Pure-ish: it only writes to the two canvases it's handed.
export function renderAscii(targets: RenderTargets, opts: AsciiOptions): void {
  const {
    source,
    sourceWidth,
    sourceHeight,
    fitMode,
    processingCanvas,
    outputCanvas,
  } = targets;

  // 2D contexts are our "paintbrushes" for each canvas.
  // willReadFrequently=true is a hint to the browser: "we'll call getImageData
  //   a lot — please keep the bitmap on the CPU so reads are fast."
  const output = outputCanvas.getContext('2d', { alpha: false });
  const processing = processingCanvas.getContext('2d', { willReadFrequently: true });
  if (!output || !processing) return;

  const ramp = getRamp(opts);
  if (ramp.length === 0) return; // nothing to draw with

  // ---- Figure out the character grid size ----
  // Monospace characters are roughly 0.6× as wide as they are tall.
  // So if fontSize = 12px, each cell is ~7.2px wide × 12px tall.
  const charHeight = opts.fontSize;
  const charWidth = charHeight * 0.6;
  // Use ceil, not floor, so the grid extends slightly past the canvas edges.
  // Any overhang gets clipped by the canvas bitmap — avoids a thin strip of
  // bg color showing at the bottom/right when the canvas dims aren't an
  // even multiple of char dims.
  const cols = Math.max(1, Math.ceil(outputCanvas.width / charWidth));
  const rows = Math.max(1, Math.ceil(outputCanvas.height / charHeight));

  // Resize the hidden canvas so 1 pixel = 1 character cell.
  // Only resize when needed — resizing a canvas also clears it.
  if (processingCanvas.width !== cols || processingCanvas.height !== rows) {
    processingCanvas.width = cols;
    processingCanvas.height = rows;
  }

  // ---- Draw the source onto the hidden canvas ----
  // Char cells aren't square (charWidth = 0.6 * charHeight), so a region of
  // N chars × M chars renders at pixel aspect (N * 0.6) / M. Any aspect
  // comparisons involving source pixels have to account for this.
  const CHAR_WH_RATIO = 0.6;
  const haveDims = sourceWidth > 0 && sourceHeight > 0;

  // Start with a blank fill. Outside the rect we draw into stays blank,
  // which maps to space chars after the ASCII conversion.
  processing.fillStyle = opts.invert ? '#000000' : '#ffffff';
  processing.fillRect(0, 0, cols, rows);

  // Visible region in char coords (orientation-aware). Matches the pixel
  // math in getVisibleRegion() exactly — cropping happens to the sub-rect
  // defined by this region.
  let regionX = 0, regionY = 0, regionW = cols, regionH = rows;
  if (opts.orientation === 'portrait') {
    regionW = Math.min(cols, rows * (3 / 4));
    regionX = (cols - regionW) / 2;
  } else if (opts.orientation === 'landscape') {
    regionH = Math.min(rows, cols * (9 / 16));
    regionY = (rows - regionH) / 2;
  }

  // Source sub-rect + destination rect (both will fill in below based on fitMode).
  let sx = 0, sy = 0, sw = sourceWidth, sh = sourceHeight;
  let dx = regionX, dy = regionY, dw = regionW, dh = regionH;

  if (haveDims) {
    const srcAspect = sourceWidth / sourceHeight;
    const regionCharAspect = regionW / regionH;
    const regionPxAspect = regionCharAspect * CHAR_WH_RATIO;

    if (fitMode === 'cover') {
      // Cover + subtle slim: fill the region with a slightly-wider-than-
      // needed source slice, which squeezes horizontally to a ~4% thinner
      // rendered face.
      const slimPxAspect = regionPxAspect / SLIM_FACTOR;
      if (srcAspect >= slimPxAspect) {
        sh = sourceHeight;
        sw = sh * slimPxAspect;
        sx = (sourceWidth - sw) / 2;
        sy = 0;
      } else {
        sw = sourceWidth;
        sh = sw / slimPxAspect;
        if (sh > sourceHeight) {
          sh = sourceHeight;
          sw = sh * regionPxAspect;
          if (sw > sourceWidth) sw = sourceWidth;
          sx = (sourceWidth - sw) / 2;
        } else {
          sx = 0;
          sy = (sourceHeight - sh) / 2;
        }
      }
      dx = regionX; dy = regionY; dw = regionW; dh = regionH;
    } else {
      // Contain: preserve source's pixel aspect inside the region, letterbox
      // the rest. destCharAspect = srcAspect / CHAR_WH_RATIO because rendering
      // squishes the char-coord rectangle horizontally by CHAR_WH_RATIO.
      const destCharAspect = srcAspect / CHAR_WH_RATIO;
      if (destCharAspect >= regionCharAspect) {
        // Dest proportionally wider than region → fit by width, pad top/bottom.
        dw = regionW;
        dh = dw / destCharAspect;
      } else {
        // Dest proportionally taller → fit by height, pad sides.
        dh = regionH;
        dw = dh * destCharAspect;
      }
      dx = regionX + (regionW - dw) / 2;
      dy = regionY + (regionH - dh) / 2;
      // Whole source, no crop.
      sx = 0; sy = 0; sw = sourceWidth; sh = sourceHeight;
    }
  }

  processing.save();
  if (opts.mirror) {
    processing.translate(cols, 0);
    processing.scale(-1, 1);
  }
  if (haveDims) {
    processing.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
  } else {
    // First-frame fallback: stretch whole source to the destination rect.
    processing.drawImage(source, dx, dy, dw, dh);
  }
  processing.restore();

  // Note: we only draw source into the (dx,dy,dw,dh) region; everything
  // outside (letterbox + orientation bars) stays blank from the initial
  // fillRect above. For 'contain' mode we overpaint those areas with literal
  // black further below so they're not affected by the user's bg color.

  // Grab the pixels. `data` is a flat array: [R,G,B,A, R,G,B,A, ...]
  // so pixel at (x,y) starts at index (y*cols + x) * 4.
  const { data } = processing.getImageData(0, 0, cols, rows);

  // ---- Pre-compute contrast math (do it once, not per-pixel) ----
  // Power-curve contrast. We use 2^(3c) instead of the classic GIMP
  // formula because the classic one has a pole at c=1 (division by zero)
  // — it literally can't expose more than the range (-1, 1). This one:
  //   c = -1 → factor = 0.125 (very flat/gray)
  //   c =  0 → factor = 1     (neutral)
  //   c =  1 → factor = 8     (strong)
  //   c =  2 → factor = 64    (near-binary)
  // Stays smooth and well-defined throughout, so we can widen the slider.
  const contrastFactor = Math.pow(2, opts.contrast * 3);

  // Brightness is a simple additive shift: -255 .. +255
  const brightnessOffset = opts.brightness * 255;

  // ---- Paint background + set up text drawing ----
  output.fillStyle = opts.background;
  output.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

  output.fillStyle = opts.color;
  output.font = `${opts.fontSize}px ui-monospace, 'JetBrains Mono', Menlo, monospace`;
  output.textBaseline = 'top'; // so y=0 means "top of the character", not baseline

  // ---- For each row, build the ASCII string, then draw it in ONE call ----
  // One fillText per row is way faster than one per character.
  for (let y = 0; y < rows; y++) {
    let line = '';
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Luminosity formula (ITU-R BT.709). Humans see green brightest,
      // blue dimmest, so the weights aren't equal.
      let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      // Apply contrast around the midpoint (128), then shift brightness.
      lum = contrastFactor * (lum - 128) + 128 + brightnessOffset;

      // Invert = flip the ramp direction (dark pixel → light char and vice versa).
      if (opts.invert) lum = 255 - lum;

      // Clamp to valid range — contrast can push values past 255 or below 0.
      if (lum < 0) lum = 0;
      else if (lum > 255) lum = 255;

      // Map brightness 0..255 onto an index into the ramp.
      const idx = Math.floor((lum / 255) * (ramp.length - 1));
      line += ramp[idx];
    }
    output.fillText(line, 0, y * charHeight);
  }

  // No watermark — kept on the `watermark` branch if you want it back.

  // ---- Contain-mode letterbox ----
  // For images we preserve aspect ratio, which means letterbox areas
  // appear outside the rendered rect. User wants those to be LITERAL black
  // (not the canvas bg color that space-chars would pick up). Paint them on
  // top of the output canvas in pixel coords, using the dest rect we
  // computed above to mask out the image area.
  if (fitMode === 'contain' && haveDims) {
    const dxPx = dx * charWidth;
    const dyPx = dy * charHeight;
    const dwPx = dw * charWidth;
    const dhPx = dh * charHeight;
    const W = outputCanvas.width;
    const H = outputCanvas.height;

    output.fillStyle = '#000000';
    // Left of image
    if (dxPx > 0) output.fillRect(0, 0, dxPx, H);
    // Right of image
    const rightX = dxPx + dwPx;
    if (rightX < W) output.fillRect(rightX, 0, W - rightX, H);
    // Above image (only within image's horizontal span)
    if (dyPx > 0) output.fillRect(dxPx, 0, dwPx, dyPx);
    // Below image
    const bottomY = dyPx + dhPx;
    if (bottomY < H) output.fillRect(dxPx, bottomY, dwPx, H - bottomY);
  }
}
