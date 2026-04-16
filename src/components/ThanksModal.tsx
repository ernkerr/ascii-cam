// ============================================================
// ThanksModal.tsx — the small "nice one" popup shown after the
// user downloads an export. Lightweight, non-blocking, with one
// or two links the user can click to learn more / tip / hire.
// ============================================================

// Replace with real URLs. Leave any link empty ('') to hide that button.
const LINKS = {
  more: 'https://erinkerr.me',                   // portfolio / more projects
  coffee: 'https://buymeacoffee.com/ernkerr',    // tip jar
  contact: 'https://cybergoose.org',             // "hire me"
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ThanksModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    // Click backdrop to dismiss. The inner stopPropagation keeps clicks
    // inside the card from bubbling up and closing it.
    <div className="thanks-backdrop" onClick={onClose}>
      <div
        className="thanks-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2>support your local dev</h2>
        <p>
          <strong>ascii-cam</strong> is free and always will be. no ads,
          no signups. if you had fun, here's how to say hi.
        </p>
        <div className="thanks-links">
          {LINKS.more && (
            <a href={LINKS.more} target="_blank" rel="noreferrer" className="btn">
              More projects
            </a>
          )}
          {LINKS.coffee && (
            <a href={LINKS.coffee} target="_blank" rel="noreferrer" className="btn">
              Buy me a coffee
            </a>
          )}
          {LINKS.contact && (
            <a href={LINKS.contact} className="btn">
              Work with me
            </a>
          )}
        </div>
        <button className="thanks-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
    </div>
  );
}
