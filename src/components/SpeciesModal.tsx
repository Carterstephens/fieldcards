import { useEffect, useRef } from 'react';
import type { Species } from '../types.ts';
import { Flashcard } from './Flashcard.tsx';

interface Props {
  birds: Species[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}

/** Full species card over the set page, with prev/next to browse the list. */
export function SpeciesModal({ birds, index, onIndex, onClose }: Props) {
  const bird = birds[index];
  const panel = useRef<HTMLDivElement>(null);
  const move = (d: number) => onIndex((index + d + birds.length) % birds.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // An enlarged photo or map handles its own Escape.
      if (document.querySelector('.lightbox')) return;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    panel.current?.scrollTo(0, 0);
    panel.current?.focus();
  }, [index]);

  if (!bird) return null;
  return (
    <div className="species-modal" onClick={onClose}>
      <div
        className="species-modal-panel"
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={bird.common}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="species-modal-bar">
          <button className="btn ghost" onClick={() => move(-1)} disabled={birds.length < 2} aria-label="Previous bird">
            ←
          </button>
          <span className="muted small">
            {index + 1} of {birds.length}
          </span>
          <button className="btn ghost" onClick={() => move(1)} disabled={birds.length < 2} aria-label="Next bird">
            →
          </button>
          <button className="species-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <Flashcard key={bird.id} species={bird} prompt={{ kind: 'photo', photo: 0 }} flipped />
      </div>
    </div>
  );
}
