// ============================================================
// gif.d.ts — TypeScript shim for gif.js.
// gif.js ships no types, so we declare just what we use.
// This file isn't imported anywhere; TS picks it up because
// it ends in .d.ts and is inside src/.
// ============================================================

declare module 'gif.js' {
  interface GIFOptions {
    workers?: number;        // how many Web Workers to run in parallel
    quality?: number;        // 1 (best) – 30 (fastest); default 10
    workerScript?: string;   // URL of gif.worker.js
    width?: number;
    height?: number;
    background?: string;
    transparent?: number | null;
    repeat?: number;         // 0 = loop forever
    debug?: boolean;
  }

  interface AddFrameOptions {
    delay?: number;  // ms this frame is shown
    copy?: boolean;  // copy pixels now (needed because canvas reuses its buffer)
  }

  export default class GIF {
    constructor(options?: GIFOptions);
    addFrame(
      imageElement: CanvasImageSource,
      options?: AddFrameOptions,
    ): void;
    on(event: 'finished', cb: (blob: Blob) => void): void;
    on(event: 'progress', cb: (pct: number) => void): void;
    on(event: 'abort' | 'start', cb: () => void): void;
    render(): void;
    abort(): void;
  }
}
