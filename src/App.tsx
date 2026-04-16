// ============================================================
// App.tsx — the top-level component. Owns the "source of truth"
// for options and which source is active, wires up the sidebar
// and the canvas, and relays the screenshot command to the canvas.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { AsciiCanvas } from './components/AsciiCanvas';
import type { AsciiCanvasHandle } from './components/AsciiCanvas';
import { Controls } from './components/Controls';
import { ThanksModal } from './components/ThanksModal';
import type { AsciiOptions, SourceKind } from './types';
import './App.css';

// Default options — sensible starting point.
const DEFAULT_OPTIONS: AsciiOptions = {
  charSetKey: 'circles',
  customChars: '@#*+=-. ',
  fontSize: 12,
  contrast: 0.15,
  brightness: 0,
  color: '#00ff88',
  background: '#0a0a0a',
  // Why invert = true by default:
  // Ramps are defined darkest → lightest, which assumes ink on white paper.
  // We render light text on a dark bg (the opposite), so we flip the mapping:
  // bright pixel → dense char (bright on dark bg) / dark pixel → space (dark).
  // If you pick a light background color, turn this OFF.
  invert: true,
  mirror: true, // mirror on by default for webcam selfie feel
  orientation: 'auto', // no cropping by default
};

export default function App() {
  const [options, setOptions] = useState<AsciiOptions>(DEFAULT_OPTIONS);
  // Default to webcam — browser will prompt for permission on load.
  // If the user denies, they'll see the error toast and can click Upload instead.
  const [source, setSource] = useState<SourceKind>('webcam');
  // When the user uploads a file, we turn it into an object URL
  // (a blob-backed string URL) so <img> can load it without re-encoding.
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Recording state lives here (not inside AsciiCanvas) so the Record button
  // in the sidebar can render the current elapsed time and label.
  const [isRecording, setIsRecording] = useState(false);
  const [recordStart, setRecordStart] = useState<number | null>(null);
  const [recordElapsed, setRecordElapsed] = useState(0);

  // Same pattern for GIF — tracked separately because you can't record
  // MP4 and GIF at the same time, and GIF has a post-stop encoding phase.
  const [isGifRecording, setIsGifRecording] = useState(false);
  const [gifStart, setGifStart] = useState<number | null>(null);
  const [gifElapsed, setGifElapsed] = useState(0);
  const [gifProgress, setGifProgress] = useState(0);

  // Thanks modal: show after any successful export.
  const [showThanks, setShowThanks] = useState(false);

  // Ref into the canvas component so we can call its screenshot() method.
  const canvasRef = useRef<AsciiCanvasHandle>(null);

  // While recording, tick a 500ms interval so the "0:04" label updates.
  // When not recording, this effect cleans itself up.
  useEffect(() => {
    if (!isRecording || recordStart === null) return;
    const id = setInterval(() => {
      setRecordElapsed(Date.now() - recordStart);
    }, 500);
    return () => clearInterval(id);
  }, [isRecording, recordStart]);

  // Same timer for GIF.
  useEffect(() => {
    if (!isGifRecording || gifStart === null) return;
    const id = setInterval(() => {
      setGifElapsed(Date.now() - gifStart);
    }, 500);
    return () => clearInterval(id);
  }, [isGifRecording, gifStart]);

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

  const handleToggleRecord = useCallback(() => {
    if (isRecording) {
      canvasRef.current?.stopRecording();
      setIsRecording(false);
      setRecordStart(null);
      setRecordElapsed(0);
    } else {
      canvasRef.current?.startRecording();
      setIsRecording(true);
      setRecordStart(Date.now());
      setRecordElapsed(0);
    }
  }, [isRecording]);

  const handleToggleGif = useCallback(() => {
    if (isGifRecording) {
      canvasRef.current?.stopGifRecording();
      setIsGifRecording(false);
      setGifStart(null);
      setGifElapsed(0);
      // gifProgress will be driven by the onGifProgress callback now
      // (encoding happens AFTER stop, off the main thread).
    } else {
      canvasRef.current?.startGifRecording();
      setIsGifRecording(true);
      setGifStart(Date.now());
      setGifElapsed(0);
      setGifProgress(0);
    }
  }, [isGifRecording]);

  // When the canvas auto-stops GIF recording at the 15s cap, it calls this.
  // We just sync React state — the encode is already underway.
  const handleGifAutoStop = useCallback(() => {
    setIsGifRecording(false);
    setGifStart(null);
    setGifElapsed(0);
  }, []);

  // Fires once a PNG / MP4 / GIF download has been triggered. Shows the
  // "thanks" modal with the portfolio / coffee / hire links.
  const handleExport = useCallback(() => {
    setShowThanks(true);
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
        onToggleRecord={handleToggleRecord}
        isRecording={isRecording}
        recordElapsed={recordElapsed}
        onToggleGif={handleToggleGif}
        isGifRecording={isGifRecording}
        gifElapsed={gifElapsed}
        gifProgress={gifProgress}
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
            onGifProgress={setGifProgress}
            onGifAutoStop={handleGifAutoStop}
            onExport={handleExport}
          />
        )}
        {errorMsg && <div className="error-toast">{errorMsg}</div>}
      </main>

      <ThanksModal open={showThanks} onClose={() => setShowThanks(false)} />
    </div>
  );
}
