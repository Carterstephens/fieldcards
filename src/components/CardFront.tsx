import { useCallback, useEffect, useRef, useState } from 'react';
import type { Species } from '../types.ts';
import type { Prompt } from './Flashcard.tsx';
import { Attribution } from './Media.tsx';

/**
 * The unrevealed side of a card. Lets the user browse every photo and play every
 * recording without showing the bird's name. Keys: P = next photo, L = play/pause.
 */
export function CardFront({ species: s, prompt }: { species: Species; prompt: Prompt }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [photo, setPhoto] = useState(prompt.kind === 'photo' ? prompt.photo : 0);
  const [showPhotos, setShowPhotos] = useState(prompt.kind === 'photo');
  const [rec, setRec] = useState(prompt.kind === 'sound' ? prompt.audio : 0);
  const [playing, setPlaying] = useState(false);
  const photoCount = s.photos.length;

  const step = useCallback((delta: number) => setPhoto((p) => (p + delta + photoCount) % photoCount), [photoCount]);

  const play = useCallback(
    (i: number) => {
      const el = audioRef.current;
      if (!el || !s.audio[i]) return;
      if (i === rec && el.src && !el.paused) {
        el.pause();
        return;
      }
      if (i !== rec || !el.src) el.src = s.audio[i].url;
      setRec(i);
      el.play().catch(() => setPlaying(false));
    },
    [rec, s.audio],
  );

  // Sound cards start playing right away (browsers may block this until the first click).
  useEffect(() => {
    const el = audioRef.current;
    if (prompt.kind === 'sound' && el) {
      el.src = s.audio[prompt.audio].url;
      el.play().catch(() => setPlaying(false));
    }
    return () => el?.pause();
  }, [prompt, s.audio]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, select, textarea')) return;
      if ((e.key === 'p' || e.key === 'P') && showPhotos && photoCount > 1) step(1);
      else if ((e.key === 'l' || e.key === 'L') && s.audio.length) play(rec);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [photoCount, play, rec, s.audio.length, showPhotos, step]);

  const current = s.photos[photo];

  return (
    <div className="card card-front">
      {showPhotos && current ? (
        <figure className="front-photo">
          <div className="front-photo-frame">
            <img src={current.url} alt={`Mystery bird, photo ${photo + 1} of ${photoCount}`} />
            {photoCount > 1 && (
              <>
                <button className="photo-nav prev" onClick={() => step(-1)} aria-label="Previous photo">‹</button>
                <button className="photo-nav next" onClick={() => step(1)} aria-label="Next photo">›</button>
                <span className="photo-count">{photo + 1} / {photoCount}</span>
              </>
            )}
          </div>
          <Attribution credit={current} icon="📷" />
        </figure>
      ) : (
        <div className="sound-prompt">
          <button className={`play ${playing ? 'is-playing' : ''}`} onClick={() => play(rec)} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? '❚❚' : '▶'}
          </button>
          <p className="muted">Listen. Who's singing?</p>
        </div>
      )}

      {s.audio.length > 0 && (
        <div className="front-recordings" aria-label="Recordings">
          {s.audio.map((r, i) => (
            <button
              key={r.url}
              className={`rec-chip ${i === rec && playing ? 'active' : ''}`}
              onClick={() => play(i)}
              title={`${r.author} · ${r.license}`}
            >
              {i === rec && playing ? '❚❚' : '▶'} Recording {i + 1}
            </button>
          ))}
        </div>
      )}

      {!showPhotos && photoCount > 0 && (
        <button className="link-btn hint-btn" onClick={() => setShowPhotos(true)}>
          Show photos (hint)
        </button>
      )}

      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      <p className="flip-hint">
        <kbd>Space</kbd> reveal
        {showPhotos && photoCount > 1 && <> · <kbd>P</kbd> next photo</>}
        {s.audio.length > 0 && <> · <kbd>L</kbd> play/pause</>}
      </p>
    </div>
  );
}
