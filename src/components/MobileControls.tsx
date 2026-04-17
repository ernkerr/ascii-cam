// ============================================================
// MobileControls.tsx — bottom chip bar for mobile (≤640px).
//
// Renders every adjustment as a horizontally-scrolling chip. Chips for
// sliders pop up a small control strip above the chip row when tapped.
// Chips for color/char-set click hidden native inputs to surface the
// system picker. Toggle chips just toggle on tap.
//
// CSS hides this on desktop; the regular Controls sidebar handles those.
// ============================================================

import {
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import type { AsciiOptions, CharSetKey, SourceKind } from '../types';
import { CHAR_SET_KEYS, CHAR_SET_LABELS } from '../constants/charSets';

type Slider = 'contrast' | 'brightness' | 'size';

interface Props {
  options: AsciiOptions;
  setOptions: (updater: (prev: AsciiOptions) => AsciiOptions) => void;
  source: SourceKind;
  onPickWebcam: () => void;
  onPickImage: (file: File) => void;
}

export function MobileControls({
  options,
  setOptions,
  source,
  onPickWebcam,
  onPickImage,
}: Props) {
  // Which slider, if any, is expanded above the chip row.
  const [activeSlider, setActiveSlider] = useState<Slider | null>(null);

  // Refs to hidden native inputs we trigger via chip taps. Lets us reuse
  // the system color/file/select pickers without rebuilding them ourselves.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const charSelectRef = useRef<HTMLSelectElement>(null);

  const update = <K extends keyof AsciiOptions>(key: K, value: AsciiOptions[K]) =>
    setOptions((prev) => ({ ...prev, [key]: value }));

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPickImage(file);
    e.target.value = '';
  };

  const toggleSlider = (s: Slider) =>
    setActiveSlider((prev) => (prev === s ? null : s));

  return (
    <div className="m-controls">
      {/* Active slider popover — only renders when one's selected. */}
      {activeSlider && (
        <div className="m-slider-strip">
          <SliderStrip
            label={
              activeSlider === 'contrast'
                ? 'Contrast'
                : activeSlider === 'brightness'
                  ? 'Brightness'
                  : 'Char size'
            }
            value={
              activeSlider === 'contrast'
                ? options.contrast
                : activeSlider === 'brightness'
                  ? options.brightness
                  : options.fontSize
            }
            min={activeSlider === 'size' ? 6 : -1}
            max={activeSlider === 'contrast' ? 2 : activeSlider === 'size' ? 28 : 1}
            step={activeSlider === 'size' ? 1 : 0.01}
            onChange={(v) =>
              activeSlider === 'contrast'
                ? update('contrast', v)
                : activeSlider === 'brightness'
                  ? update('brightness', v)
                  : update('fontSize', v)
            }
            onClose={() => setActiveSlider(null)}
          />
        </div>
      )}

      {/* The horizontally-scrolling chip row. */}
      <div className="m-chips">
        {/* Source */}
        <Chip
          label="webcam"
          active={source === 'webcam'}
          onClick={onPickWebcam}
        />
        <Chip label="upload" onClick={() => fileInputRef.current?.click()} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="m-hidden-input"
        />

        {/* Characters — chip taps open the native <select> picker */}
        <Chip label="chars" onClick={() => charSelectRef.current?.click()} />
        <select
          ref={charSelectRef}
          className="m-hidden-input"
          value={options.charSetKey}
          onChange={(e) => update('charSetKey', e.target.value as CharSetKey)}
        >
          {CHAR_SET_KEYS.map((k) => (
            <option key={k} value={k}>
              {CHAR_SET_LABELS[k]}
            </option>
          ))}
        </select>

        {/* Colors — chips wrap a hidden color input + show a swatch */}
        <SwatchChip
          label="color"
          color={options.color}
          inputRef={colorInputRef}
        />
        <input
          ref={colorInputRef}
          type="color"
          className="m-hidden-input"
          value={options.color}
          onChange={(e) => update('color', e.target.value)}
        />
        <SwatchChip label="bg" color={options.background} inputRef={bgInputRef} />
        <input
          ref={bgInputRef}
          type="color"
          className="m-hidden-input"
          value={options.background}
          onChange={(e) => update('background', e.target.value)}
        />

        {/* Sliders — toggle the strip above */}
        <Chip
          label="contrast"
          active={activeSlider === 'contrast'}
          onClick={() => toggleSlider('contrast')}
        />
        <Chip
          label="bright"
          active={activeSlider === 'brightness'}
          onClick={() => toggleSlider('brightness')}
        />
        <Chip
          label="size"
          active={activeSlider === 'size'}
          onClick={() => toggleSlider('size')}
        />

        {/* Toggles */}
        <Chip
          label="mirror"
          active={options.mirror}
          onClick={() => update('mirror', !options.mirror)}
        />
        <Chip
          label="invert"
          active={options.invert}
          onClick={() => update('invert', !options.invert)}
        />
        <Chip
          label="portrait"
          active={options.orientation === 'portrait'}
          onClick={() =>
            update(
              'orientation',
              options.orientation === 'portrait' ? 'auto' : 'portrait',
            )
          }
        />
        <Chip
          label="land"
          active={options.orientation === 'landscape'}
          onClick={() =>
            update(
              'orientation',
              options.orientation === 'landscape' ? 'auto' : 'landscape',
            )
          }
        />
      </div>
    </div>
  );
}

function Chip(props: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={props.active ? 'm-chip active' : 'm-chip'}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

// Chip with a small color swatch — taps the hidden color input via the ref.
function SwatchChip(props: {
  label: string;
  color: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <button
      type="button"
      className="m-chip"
      onClick={() => props.inputRef.current?.click()}
    >
      <span className="m-swatch" style={{ background: props.color }} />
      {props.label}
    </button>
  );
}

function SliderStrip(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="m-slider">
      <div className="m-slider-head">
        <span>{props.label}</span>
        <span className="m-slider-val">{props.value.toFixed(2)}</span>
        <button className="m-slider-close" onClick={props.onClose} aria-label="Close">
          ×
        </button>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(+e.target.value)}
      />
    </div>
  );
}
