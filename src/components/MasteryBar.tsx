import type { boxCounts } from '../lib/srs.ts';

/** Stacked bar: box 1 … box 5 (mastered), then birds marked Confident. Unstudied birds are the empty track. */
export function MasteryBar({ counts, total }: { counts: ReturnType<typeof boxCounts>; total: number }) {
  if (!total) return null;
  const segments: [string, number][] = [...counts.boxes.map((n, i): [string, number] => [`b${i + 1}`, n]), ['conf', counts.confident]];
  return (
    <div
      className="mastery"
      role="img"
      aria-label={`${counts.boxes[3] + counts.boxes[4]} mastered, ${counts.confident} confident, of ${total}`}
    >
      {segments.map(([cls, n]) => (n ? <span key={cls} className={cls} style={{ width: `${(n / total) * 100}%` }} /> : null))}
    </div>
  );
}
