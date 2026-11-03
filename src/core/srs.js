// Spaced repetition (Pimsleur ladder). Steps 0–3 happen inside one lesson, 4–7 on the following days.
export const LADDER = [5, 25, 120, 600, 86400, 432000, 2160000, 10368000]; // seconds: 5 s, 25 s, 2 min, 10 min, 1 d, 5 d, 25 d, 4 mo
export const IN_LESSON = 4;   // first step on another day (1 d)
export const LEARNED = 6;     // «выучено»: 25 days
export const SOLID = 7;       // «закреплено»: 4 months
export const GAPS = [1, 3, 6, 10]; // inside a lesson: how many cards until the next repeat (≈ 5 s, 25 s, 2 min, 10 min)

// «Помню» — next step, «С трудом» — same step, «Не помню» — from the start
export const nextStep = (step, rating) => (rating === 'good' ? Math.min(step + 1, SOLID) : rating === 'hard' ? step : 0);

export function bucket(card) {
  if (!card) return 'none';
  if (card.s < IN_LESSON) return 'new';
  if (card.s < LEARNED) return 'learning';
  if (card.s < SOLID) return 'known';
  return 'solid';
}
