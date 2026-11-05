// Today's plan, the lesson flow (new word → recall → rating) and the irregular verbs trainer.
import { CONFIG } from '../config.js';
import { LEVELS } from '../content/index.js';
import { getState, update, course, dayLog, courseDay } from './store.js';
import { dayKey, endOfDay, startOfDay, daysFrom, addDays } from './dates.js';
import { LADDER, IN_LESSON, GAPS, LEARNED, nextStep } from './srs.js';

export const newLimit = (perDay) => CONFIG.newPerDay[perDay] ?? Math.round(perDay / 4);
export const minutesFor = (nNew, nReview) => Math.max(1, Math.round((nNew * CONFIG.secondsPerNew + nReview * CONFIG.secondsPerReview) / 60));

export function planToday(pack, now = Date.now()) {
  const cs = course(pack.id);
  const cd = getState().log[dayKey(now)]?.c?.[pack.id] || { nw: 0, done: 0, sec: 0 };
  const until = endOfDay(now);
  const due = [];
  for (const [id, card] of Object.entries(cs.words)) {
    if (!pack.byId.has(id)) continue;
    if (card.due <= until) due.push([id, card]);
  }
  due.sort((a, b) => a[1].due - b[1].due);
  const cap = Math.max(0, cs.perDay - cd.done);
  const reviews = due.slice(0, cap).map((r) => r[0]);
  const quota = Math.max(0, Math.min(newLimit(cs.perDay) - cd.nw, cap - reviews.length));
  const levels = new Set(cs.levels);
  const fresh = [];
  for (const lvl of LEVELS) {
    if (fresh.length >= quota) break;
    if (!levels.has(lvl)) continue;
    for (const w of pack.words) {
      if (w.lvl === lvl && !cs.words[w.id]) { fresh.push(w.id); if (fresh.length >= quota) break; }
    }
  }
  const hasNewLeft = pack.words.some((w) => levels.has(w.lvl) && !cs.words[w.id]);
  return {
    reviews, fresh, done: cd.done, newToday: cd.nw, secToday: cd.sec,
    total: cd.done + reviews.length + fresh.length, left: reviews.length + fresh.length,
    minutes: minutesFor(fresh.length, reviews.length), noLevels: !cs.levels.length, hasNewLeft,
  };
}

// Reviews per day for the next `days` days (index 0 = today)
export function forecast(pack, days = 5, now = Date.now()) {
  const cs = course(pack.id);
  const out = Array(days).fill(0);
  for (const [id, card] of Object.entries(cs.words)) {
    if (!pack.byId.has(id)) continue;
    const d = Math.max(0, daysFrom(now, card.due));
    if (d < days) out[d]++;
  }
  return out;
}

// Words studied today (for «Повторить слова ещё раз»)
export function todaysWords(pack, now = Date.now()) {
  const cs = course(pack.id), start = startOfDay(now);
  return Object.entries(cs.words).filter(([id, c]) => pack.byId.has(id) && c.last >= start).map(([id]) => id);
}

/* ---------- Lesson ---------- */

export function createLesson(pack, plan, practice = false) {
  const cs = course(pack.id);
  const items = new Map();
  const add = (id, kind) => {
    const card = cs.words[id];
    items.set(id, { id, kind, step: card ? card.s : 0, shows: 0, done: false,
      relearn: kind === 'new' || !card || card.s < IN_LESSON });
  };
  const N = [...plan.fresh], R = [...plan.reviews];
  N.forEach((id) => add(id, 'new'));
  R.forEach((id) => add(id, 'review'));
  // new word, two reviews, new word, two reviews …
  const queue = [];
  while (N.length || R.length) {
    if (N.length) queue.push({ type: practice ? 'recall' : 'intro', id: N.shift() });
    for (let k = 0; k < 2 && R.length; k++) queue.push({ type: 'recall', id: R.shift() });
  }
  return { pack, items, queue, pending: [], tail: [], pos: 0, lastId: null, total: items.size,
    newTotal: practice ? 0 : plan.fresh.length, newSeen: 0, practice, lastAct: Date.now(), ratings: { good: 0, hard: 0, again: 0 } };
}

