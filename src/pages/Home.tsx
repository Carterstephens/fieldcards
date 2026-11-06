import { MasteryBar } from '../components/MasteryBar.tsx';
import { sets, species } from '../lib/data.ts';
import { href } from '../lib/router.ts';
import { boxCounts } from '../lib/srs.ts';
import type { Store } from '../lib/storage.ts';
import type { BirdSet } from '../types.ts';

function SetCard({ set, store }: { set: BirdSet; store: Store }) {
  const counts = boxCounts(set.species, store.progress[set.id] ?? {}, store.confident);
  const started = counts.new < set.species.length;
  return (
    <a className="set-card" href={href.set(set.id)}>
      <span className="set-icon" aria-hidden>{set.icon}</span>
      <h3>{set.title}</h3>
      <p className="muted">{set.description}</p>
      <div className="set-foot">
        <span>{set.species.length} species</span>
        {started && counts.due > 0 && <span className="due-pill">{counts.due} due</span>}
      </div>
      {started && <MasteryBar counts={counts} total={set.species.length} />}
    </a>
  );
}

export function Home({ store }: { store: Store }) {
  const groups = [...new Set(sets.map((s) => s.group))];
  return (
    <div className="home">
      <section className="hero">
        <h1>Learn the birds of North America</h1>
        <p className="muted">
          {species.length} native species across {sets.length} sets, from backyard feeders to offshore seabirds and Hawaiʻi's
          honeycreepers. Study by photo or by song; the flashcards bring back the birds you miss, and you can set aside the ones you
          already know.
        </p>
        {store.confident.length > 0 && <p className="muted small">✓ {store.confident.length} birds marked confident.</p>}
      </section>
      {groups.map((group) => (
        <section key={group} className="set-group">
          <h2 className="group-title">{group}</h2>
          <ul className="set-grid">
            {sets
              .filter((s) => s.group === group)
              .map((set) => (
                <li key={set.id}>
                  <SetCard set={set} store={store} />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
