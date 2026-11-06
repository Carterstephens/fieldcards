import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flashcard, type Prompt } from '../components/Flashcard.tsx';
import { setById, speciesById } from '../lib/data.ts';
import { href } from '../lib/router.ts';
import { pickSession, review, shuffle, type Grade } from '../lib/srs.ts';
import { setConfident, type PromptMode, type Store } from '../lib/storage.ts';
import type { Species } from '../types.ts';

interface Props {
  setId: string;
  store: Store;
  update: (fn: (s: Store) => Store) => void;
}

interface QueueItem {
  id: string;
  prompt: Prompt;
  requeued?: boolean;
}

function choosePrompt(s: Species, mode: PromptMode): Prompt {
  const photo = (): Prompt => ({ kind: 'photo', photo: Math.floor(Math.random() * s.photos.length) });
  const sound = (): Prompt => ({ kind: 'sound', audio: Math.floor(Math.random() * s.audio.length) });
  const hasPhoto = s.photos.length > 0;
  const hasSound = s.audio.length > 0;
  if (mode === 'sound') return hasSound ? sound() : photo();
  if (mode === 'mixed' && hasSound && hasPhoto) return Math.random() < 0.5 ? photo() : sound();
  return hasPhoto ? photo() : sound();
}

export function Study({ setId, store, update }: Props) {
  const set = setById.get(setId);
  const mode = store.prefs.prompt;

  const [queue, setQueue] = useState<QueueItem[]>(() => {
    if (!set) return [];
    const confident = new Set(store.confident);
    const usable = set.species.filter((id) => {
      const s = speciesById.get(id);
      return s && !confident.has(id) && (s.photos.length || s.audio.length);
    });
    // Whole set: every bird not marked confident, due or not.
    const ids = store.prefs.sessionSize === 0 ? shuffle(usable) : pickSession(usable, store.progress[setId] ?? {}, store.prefs.sessionSize);
    return ids.map((id) => ({
      id,
      prompt: choosePrompt(speciesById.get(id)!, mode),
    }));
  });
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState<Record<Grade | 'confident', number>>({ missed: 0, hard: 0, good: 0, confident: 0 });

  const current = queue[index];
  const species = current && speciesById.get(current.id);
  const done = index >= queue.length;

  const grade = useCallback(
    (g: Grade) => {
      if (!current || !flipped) return;
      update((s) => {
        const setProgress = s.progress[setId] ?? {};
        return {
          ...s,
          progress: { ...s.progress, [setId]: { ...setProgress, [current.id]: review(setProgress[current.id], g) } },
        };
      });
      setTally((t) => ({ ...t, [g]: t[g] + 1 }));
      // Missed cards come back once more at the end of the session.
      if (g === 'missed' && !current.requeued) {
        setQueue((q) => [...q, { ...current, requeued: true, prompt: choosePrompt(speciesById.get(current.id)!, mode) }]);
      }
      setFlipped(false);
      setIndex((i) => i + 1);
    },
    [current, flipped, mode, setId, update],
  );

  /** Take the bird out of rotation everywhere, including any requeued copy later in this session. */
  const markConfident = useCallback(() => {
    if (!current) return;
    update((s) => setConfident(s, [current.id], true));
    setTally((t) => ({ ...t, confident: t.confident + 1 }));
    setQueue((q) => q.filter((item, i) => i <= index || item.id !== current.id));
    setFlipped(false);
    setIndex((i) => i + 1);
  }, [current, index, update]);

  const move = useCallback(
    (delta: number) => {
      setFlipped(false);
      setIndex((i) => Math.max(0, Math.min(queue.length - 1, i + delta)));
    },
    [queue.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('audio, input, select, textarea')) return;
      if (done) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === '1') grade('missed');
      else if (e.key === '2') grade('hard');
      else if (e.key === '3') grade('good');
      else if (e.key === 'c' || e.key === 'C') markConfident();
      else if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, grade, markConfident, move]);

  const pct = useMemo(() => (queue.length ? Math.round((Math.min(index, queue.length) / queue.length) * 100) : 0), [index, queue.length]);

  if (!set) return <p>Set not found. <a href={href.home()}>Back to sets</a></p>;

  if (queue.length === 0) {
    return (
      <div className="empty">
        <p>No cards to study in this set yet.</p>
        <a className="btn" href={href.set(setId)}>Back to set</a>
      </div>
    );
  }

  if (done) {
    const total = tally.missed + tally.hard + tally.good;
    return (
      <div className="session-done">
        <h2>Session complete</h2>
        <p className="muted">{set.title}</p>
        <div className="tally">
          <div className="t-good"><strong>{tally.good}</strong>Got it</div>
          <div className="t-hard"><strong>{tally.hard}</strong>Hard</div>
          <div className="t-missed"><strong>{tally.missed}</strong>Missed</div>
          {tally.confident > 0 && <div className="t-conf"><strong>{tally.confident}</strong>Confident</div>}
        </div>
        <p className="muted">
          {total} reviews. Missed birds will come up first next time.
          {tally.confident > 0 && ' You can restore confident birds from the Confident tab on the set page.'}
        </p>
        <div className="row">
          <button className="btn primary" onClick={() => location.reload()}>Study again</button>
          <a className="btn" href={href.set(setId)}>Back to set</a>
        </div>
      </div>
    );
  }

  return (
    <div className="study">
      <div className="study-top">
        <a href={href.set(setId)} className="back">← {set.title}</a>
        <span className="muted">
          {index + 1} / {queue.length}
        </span>
      </div>
      <div className="progress" aria-hidden>
        <div style={{ width: `${pct}%` }} />
      </div>

      {species && (
        <div key={`${index}-${flipped}`} className="flip-in">
          <Flashcard species={species} prompt={current.prompt} flipped={flipped} />
        </div>
      )}

      <div className="confident-row">
        <button className="btn confident" onClick={markConfident} title="Remove this bird from study in every set until you restore it">
          ✓ Confident <kbd>C</kbd>
        </button>
      </div>

      <div className="controls">
        {flipped ? (
          <>
            <button className="btn grade missed" onClick={() => grade('missed')}>
              Missed <kbd>1</kbd>
            </button>
            <button className="btn grade hard" onClick={() => grade('hard')}>
              Hard <kbd>2</kbd>
            </button>
            <button className="btn grade good" onClick={() => grade('good')}>
              Got it <kbd>3</kbd>
            </button>
          </>
        ) : (
          <>
            <button className="btn ghost" onClick={() => move(-1)} disabled={index === 0} aria-label="Previous card">←</button>
            <button className="btn primary wide" onClick={() => setFlipped(true)}>
              Reveal <kbd>Space</kbd>
            </button>
            <button className="btn ghost" onClick={() => move(1)} disabled={index >= queue.length - 1} aria-label="Next card">→</button>
          </>
        )}
      </div>
    </div>
  );
}
