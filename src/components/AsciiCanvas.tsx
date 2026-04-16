// ============================================================
// AsciiCanvas.tsx — the component that owns the <canvas> and
// drives the render loop. Most of this wiring is borrowed from
// the original Ascii-Yourself project, with two fixes:
//   1) the render loop uses a ref for options, so moving sliders
//      doesn't tear down and restart the loop (smoother UX).
//   2) it supports both webcam AND uploaded image sources.
// ============================================================

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import type { AsciiOptions, SourceKind } from '../types';
import { renderAscii } from '../utils/asciiConverter';

// Tiny helper: given a URL (data: or blob:), prompt the browser to download
// it as a file. We reuse this for screenshots and video exports.
function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  // Firefox requires the link be in the DOM before click() works.
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// This is the "remote control" parents can use on us via a ref.
// screenshot    → save current frame as PNG
// startRecording → begin capturing the canvas to a video blob
// stopRecording  → finalize + trigger download
export interface AsciiCanvasHandle {
  screenshot: () => void;
  startRecording: () => void;
  stopRecording: () => void;
}

interface Props {
  source: SourceKind;      // 'webcam' | 'image' | 'none'
  imageSrc: string | null; // data URL or object URL when source === 'image'
  options: AsciiOptions;
  onError?: (msg: string) => void;
}

