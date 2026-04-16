// ============================================================
// App.tsx — the top-level component. Owns the "source of truth"
// for options and which source is active, wires up the sidebar
// and the canvas, and relays the screenshot command to the canvas.
// ============================================================

import { useCallback, useRef, useState } from 'react';
import { AsciiCanvas } from './components/AsciiCanvas';
import type { AsciiCanvasHandle } from './components/AsciiCanvas';
import { Controls } from './components/Controls';
import type { AsciiOptions, SourceKind } from './types';
import './App.css';

// Default options — sensible starting point.
const DEFAULT_OPTIONS: AsciiOptions = {
  charSetKey: 'density',
  customChars: '@#*+=-. ',
  fontSize: 12,
  contrast: 0.15,
  brightness: 0,
  color: '#00ff88',
  background: '#0a0a0a',
  invert: false,
  mirror: true, // mirror on by default for webcam selfie feel
};

export default function App() {
  const [options, setOptions] = useState<AsciiOptions>(DEFAULT_OPTIONS);
  const [source, setSource] = useState<SourceKind>('none');
  // When the user uploads a file, we turn it into an object URL
  // (a blob-backed string URL) so <img> can load it without re-encoding.
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ref into the canvas component so we can call its screenshot() method.
  const canvasRef = useRef<AsciiCanvasHandle>(null);

  const handlePickWebcam = useCallback(() => {
    setErrorMsg(null);
    setImageSrc(null);
    setSource('webcam');
  }, []);

  const handlePickImage = useCallback((file: File) => {
    setErrorMsg(null);
    // Revoke any previous object URL to free memory.
    setImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setSource('image');
  }, []);

  const handleScreenshot = useCallback(() => {
    canvasRef.current?.screenshot();
  }, []);

  return (
    <div className="app">
      <Controls
        options={options}
        setOptions={setOptions}
        source={source}
        onPickWebcam={handlePickWebcam}
        onPickImage={handlePickImage}
        onScreenshot={handleScreenshot}
      />

      <main className="stage" style={{ background: options.background }}>
        {source === 'none' ? (
          <div className="welcome">
            <h2>Pick a source to begin</h2>
            <p>Use your webcam, or upload an image.</p>
          </div>
        ) : (
          <AsciiCanvas
            ref={canvasRef}
            source={source}
            imageSrc={imageSrc}
            options={options}
            onError={setErrorMsg}
          />
        )}
        {errorMsg && <div className="error-toast">{errorMsg}</div>}
      </main>
    </div>
  );
}