export const lessonDone = (L) => [...L.items.values()].filter((i) => i.done).length;

export function nextTask(L) {
  L.pending.sort((a, b) => a.at - b.at);
  const pick = (t) => { L.lastId = t.id; return t; };
  const dueIdx = L.pending.findIndex((p) => p.at <= L.pos && p.id !== L.lastId);
  if (dueIdx >= 0) return pick(L.pending.splice(dueIdx, 1)[0]);
  if (L.queue.length) return pick(L.queue.shift());
  if (L.tail.length) return pick({ type: 'recall', id: L.tail.shift() });
  if (L.pending.length) {
    const i = Math.max(0, L.pending.findIndex((p) => p.id !== L.lastId));
    return pick(L.pending.splice(i, 1)[0]);
  }
  return null;
}

function tick(L) {
  const now = Date.now();
  const dt = Math.min(60, Math.max(0, (now - L.lastAct) / 1000));
  L.lastAct = now;
  const key = dayKey(now);
  dayLog(key).sec += dt;
  courseDay(key, L.pack.id).sec += dt;
}

function saveCard(L, id, s, due, lapse = false) {
  const cs = course(L.pack.id);
  const now = Date.now();
  const c = cs.words[id] || { n: 0, l: 0, f: now };
  cs.words[id] = { ...c, s, due, n: (c.n || 0) + 1, l: (c.l || 0) + (lapse ? 1 : 0), last: now };
}

function finish(L, it) {
  it.done = true;
  L.pending = L.pending.filter((p) => p.id !== it.id);
  L.tail = L.tail.filter((x) => x !== it.id);
  if (!L.practice) courseDay(dayKey(), L.pack.id).done += 1;
}

export function introDone(L, id) {
  update(() => {
    const it = L.items.get(id);
    L.pos++; L.newSeen++; it.shows++;
    tick(L);
    const cs = course(L.pack.id);
    if (!cs.words[id]) {
      const now = Date.now();
      cs.words[id] = { s: 0, due: now, n: 0, l: 0, f: now, last: now };
      courseDay(dayKey(now), L.pack.id).nw += 1;
    }
    L.pending.push({ type: 'recall', id, at: L.pos + GAPS[0] });
  });
}

// Step the word will move to, for the ladder preview on «Ответ и оценка»
export function targetStep(it, rating) {
  if (rating === 'again') return 0;
  if (!it.relearn) return nextStep(it.step, rating);
  return rating === 'good' ? it.step + 1 : it.step;
}

export function answer(L, id, rating) {
  update(() => {
    const it = L.items.get(id);
    L.pos++; it.shows++;
    tick(L);
    L.ratings[rating]++;
    const key = dayKey();
    if (!L.practice) {
      const d = dayLog(key); d.r++; d[rating]++;
      courseDay(key, L.pack.id).r++;
    }
    if (L.practice) {
      if (rating === 'again' && it.shows < 3) L.tail.push(id); else finish(L, it);
      course(L.pack.id).words[id].last = Date.now();
      return;
    }
    if (!it.relearn) { // a word from earlier days
      if (rating === 'again') { it.relearn = true; it.step = 0; L.tail.push(id); saveCard(L, id, 0, Date.now(), true); return; }
      const s = nextStep(it.step, rating);
      saveCard(L, id, s, Date.now() + LADDER[s] * 1000);
      finish(L, it);
      return;
    }
    // in-lesson path: new word or a forgotten one
    if (rating === 'again') { it.step = 0; L.tail.push(id); }
    else {
      if (rating === 'good') it.step++;
      if (it.step >= IN_LESSON) { saveCard(L, id, IN_LESSON, Date.now() + LADDER[IN_LESSON] * 1000); finish(L, it); return; }
      L.pending.push({ type: 'recall', id, at: L.pos + GAPS[it.step] });
    }
    // enough for today: the word comes back tomorrow from the same step
    const capped = it.shows >= CONFIG.maxShowsPerLesson;
    saveCard(L, id, it.step, capped ? startOfDay(addDays(Date.now(), 1)) : Date.now());
    if (capped) finish(L, it);
  });
}

