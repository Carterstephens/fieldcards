import { useState } from 'react';
import { MasteryBar } from '../components/MasteryBar.tsx';
import { SpeciesModal } from '../components/SpeciesModal.tsx';
import { setById, speciesById } from '../lib/data.ts';
import { href } from '../lib/router.ts';
import { boxCounts } from '../lib/srs.ts';
import { setConfident, type PromptMode, type Store } from '../lib/storage.ts';
import type { Species } from '../types.ts';

interface Props {
  setId: string;
  store: Store;
  update: (fn: (s: Store) => Store) => void;
}

const modes: { id: PromptMode; label: string; hint: string }[] = [
  { id: 'photo', label: '📷 Photo', hint: 'Identify by sight' },
  { id: 'sound', label: '🎧 Sound', hint: 'Identify by ear' },
  { id: 'mixed', label: '🔀 Mixed', hint: 'A bit of both' },
];

function Thumb({ bird }: { bird: Species }) {
  return bird.photos[0] ? <img src={bird.photos[0].url} alt="" loading="lazy" /> : <div className="no-photo">🐦</div>;
}

export function SetDetail({ setId, store, update }: Props) {
  const set = setById.get(setId);
  const [tab, setTab] = useState<'studying' | 'confident'>('studying');
  const [confirmReset, setConfirmReset] = useState(false);
  // Index into the current tab's list; null when no bird is open.
  const [open, setOpen] = useState<number | null>(null);
  if (!set) return <p>Set not found. <a href={href.home()}>Back to sets</a></p>;

  const progress = store.progress[setId] ?? {};
  const confidentIds = new Set(store.confident);
  const counts = boxCounts(set.species, progress, store.confident);
  const birds = set.species.map((id) => speciesById.get(id)!).filter(Boolean);
  const studying = birds.filter((b) => !confidentIds.has(b.id));
  const confident = birds.filter((b) => confidentIds.has(b.id));
  const withSound = birds.filter((b) => b.audio.length).length;

  const setPrefs = (p: Partial<Store['prefs']>) => update((s) => ({ ...s, prefs: { ...s.prefs, ...p } }));
  const toggleConfident = (id: string, value: boolean) => update((s) => setConfident(s, [id], value));
  const shown = tab === 'studying' ? studying : confident;
  const switchTab = (t: typeof tab) => {
    setTab(t);
    setOpen(null);
  };
  const birdButton = (bird: Species, i: number) => (
    <button className="bird-open" onClick={() => setOpen(i)} aria-label={`Open ${bird.common} details`}>
      <Thumb bird={bird} />
      <div>
        <strong>{bird.common}</strong>
        <em>{bird.scientific}</em>
      </div>
    </button>
  );

  return (
    <div className="set-detail">
      <a href={href.home()} className="back">← All sets</a>
      <header className="set-head">
        <span className="set-icon" aria-hidden>{set.icon}</span>
        <div>
          <h1>{set.title}</h1>
          <p className="muted">
            {set.description} {birds.length} species, {withSound} with recordings.
          </p>
        </div>
      </header>

      <section className="panel">
        <MasteryBar counts={counts} total={birds.length} />
        <p className="muted small">
          {counts.new} new · {counts.due} due for review · {counts.boxes[3] + counts.boxes[4]} mastered · {counts.confident} confident
        </p>

        <div className="study-options">
          <div className="segmented" role="radiogroup" aria-label="Card front">
            {modes.map((m) => (
              <button
                key={m.id}
                role="radio"
                aria-checked={store.prefs.prompt === m.id}
                className={store.prefs.prompt === m.id ? 'active' : ''}
                onClick={() => setPrefs({ prompt: m.id })}
                title={m.hint}
              >
                {m.label}
              </button>
            ))}
          </div>
          <label className="size-select">
            Cards per session
            <select value={store.prefs.sessionSize} onChange={(e) => setPrefs({ sessionSize: Number(e.target.value) })}>
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
              <option value={0}>Whole set ({studying.length})</option>
            </select>
          </label>
          {studying.length > 0 ? (
            <a className="btn primary" href={href.study(setId)}>Study flashcards</a>
          ) : (
            <span className="muted small">You're confident on every bird here. Restore some to keep studying.</span>
          )}
        </div>
      </section>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'studying'} className={tab === 'studying' ? 'active' : ''} onClick={() => switchTab('studying')}>
          Studying <span className="count">{studying.length}</span>
        </button>
        <button role="tab" aria-selected={tab === 'confident'} className={tab === 'confident' ? 'active' : ''} onClick={() => switchTab('confident')}>
          ✓ Confident <span className="count">{confident.length}</span>
        </button>
      </div>

      {tab === 'studying' ? (
        <ul className="species-grid">
          {studying.map((b, i) => {
            const st = progress[b.id];
            return (
              <li key={b.id}>
                {birdButton(b, i)}
                <span className={`box-badge b${st?.box ?? 0}`} title={st ? `Box ${st.box} of 5` : 'Not studied yet'}>
                  {st ? st.box : 'new'}
                </span>
                <button className="mark-conf" onClick={() => toggleConfident(b.id, true)} title="Mark as confident" aria-label={`Mark ${b.common} as confident`}>
                  ✓
                </button>
              </li>
            );
          })}
        </ul>
      ) : confident.length === 0 ? (
        <p className="muted empty-tab">
          No confident birds yet. Press <strong>✓ Confident</strong> during study, or use the ✓ in the Studying list, to set aside birds
          you already know.
        </p>
      ) : (
        <>
          <p className="muted small">
            These birds are skipped in every set. Uncheck a bird to return it to your study pile.{' '}
            <button className="link-btn" onClick={() => update((s) => setConfident(s, confident.map((b) => b.id), false))}>
              Restore all
            </button>
          </p>
          <ul className="species-grid">
            {confident.map((b, i) => (
              <li key={b.id} className="conf-item">
                <input
                  type="checkbox"
                  checked
                  onChange={() => toggleConfident(b.id, false)}
                  aria-label={`Return ${b.common} to study`}
                  title="Uncheck to return to study"
                />
                {birdButton(b, i)}
              </li>
            ))}
          </ul>
        </>
      )}

      {open !== null && shown.length > 0 && (
        <SpeciesModal birds={shown} index={Math.min(open, shown.length - 1)} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}

      <div className="reset">
        {confirmReset ? (
          <>
            <span>Clear review progress for this set? (Confident birds are kept.)</span>
            <button
              className="btn danger"
              onClick={() => {
                update((s) => {
                  const { [setId]: _, ...rest } = s.progress;
                  return { ...s, progress: rest };
                });
                setConfirmReset(false);
              }}
            >
              Yes, reset
            </button>
            <button className="btn ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
          </>
        ) : (
          <button className="btn ghost" onClick={() => setConfirmReset(true)} disabled={!Object.keys(progress).length}>
            Reset progress
          </button>
        )}
      </div>
    </div>
  );
}
