import type { Species } from '../types.ts';
import { CardFront } from './CardFront.tsx';
import { AudioPlayer, PhotoCarousel, RangeMapThumb } from './Media.tsx';

export type Prompt = { kind: 'photo'; photo: number } | { kind: 'sound'; audio: number };

interface Props {
  species: Species;
  prompt: Prompt;
  flipped: boolean;
}

export function Flashcard({ species: s, prompt, flipped }: Props) {
  if (!flipped) return <CardFront species={s} prompt={prompt} />;

  return (
    <article className="card card-back">
      <header className="answer">
        <h2>{s.common}</h2>
        <p>
          <em>{s.scientific}</em> <span className="muted">· {s.family}</span>
        </p>
      </header>

      <div className="back-grid">
        <div className="back-media">
          <PhotoCarousel photos={s.photos} name={s.common} start={prompt.kind === 'photo' ? prompt.photo : 0} />
          {s.audio.length > 0 && (
            <div className="audio-list">
              {s.audio.map((rec, i) => (
                <AudioPlayer key={rec.url} rec={rec} label={s.audio.length > 1 && rec.kind === 'recording' ? `Recording ${i + 1}` : undefined} />
              ))}
            </div>
          )}
        </div>

        <div className="back-facts">
          <section>
            <h3>Field marks</h3>
            <ul className="marks">
              {s.marks.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </section>
          <dl className="facts">
            <dt>Size</dt>
            <dd>{s.size}</dd>
            <dt>Habitat</dt>
            <dd>{s.habitat}</dd>
          </dl>
          {s.rangeMap && (
            <section>
              <h3>Range</h3>
              <RangeMapThumb map={s.rangeMap} name={s.common} />
            </section>
          )}
          {s.summary && (
            <section>
              <h3>About</h3>
              <p className="summary">
                {s.summary}{' '}
                {s.wikiUrl && (
                  <a href={s.wikiUrl} target="_blank" rel="noreferrer">
                    Wikipedia ↗
                  </a>
                )}
              </p>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