/* ---------- Irregular verbs ---------- */

export function verbStatus(card) { if (!card) return 'new'; return card.s >= LEARNED ? 'learned' : 'learning'; }

export function verbsSummary(pack, level = null, now = Date.now()) {
  const cs = course(pack.id), until = endOfDay(now);
  let learned = 0, due = 0, total = 0;
  for (const v of pack.verbs || []) {
    if (level && v.lvl !== level) continue;
    total++;
    const c = cs.verbs[v.id];
    if (c && c.s >= LEARNED) learned++;
    if (c && c.due <= until) due++;
  }
  return { learned, due, total };
}

export function createDrill(pack, level = null, now = Date.now()) {
  const cs = course(pack.id), until = endOfDay(now);
  const list = (pack.verbs || []).filter((v) => !level || v.lvl === level);
  const due = list.filter((v) => cs.verbs[v.id] && cs.verbs[v.id].due <= until).sort((a, b) => cs.verbs[a.id].due - cs.verbs[b.id].due);
  const fresh = list.filter((v) => !cs.verbs[v.id]);
  const ids = [...due, ...fresh].slice(0, CONFIG.drillSize).map((v) => v.id);
  return { pack, ids, i: 0, right: 0, level, lastAct: Date.now() };
}

export function rateVerb(D, id, ok2, ok3) {
  update(() => {
    const cs = course(D.pack.id);
    const now = Date.now();
    const c = cs.verbs[id] || { s: 0, n: 0, l: 0, f: now };
    let s, due;
    if (ok2 && ok3) { s = c.n && c.s >= IN_LESSON ? Math.min(c.s + 1, 7) : IN_LESSON; due = now + LADDER[s] * 1000; }
    else if (ok2 || ok3) { s = c.s; due = c.s >= IN_LESSON ? now + LADDER[c.s] * 1000 : now; }
    else { s = 0; due = now; }
    cs.verbs[id] = { ...c, s, due, n: (c.n || 0) + 1, l: (c.l || 0) + (ok2 && ok3 ? 0 : 1), last: now };
    const rating = ok2 && ok3 ? 'good' : ok2 || ok3 ? 'hard' : 'again';
    const key = dayKey(now), d = dayLog(key);
    d.r++; d[rating]++;
    courseDay(key, D.pack.id).r++;
    const dt = Math.min(60, Math.max(0, (now - D.lastAct) / 1000));
    D.lastAct = now; d.sec += dt; courseDay(key, D.pack.id).sec += dt;
    if (ok2 && ok3) D.right++;
  });
}

/* ---------- Vocabulary test (onboarding) ---------- */

export function testWords(pack, n = CONFIG.testSize) {
  const plan = ['A1', 'A1', 'A2', 'A2', 'B1', 'B2'].slice(0, n);
  const used = new Set();
  return plan.map((lvl) => {
    // content words only: "and", "in" or "a lot" say little about the vocabulary size
    const pool = pack.words.filter((w) => w.lvl === lvl && !used.has(w.id) && w.w.length > 2 && !w.w.includes(' ')
      && !['prep', 'conj', 'det', 'pron', 'num', 'int', 'phr'].includes(w.pos));
    const w = pool[Math.floor(Math.random() * pool.length)];
    if (w) used.add(w.id);
    return w;
  }).filter(Boolean);
}

// Highest level the person knows, going up from A1 (null if not even A1)
export function testLevel(answers) {
  let best = null;
  for (const lvl of LEVELS) {
    const a = answers.filter((x) => x.lvl === lvl);
    if (!a.length) continue;
    if (a.filter((x) => x.known).length * 2 >= a.length) best = lvl; else break;
  }
  return best;
}
