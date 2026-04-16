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
  // Pipeline:
  //   1. Pick a source sub-rect slightly *wider* than canvas aspect, so
  //      squeezing it into the canvas width produces the slim effect
  //      WITHOUT visible side bars.
  //   2. Draw to a full-width, zoom-reduced-height destination, centered
  //      vertically. Bars appear only on top & bottom.
  //
  // "Slim target aspect" = canvas aspect / SLIM_FACTOR. Roughly 4% wider
  // than canvas aspect — the extra horizontal source content gets
  // compressed on render, which reads as thinner.
  const haveDims = sourceWidth > 0 && sourceHeight > 0;

  processing.fillStyle = opts.invert ? '#000000' : '#ffffff';
  processing.fillRect(0, 0, cols, rows);

  let sx = 0, sy = 0, sw = sourceWidth, sh = sourceHeight;
  if (haveDims) {
    const srcAspect = sourceWidth / sourceHeight;
    const canvasAspect = cols / rows;
    const slimAspect = canvasAspect / SLIM_FACTOR;

    if (srcAspect >= slimAspect) {
      // Source is wide enough to support the slim crop — take full height
      // and a slim-aspect-wide slice centered horizontally.
      sh = sourceHeight;
      sw = sourceHeight * slimAspect;
      sx = (sourceWidth - sw) / 2;
      sy = 0;
    } else {
      // Source isn't that wide. Take full width + a proportional height
      // slice. Slim effect is reduced but nothing distorts badly.
      sw = sourceWidth;
      sh = sourceWidth / slimAspect;
      if (sh > sourceHeight) {
        // Even the slim-aspect height exceeds the source — fall back to
        // simple cover (no slim) rather than produce a bad crop.
        sh = sourceHeight;
        sw = sourceHeight * canvasAspect;
        if (sw > sourceWidth) sw = sourceWidth;
        sx = (sourceWidth - sw) / 2;
      } else {
        sx = 0;
        sy = (sourceHeight - sh) / 2;
      }
    }
  }

  // Destination: full canvas, edge to edge.
  processing.save();
  if (opts.mirror) {
    processing.translate(cols, 0);
    processing.scale(-1, 1);
  }
  if (haveDims) {
    processing.drawImage(source, sx, sy, sw, sh, 0, 0, cols, rows);
  } else {
    // First-frame fallback: stretch whole source to the canvas.
    processing.drawImage(source, 0, 0, cols, rows);
  }
  processing.restore();

  // ---- Orientation bars ----
  // Paint "blank" bars on top of the drawn source to crop the visible region.
  // Bar color maps to a space character after luminosity + invert, so on the
  // dark canvas it reads as a true black bar.
  //
  // Direction is hardcoded per orientation (user expects portrait = side
  // bars, landscape = top/bottom bars, regardless of window aspect ratio).
  // Aspects were chosen so bars stay visible on typical wide windows:
  //   portrait  3:4     → side bars on anything wider than 3:4
  //   landscape 16:9    → top/bottom bars on anything narrower than 16:9
  if (opts.orientation !== 'auto') {
    processing.fillStyle = opts.invert ? '#000000' : '#ffffff';

    if (opts.orientation === 'portrait') {
      // Visible region is 3:4 tall, centered. Bars fill the sides.
      const visibleW = rows * (3 / 4);
      const barW = Math.max(0, (cols - visibleW) / 2);
      if (barW > 0) {
        processing.fillRect(0, 0, barW, rows);
        processing.fillRect(cols - barW, 0, barW, rows);
      }
    } else {
      // Landscape: visible region is 16:9 wide, centered. Bars on top/bottom.
      const visibleH = cols * (9 / 16);
      const barH = Math.max(0, (rows - visibleH) / 2);
      if (barH > 0) {
        processing.fillRect(0, 0, cols, barH);
        processing.fillRect(0, rows - barH, cols, barH);
      }
    }
  }

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
}
