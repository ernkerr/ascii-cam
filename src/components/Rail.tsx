// ============================================================
// Rail.tsx — the action rail.
// Hidden on desktop (display:none), shown on mobile as a horizontal
// bottom bar. Extracted from Controls so it can sit outside the
// sliding sidebar panel and stay visible when the panel is closed.
// ============================================================

import type { SourceKind } from '../types';

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  source: SourceKind;
  onScreenshot: () => void;
  onToggleRecord: () => void;
  isRecording: boolean;
  recordElapsed: number;
  onToggleGif: () => void;
  isGifRecording: boolean;
  gifElapsed: number;
  gifProgress: number;
}

export function Rail({
  source,
  onScreenshot,
  onToggleRecord,
  isRecording,
  recordElapsed,
  onToggleGif,
  isGifRecording,
  gifElapsed,
  gifProgress,
}: Props) {
  return (
    <nav className="rail" aria-label="Actions">
      <button
        className="rail-btn"
        onClick={onScreenshot}
        disabled={source === 'none'}
        aria-label="Save PNG"
        title="Save PNG"
      >
        png
      </button>
      <button
        className={isRecording ? 'rail-btn recording' : 'rail-btn'}
        onClick={onToggleRecord}
        disabled={source === 'none' || isGifRecording}
        aria-label={isRecording ? 'Stop recording' : 'Record MP4'}
        title={isRecording ? 'Stop' : 'MP4'}
      >
        {isRecording ? (
          <>
            <span className="rec-dot" />
            <span className="rail-time">{formatElapsed(recordElapsed)}</span>
          </>
        ) : (
          'mp4'
        )}
      </button>
      <button
        className={isGifRecording ? 'rail-btn recording' : 'rail-btn'}
        onClick={onToggleGif}
        disabled={source === 'none' || isRecording || gifProgress > 0}
        aria-label={isGifRecording ? 'Stop GIF' : 'Record GIF'}
        title={isGifRecording ? 'Stop' : 'GIF'}
      >
        {isGifRecording ? (
          <>
            <span className="rec-dot" />
            <span className="rail-time">{formatElapsed(gifElapsed)}</span>
          </>
        ) : gifProgress > 0 ? (
          `${Math.round(gifProgress * 100)}%`
        ) : (
          'gif'
        )}
      </button>
    </nav>
  );
}
