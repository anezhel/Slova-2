// Numbers for «Прогресс» and «Курсы».
import { LEVELS } from '../content/index.js';
import { course } from './store.js';
import { bucket } from './srs.js';
import { dayKey, addDays, startOfDay, lastDays } from './dates.js';

export function streak(log, now = Date.now()) {
  let d = startOfDay(now), n = 0;
  if (!(log[dayKey(d)]?.r > 0)) d = addDays(d, -1);
  while (log[dayKey(d)]?.r > 0) { n++; d = addDays(d, -1); }
  return n;
}

export function period(log, days, now = Date.now()) {
  const keys = lastDays(days, now);
  const s = { r: 0, good: 0, hard: 0, again: 0, sec: 0, days: keys.map((k) => ({ key: k, r: log[k]?.r || 0 })) };
  for (const k of keys) { const d = log[k]; if (!d) continue; s.r += d.r; s.good += d.good; s.hard += d.hard; s.again += d.again; s.sec += d.sec; }
  s.accuracy = s.r ? Math.round(((s.good + s.hard) / s.r) * 100) : null;
  return s;
}

export function courseStats(pack, sinceTs = 0) {
  const cs = course(pack.id);
  const byLevel = Object.fromEntries(LEVELS.map((l) => [l, { started: 0, total: 0 }]));
  const buckets = { new: 0, learning: 0, known: 0, solid: 0 };
  let started = 0, recent = 0;
  for (const w of pack.words) {
    byLevel[w.lvl].total++;
    const c = cs.words[w.id];
    if (!c) continue;
    started++; byLevel[w.lvl].started++;
    buckets[bucket(c)]++;
    if (c.f >= sinceTs) recent++;
  }
  // current level: the lowest chosen level that is not finished yet
  const chosen = cs.levels.length ? LEVELS.filter((l) => cs.levels.includes(l)) : LEVELS;
  const current = chosen.find((l) => byLevel[l].total && byLevel[l].started < byLevel[l].total) || chosen[chosen.length - 1] || 'A1';
  return { started, total: pack.words.length, byLevel, buckets, recent, current };
}
