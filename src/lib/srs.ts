import type { CardState } from './storage.ts';

/** Leitner scheduler: five boxes, each with a longer review interval. */
export const BOXES = 5;
const DAY = 24 * 60 * 60 * 1000;
/** Interval in days for boxes 1–5. Box 1 is due again right away. */
const INTERVAL_DAYS = [0, 0, 1, 3, 7, 16];

export type Grade = 'missed' | 'hard' | 'good';

export function review(prev: CardState | undefined, grade: Grade, now = Date.now()): CardState {
  const box = prev?.box ?? 1;
  const nextBox = grade === 'missed' ? 1 : grade === 'hard' ? box : Math.min(box + 1, BOXES);
  // "Hard" keeps the box but comes back sooner than a normal pass.
  const days = grade === 'hard' ? INTERVAL_DAYS[nextBox] / 2 : INTERVAL_DAYS[nextBox];
  return { box: nextBox, due: now + days * DAY, reviews: (prev?.reviews ?? 0) + 1 };
}

/** Pick cards for a session: due cards (lowest box first), then new cards, up to `size`. */
export function pickSession(
  speciesIds: string[],
  progress: Record<string, CardState>,
  size: number,
  now = Date.now(),
): string[] {
  const due = speciesIds
    .filter((id) => progress[id] && progress[id].due <= now)
    .sort((a, b) => progress[a].box - progress[b].box || progress[a].due - progress[b].due);
  const fresh = shuffle(speciesIds.filter((id) => !progress[id]));
  const picked = [...due, ...fresh].slice(0, size);
  // If nothing is due, review the cards that come due soonest.
  if (picked.length === 0) {
    return speciesIds
      .slice()
      .sort((a, b) => progress[a].due - progress[b].due)
      .slice(0, size);
  }
  return shuffle(picked);
}

export function boxCounts(speciesIds: string[], progress: Record<string, CardState>, confident: string[] = []) {
  const counts = { new: 0, due: 0, confident: 0, boxes: Array(BOXES).fill(0) as number[] };
  const now = Date.now();
  const skip = new Set(confident);
  for (const id of speciesIds) {
    const s = progress[id];
    if (skip.has(id)) counts.confident++;
    else if (!s) counts.new++;
    else {
      counts.boxes[s.box - 1]++;
      if (s.due <= now) counts.due++;
    }
  }
  return counts;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
