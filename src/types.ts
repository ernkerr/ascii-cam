// ============================================================
// types.ts — shared TypeScript types used across the app.
// This file doesn't *do* anything; it just defines the shapes
// of objects so the compiler can catch typos and wrong types.
// ============================================================

// A CharSetKey is one of the named ramps the user can pick.
// "custom" is special: it means "use whatever the user typed into the custom box".
export type CharSetKey =
  | 'blocks'
  | 'density'
  | 'densityComplex'
  | 'binary'
  | 'stars'
  | 'circles'
  | 'hearts'
  | 'dots'
  | 'arrows'
  | 'custom';

// What is feeding the canvas right now?
// 'none'   → nothing chosen yet (show a welcome screen)
// 'webcam' → live video from getUserMedia
// 'image'  → a still image the user uploaded
export type SourceKind = 'none' | 'webcam' | 'image';

// Orientation controls how the source is *cropped* before being rendered.
// It does NOT change the canvas size — the canvas always fills the stage.
//   auto      → no crop, source stretches to fill canvas (original behavior)
//   portrait  → crop source to 3:4, draw in a portrait-shaped region
//   landscape → crop source to 4:3, draw in a landscape-shaped region
export type Orientation = 'auto' | 'portrait' | 'landscape';

// All the knobs the user can tweak. We pass this object around as one bag
// so adding a new option later only requires adding a field here.
export interface AsciiOptions {
  charSetKey: CharSetKey;   // which named ramp to use
  customChars: string;      // the user's custom ramp (used when charSetKey === 'custom')
  fontSize: number;         // pixels; also controls ASCII resolution (smaller font = more chars)
  contrast: number;         // -1..1. 0 = neutral. >0 stretches darks darker & lights lighter.
  brightness: number;       // -1..1. 0 = neutral. Shifts every pixel brighter or darker.
  color: string;            // text color (hex like "#00ff88")
  background: string;       // background color behind the text
  invert: boolean;          // swap dark<->light (useful for light backgrounds)
  mirror: boolean;          // flip horizontally — nice for webcam "selfie" feel
  orientation: Orientation; // crop source to portrait/landscape (canvas size unchanged)
}
