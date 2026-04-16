// ============================================================
// charSets.ts — the "ramps" of characters we map brightness to.
//
// How a ramp works:
//   A ramp is just a string, ordered from DARKEST (most ink) to
//   LIGHTEST (least ink). For each pixel we calculate brightness
//   (0..255), then pick ramp[ floor(brightness/255 * (ramp.length-1)) ].
//
//   Example with density='@%#*+=-:. '
//     black  pixel → '@'  (lots of ink)
//     gray   pixel → '='
//     white  pixel → ' '  (no ink)
//
//   The space at the end is important — it's what "white" looks like.
// ============================================================

import type { CharSetKey } from '../types';

// `Record<Exclude<CharSetKey, 'custom'>, string>` just means:
// "an object keyed by every CharSetKey EXCEPT 'custom', with string values".
// We exclude 'custom' because its value comes from the user's input, not this file.
export const CHAR_SETS: Record<Exclude<CharSetKey, 'custom'>, string> = {
  blocks: '█▓▒░ ',            // classic ASCII-art blocks (very clean)
  density: '@%#*+=-:. ',       // short ramp — fast, punchy
  densityComplex:              // long ramp — more grayscale levels = more detail
    "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  binary: '10 ',               // just 1s, 0s, and blanks — Matrix vibes
  stars: '★✦✧·· ',            // decorative — great for portraits
  circles: '●◉○◌·· ',          // geometric
  hearts: '♥♡·· ',             // playful
  dots: '●•·· ',               // minimal
  arrows: '↟↑⇡·· ',            // directional, abstract
};

// Human-readable labels for the dropdown.
export const CHAR_SET_LABELS: Record<CharSetKey, string> = {
  blocks: 'Blocks',
  density: 'Density — simple',
  densityComplex: 'Density — complex',
  binary: 'Binary',
  stars: 'Stars',
  circles: 'Circles',
  hearts: 'Hearts',
  dots: 'Dots',
  arrows: 'Arrows',
  custom: 'Custom…',
};

// We keep an explicit ordered array so the dropdown renders in the order
// we choose, not whatever order Object.keys() happens to return.
export const CHAR_SET_KEYS: CharSetKey[] = [
  'blocks',
  'density',
  'densityComplex',
  'binary',
  'stars',
  'circles',
  'hearts',
  'dots',
  'arrows',
  'custom',
];
