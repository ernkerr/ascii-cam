// ============================================================
// MobileControls.tsx — bottom chip bar for mobile (≤640px).
//
// Renders every adjustment as a chip in a horizontally-scrolling row.
// Slider chips pop a slim slider strip above the row when tapped.
// Color and file chips wrap the corresponding native input in a <label>
// so a tap surfaces the system picker (programmatic .click() on a hidden
// input is unreliable on iOS — labels are the documented workaround).
// The character-set chip is a styled <select> for the same reason.
// ============================================================

import {
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
  const [activeSlider, setActiveSlider] = useState<Slider | null>(null);

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

      <div className="m-chips">
        {/* ---- Source ---- */}
        <Chip
          label="webcam"
          active={source === 'webcam'}
          onClick={onPickWebcam}
        />
        {/* File-input via label is the iOS-reliable picker trigger. */}
        <label className="m-chip">
          upload
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="m-input-overlay"
          />
        </label>

        {/* ---- Characters: a styled <select> shows native picker on tap. */}
        <select
          className="m-chip m-chip-select"
          value={options.charSetKey}
          onChange={(e) => update('charSetKey', e.target.value as CharSetKey)}
        >
          {CHAR_SET_KEYS.map((k) => (
            <option key={k} value={k}>
              {CHAR_SET_LABELS[k]}
            </option>
          ))}
        </select>

        {/* ---- Colors: <label> wrapping native color input. */}
        <label className="m-chip">
          <span className="m-swatch" style={{ background: options.color }} />
          color
          <input
            type="color"
            value={options.color}
            onChange={(e) => update('color', e.target.value)}
            className="m-input-overlay"
          />
        </label>
        <label className="m-chip">
          <span className="m-swatch" style={{ background: options.background }} />
          bg
          <input
            type="color"
            value={options.background}
            onChange={(e) => update('background', e.target.value)}
            className="m-input-overlay"
          />
        </label>

        {/* ---- Sliders ---- */}
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

        {/* ---- Toggles ---- */}
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
        <button
          className="m-slider-close"
          onClick={props.onClose}
          aria-label="Close"
        >
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