// forwardRef lets the parent attach a ref to this component
// (needed so the Controls sidebar can call screenshot()).
export const AsciiCanvas = forwardRef<AsciiCanvasHandle, Props>(
  ({ source, imageSrc, options, onError }, ref) => {
    // Visible output canvas — what the user sees.
    const outputRef = useRef<HTMLCanvasElement>(null);
    // Hidden processing canvas — tiny, sized in characters.
    const processingRef = useRef<HTMLCanvasElement>(null);
    // Video element for the webcam feed (kept in React state-free territory).
    const videoRef = useRef<HTMLVideoElement>(null);
    // Image element for uploaded pictures.
    const imgRef = useRef<HTMLImageElement>(null);

    // ---- The options ref trick ----
    // If we put `options` in the render-loop effect's deps, every slider tick
    // would tear down the loop and start a new one (jittery, wasteful).
    // Instead we stash options in a ref, update the ref on every render,
    // and the loop reads `optionsRef.current` each frame. One loop, live values.
    const optionsRef = useRef(options);
    optionsRef.current = options;

    // Track the chosen source in a ref too, so the single loop can tell
    // which element (video vs img) to feed into the converter this frame.
    const sourceRef = useRef(source);
    sourceRef.current = source;

    // For temporal smoothing (pixel LP filter across frames).
    // We keep last frame's *smoothed* pixel values and blend new frames in.
    const prevPixelsRef = useRef<Float32Array | null>(null);

    // MediaRecorder state — null when not recording.
    // We keep it in a ref (not state) because changing it shouldn't re-render.
    const recorderRef = useRef<MediaRecorder | null>(null);

    // ---- Resize the output canvas to fill its parent ----
    // Canvas is sneaky: the CSS size and the drawing buffer size are
    // two different things. We sync them here, and again on window resize.
    useEffect(() => {
      const sync = () => {
        const canvas = outputRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        // devicePixelRatio would give sharper text on retina, but costs CPU.
        // For ASCII, crispness is already baked into the font, so skip.
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        prevPixelsRef.current = null; // buffer size likely changed
      };
      sync();
      window.addEventListener('resize', sync);
      return () => window.removeEventListener('resize', sync);
    }, []);

    // ---- Webcam lifecycle: start when source='webcam', stop otherwise ----
    useEffect(() => {
      if (source !== 'webcam') return;
      let stream: MediaStream | null = null;
      let cancelled = false;

      (async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          const video = videoRef.current;
          if (!video) return;
          video.srcObject = stream;
          await video.play();
        } catch (err) {
          // Most common cause: user denied the permission prompt.
          onError?.('Could not access camera — check browser permissions.');
          console.error(err);
        }
      })();

      // Cleanup: stop the camera when we switch source or unmount.
      // Without this, the camera light stays on. Rude.
      return () => {
        cancelled = true;
        if (stream) stream.getTracks().forEach((t) => t.stop());
      };
    }, [source, onError]);

    // ---- Load uploaded image into the hidden <img> element ----
    useEffect(() => {
      if (source !== 'image' || !imageSrc) return;
      const img = imgRef.current;
      if (!img) return;
      img.src = imageSrc;
      // Reset smoothing so we don't blend the new image with the old one's buffer.
      prevPixelsRef.current = null;
    }, [source, imageSrc]);

    // ---- The render loop (one effect, runs forever) ----
    // Notice: deps are [] — it starts once, keeps running until unmount.
    // All the "live" values (options, source) come from refs.
    useEffect(() => {
      let rafId = 0;

      const tick = () => {
        const output = outputRef.current;
        const processing = processingRef.current;
        if (!output || !processing) {
          rafId = requestAnimationFrame(tick);
          return;
        }

        // Pick the current source element based on what the user chose.
        let src: CanvasImageSource | null = null;
        if (sourceRef.current === 'webcam') {
          const v = videoRef.current;
          // readyState >= 2 (HAVE_CURRENT_DATA) means the first frame is ready.
          if (v && v.readyState >= 2) src = v;
        } else if (sourceRef.current === 'image') {
          const i = imgRef.current;
          if (i && i.complete && i.naturalWidth > 0) src = i;
        }

        if (src) {
          // Render a frame. All the work lives in utils/asciiConverter.ts.
          renderAscii(
            { source: src, processingCanvas: processing, outputCanvas: output },
            optionsRef.current,
          );
        }

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(rafId);
        // Safety: if we unmount mid-recording, stop the recorder so we
        // don't leak a MediaStream or the blob we'd never finalize.
        recorderRef.current?.stop();
      };
    }, []);

    // ---- Imperative handle: expose methods to the parent via ref ----
    useImperativeHandle(ref, () => ({
      // The PNG literally IS the output canvas — toDataURL serializes it for us.
      screenshot: () => {
        const canvas = outputRef.current;
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        triggerDownload(url, `ascii-cam-${Date.now()}.png`);
      },

      // Record the visible canvas to a video file.
      // canvas.captureStream(fps) turns the canvas into a live MediaStream,
      // which MediaRecorder can encode on the fly. We collect chunks,
      // and on stop we glue them into a Blob and trigger a download.
      startRecording: () => {
        const canvas = outputRef.current;
        if (!canvas || recorderRef.current) return;

        const stream = canvas.captureStream(30); // 30 fps

        // Prefer MP4 (universal player support) over WebM. Color fidelity on
        // saturated neon shifts slightly under H.264 chroma subsampling, but
        // MP4 is what people expect — webm won't open in iMessage, Photos, etc.
        const candidates = [
          'video/mp4;codecs=h264',
          'video/mp4',
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
        ];
        const mime = candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
        // Bump bitrate to 8 Mbps so saturated colors (neon green on black!)
        // don't smear under chroma subsampling. Defaults are ~2.5 Mbps.
        const recorder = new MediaRecorder(stream, {
          ...(mime ? { mimeType: mime } : {}),
          videoBitsPerSecond: 8_000_000,
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          // e.data is a Blob chunk. Skip empty ones (happen on some browsers).
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const type = recorder.mimeType || mime || 'video/webm';
          const blob = new Blob(chunks, { type });
          const ext = type.includes('mp4') ? 'mp4' : 'webm';
          const url = URL.createObjectURL(blob);
          triggerDownload(url, `ascii-cam-${Date.now()}.${ext}`);
          URL.revokeObjectURL(url);
          recorderRef.current = null;
        };
        // start() with no args buffers everything; we also pass a timeslice
        // so dataavailable fires periodically (safer for long recordings).
        recorder.start(1000);
        recorderRef.current = recorder;
      },

      stopRecording: () => {
        // The onstop handler above does the actual download.
        recorderRef.current?.stop();
      },
    }));

    return (
      <div className="ascii-canvas-wrap">
        {/* Hidden: video source. Must be in DOM (not display:none) for
            some browsers to decode frames. We hide it off-screen instead. */}
        <video
          ref={videoRef}
          className="offscreen"
          playsInline
          autoPlay
          muted
        />
        {/* Hidden: image source for uploads. crossOrigin avoids tainting
            the canvas when a user pastes an https URL. */}
        <img ref={imgRef} className="offscreen" alt="" crossOrigin="anonymous" />
        {/* Hidden: the tiny processing canvas. display:none is fine here,
            because we never READ it visually, only sample its pixels. */}
        <canvas ref={processingRef} style={{ display: 'none' }} />
        {/* Visible: the output canvas the user actually sees. */}
        <canvas ref={outputRef} className="ascii-canvas" />
      </div>
    );
  },
);

AsciiCanvas.displayName = 'AsciiCanvas';
