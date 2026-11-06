import { useEffect, useState } from 'react';
import type { Credit, Photo, RangeMap, Recording } from '../types.ts';

export function Attribution({ credit, icon }: { credit: Credit; icon: string }) {
  return (
    <a className="credit" href={credit.source} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
      {icon} {credit.author} · {credit.license}
    </a>
  );
}

const kindLabel: Record<Recording['kind'], string> = { song: 'Song', call: 'Call', recording: 'Recording' };

export function AudioPlayer({ rec, label }: { rec: Recording; label?: string }) {
  return (
    <figure className="audio">
      <figcaption>
        <strong>{label ?? kindLabel[rec.kind]}</strong>
        {rec.location && <span className="muted"> · {rec.location}</span>}
      </figcaption>
      <audio controls preload="none" src={rec.url} />
      <Attribution credit={rec} icon="🎙" />
    </figure>
  );
}

export function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-label={alt}>
      <img src={src} alt={alt} />
      <button className="lightbox-close" aria-label="Close">✕</button>
    </div>
  );
}

export function PhotoCarousel({ photos, name, start = 0 }: { photos: Photo[]; name: string; start?: number }) {
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  if (!photos.length) return null;
  const p = photos[i % photos.length];
  return (
    <div className="carousel">
      <button className="photo-main" onClick={() => setZoom(true)} aria-label="Enlarge photo">
        <img src={p.url} alt={name} />
      </button>
      <div className="carousel-bar">
        <div className="thumbs">
          {photos.map((ph, j) => (
            <button key={ph.url} className={j === i % photos.length ? 'active' : ''} onClick={() => setI(j)}>
              <img src={ph.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
        <Attribution credit={p} icon="📷" />
      </div>
      {zoom && <Lightbox src={p.large} alt={name} onClose={() => setZoom(false)} />}
    </div>
  );
}

export function RangeMapThumb({ map, name }: { map: RangeMap; name: string }) {
  const [zoom, setZoom] = useState(false);
  return (
    <figure className="range-map">
      <button onClick={() => setZoom(true)} aria-label="Enlarge range map">
        <img src={map.url} alt={`Range map for ${name}`} loading="lazy" />
      </button>
      <Attribution credit={map} icon="🗺" />
      {zoom && <Lightbox src={map.url} alt={`Range map for ${name}`} onClose={() => setZoom(false)} />}
    </figure>
  );
}
