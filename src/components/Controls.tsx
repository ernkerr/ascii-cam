// ============================================================
// Controls.tsx — the left sidebar: source picker, color pickers,
// sliders, character set dropdown, screenshot button.
//
// This component is "dumb": it receives the current options and
// a setter from the parent, and calls the setter on every change.
// All the live logic lives in App / AsciiCanvas.
// ============================================================

import type { ChangeEvent } from 'react';
import type { AsciiOptions, CharSetKey, SourceKind } from '../types';
import { CHAR_SET_KEYS, CHAR_SET_LABELS } from '../constants/charSets';

interface Props {
  options: AsciiOptions;
  // A "functional setState-style" setter: receives old options, returns new.
  // This pattern lets callers change one field without clobbering the rest.
  setOptions: (updater: (prev: AsciiOptions) => AsciiOptions) => void;
  source: SourceKind;
  onPickWebcam: () => void;
  onPickImage: (file: File) => void;
  onScreenshot: () => void;
  onToggleRecord: () => void;
  isRecording: boolean;
  recordElapsed: number; // milliseconds
  onToggleGif: () => void;
  isGifRecording: boolean;
  gifElapsed: number;
  gifProgress: number; // 0..1 during post-stop encoding
}

// Formats a millisecond count as m:ss, e.g. "0:04" — for the record timer.
function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Controls({
  options,
  setOptions,
  source,
  onPickWebcam,
  onPickImage,
  onScreenshot,
  onToggleRecord,
  isRecording,
  recordElapsed,
  onToggleGif,
  isGifRecording,
  gifElapsed,
  gifProgress,
}: Props) {
  // Tiny helper: update ONE field of options. Saves repeating the spread.
  const update = <K extends keyof AsciiOptions>(key: K, value: AsciiOptions[K]) =>
    setOptions((prev) => ({ ...prev, [key]: value }));

  // File input handler — grab the first file the user picked and hand it up.
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPickImage(file);
    // Reset the input so picking the *same* file again still fires onChange.
    e.target.value = '';
  };

  return (
    <aside className="controls">
      <div className="controls-panel">
      <header className="controls-header">
        <h1>ascii-cam</h1>
        <p className="subtitle">pixels → characters</p>
      </header>

      {/* ---- SOURCE ---- */}
      <section className="control-group">
        <h2>Source</h2>
        <div className="button-row">
          <button
            className={source === 'webcam' ? 'btn active' : 'btn'}
            onClick={onPickWebcam}
          >
            Webcam
          </button>
          {/* The label wraps a hidden file input — clicking the label
              opens the file picker, but we get to style the label freely. */}
          <label className={source === 'image' ? 'btn active' : 'btn'}>
            Upload image
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </section>

      {/* ---- CHARACTERS ---- */}
      <section className="control-group">
        <h2>Characters</h2>
        <select
          value={options.charSetKey}
          onChange={(e) => update('charSetKey', e.target.value as CharSetKey)}
        >
          {CHAR_SET_KEYS.map((key) => (
            <option key={key} value={key}>
              {CHAR_SET_LABELS[key]}
            </option>
          ))}
        </select>
        {/* Only show the custom input when 'custom' is picked. */}
        {options.charSetKey === 'custom' && (
          <input
            type="text"
            className="text-input"
            placeholder="Type chars, dark → light"
            value={options.customChars}
            onChange={(e) => update('customChars', e.target.value)}
          />
        )}
      </section>

      {/* ---- COLORS ---- */}
      <section className="control-group">
        <h2>Colors</h2>
        <div className="color-row">
          <label>
            <span>Text</span>
            <input
              type="color"
              value={options.color}
              onChange={(e) => update('color', e.target.value)}
            />
          </label>
          <label>
            <span>Background</span>
            <input
              type="color"
              value={options.background}
              onChange={(e) => update('background', e.target.value)}
            />
          </label>
        </div>
      </section>

      {/* ---- SLIDERS ---- */}
      <section className="control-group">
        <h2>Adjustments</h2>

        <Slider
          label="Contrast"
          // -1 = very flat/gray, 0 = neutral, 2 = near-binary.
          // Wider-than-unit range lets the slider push into heavy contrast
          // without the formula blowing up (see asciiConverter.ts).
          min={-1}
          max={2}
          step={0.01}
          value={options.contrast}
          onChange={(v) => update('contrast', v)}
        />
        <Slider
          label="Brightness"
          min={-1}
          max={1}
          step={0.01}
          value={options.brightness}
          onChange={(v) => update('brightness', v)}
        />
        <Slider
          label="Char size"
          // fontSize in pixels. Smaller = more characters on screen = more detail.
          // 6..28 feels best — below 6 the glyphs get muddy; above 28 they're
          // so chunky the image is barely recognizable.
          min={6}
          max={28}
          step={1}
          value={options.fontSize}
          onChange={(v) => update('fontSize', v)}
        />
      </section>

      {/* ---- TOGGLES ---- */}
      <section className="control-group">
        <h2>Options</h2>
        {/* 2×2 grid: Mirror | Invert (row 1), Portrait | Landscape (row 2).
            button-row is a 2-column grid, so 4 children naturally form 2x2. */}
        <div className="button-row">
          <button
            type="button"
            aria-pressed={options.mirror}
            className={options.mirror ? 'btn active' : 'btn'}
            onClick={() => update('mirror', !options.mirror)}
          >
            Mirror
          </button>
          <button
            type="button"
            aria-pressed={options.invert}
            className={options.invert ? 'btn active' : 'btn'}
            onClick={() => update('invert', !options.invert)}
          >
            Invert
          </button>
          {/* Portrait / Landscape are mutually exclusive — clicking the
              active one deactivates it (back to auto/no crop). */}
          <button
            type="button"
            aria-pressed={options.orientation === 'portrait'}
            className={options.orientation === 'portrait' ? 'btn active' : 'btn'}
            onClick={() =>
              update(
                'orientation',
                options.orientation === 'portrait' ? 'auto' : 'portrait',
              )
            }
          >
            Portrait
          </button>
          <button
            type="button"
            aria-pressed={options.orientation === 'landscape'}
            className={options.orientation === 'landscape' ? 'btn active' : 'btn'}
            onClick={() =>
              update(
                'orientation',
                options.orientation === 'landscape' ? 'auto' : 'landscape',
              )
            }
          >
            Landscape
          </button>
        </div>
      </section>

        {/* ---- ACTIONS (desktop layout — rail handles these on mobile) ---- */}
        <section className="control-group">
          <div className="button-row">
            <button
              className={isRecording ? 'btn record recording' : 'btn record'}
              onClick={onToggleRecord}
              disabled={source === 'none' || isGifRecording}
            >
              {isRecording ? (
                <>
                  <span className="rec-dot" /> Stop {formatElapsed(recordElapsed)}
                </>
              ) : (
                <>
                  <span className="rec-dot idle" /> MP4
                </>
              )}
            </button>
            <button
              className={isGifRecording ? 'btn record recording' : 'btn record'}
              onClick={onToggleGif}
              disabled={source === 'none' || isRecording || gifProgress > 0}
            >
              {isGifRecording ? (
                <>
                  <span className="rec-dot" /> Stop {formatElapsed(gifElapsed)}
                </>
              ) : gifProgress > 0 ? (
                <>Encoding {Math.round(gifProgress * 100)}%</>
              ) : (
                <>
                  <span className="rec-dot idle" /> GIF
                </>
              )}
            </button>
          </div>
          <button
            className="btn primary full-width"
            onClick={onScreenshot}
            disabled={source === 'none'}
          >
            Save PNG
          </button>
        </section>
      </div>
    </aside>
  );
}

// Sub-component: a labeled range slider that reports its numeric value.
// Keeping it here (same file) since it's only used in Controls.
function Slider(props: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="slider">
      <div className="slider-top">
        <span>{props.label}</span>
        {/* Show the current value so the user has feedback as they drag. */}
        <span className="slider-value">{props.value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        // +e.target.value converts the string to a number.
        onChange={(e) => props.onChange(+e.target.value)}
      />
    </label>
  );
}
