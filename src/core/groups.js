// Groups with their own trainer: phrasal verbs (pack.phrasal) and synonyms/antonyms (pack.syn).
// Progress of a group lives in course(id)[kind] — the same interval ladder as words and irregular verbs.
import { CONFIG } from '../config.js';
import { update, course, dayLog, courseDay } from './store.js';
import { dayKey, endOfDay } from './dates.js';
import { LADDER, IN_LESSON, LEARNED, SOLID } from './srs.js';

const items = (pack, kind) => pack[kind] || [];
const low = (s) => (s || '').toLowerCase().trim();
export const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Example sentences mark the phrasal verb with [brackets]: "Don't [give up] now."
export const plainEx = (s) => (s || '').replace(/[[\]]/g, '');
export const blankEx = (s) => (s || '').replace(/\[[^\]]*\]/g, '____');

export const itemStatus = (card) => (!card ? 'new' : card.s >= LEARNED ? 'learned' : 'learning');

export function groupSummary(pack, kind, level = null, now = Date.now()) {
  const map = course(pack.id)[kind], until = endOfDay(now);
  let learned = 0, due = 0, total = 0;
  for (const x of items(pack, kind)) {
    if (level && x.lvl !== level) continue;
    total++;
    const c = map[x.id];
    if (c && c.s >= LEARNED) learned++;
    if (c && c.due <= until) due++;
  }
  return { learned, due, total };
}

// One trainer round: what is due first, then new items (in table order), CONFIG.drillSize in total
export function createGroupDrill(pack, kind, level = null, now = Date.now()) {
  const map = course(pack.id)[kind], until = endOfDay(now);
  const list = items(pack, kind).filter((x) => !level || x.lvl === level);
  const due = list.filter((x) => map[x.id] && map[x.id].due <= until).sort((a, b) => map[a.id].due - map[b.id].due);
  const fresh = list.filter((x) => !map[x.id]);
  const ids = [...due, ...fresh].slice(0, CONFIG.drillSize).map((x) => x.id);
  return { pack, kind, ids, i: 0, right: 0, level, lastAct: Date.now() };
}

// Both parts right — next step; one right — same step; none — from the start (as «Помню / С трудом / Не помню»)
export function rateItem(D, id, ok1, ok2) {
  update(() => {
    const map = course(D.pack.id)[D.kind];
    const now = Date.now();
    const c = map[id] || { s: 0, n: 0, l: 0, f: now };
    let s, due;
    if (ok1 && ok2) { s = c.n && c.s >= IN_LESSON ? Math.min(c.s + 1, SOLID) : IN_LESSON; due = now + LADDER[s] * 1000; }
    else if (ok1 || ok2) { s = c.s; due = c.s >= IN_LESSON ? now + LADDER[c.s] * 1000 : now; }
    else { s = 0; due = now; }
    map[id] = { ...c, s, due, n: (c.n || 0) + 1, l: (c.l || 0) + (ok1 && ok2 ? 0 : 1), last: now };
    const rating = ok1 && ok2 ? 'good' : ok1 || ok2 ? 'hard' : 'again';
    const key = dayKey(now), d = dayLog(key);
    d.r++; d[rating]++;
    courseDay(key, D.pack.id).r++;
    const dt = Math.min(60, Math.max(0, (now - D.lastAct) / 1000));
    D.lastAct = now; d.sec += dt; courseDay(key, D.pack.id).sec += dt;
    if (ok1 && ok2) D.right++;
  });
}

// Take up to n items from the lists in order (each list shuffled), skipping what `ok` rejects
function take(lists, n, ok) {
  const out = [];
  for (const list of lists) for (const c of shuffle([...new Set(list)])) {
    if (out.length >= n) return out;
    if (c && ok(c) && !out.includes(c)) out.push(c);
  }
  return out;
}

/* Phrasal verbs trainer: 3 verbs (the right one + verbs used with the same particle)
   and 3 particles (the right one + particles used with the same verb).
   A combination that means nearly the same (give up / give in) is never offered. */
const COMMON_VERBS = ['get', 'take', 'come', 'go', 'put', 'look', 'turn', 'give', 'make', 'set', 'bring', 'run', 'break', 'pick', 'call', 'keep'];
const COMMON_PARTS = ['up', 'out', 'off', 'on', 'in', 'down', 'back', 'over', 'away', 'through'];
const stemsOf = (text) => (text || '').toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length > 3).map((w) => w.slice(0, 5));
const stems = (x) => stemsOf(`${x.ru} ${x.uk}`);

export function phrasalOptions(pack, x) {
  const all = pack.phrasal;
  const mine = new Set(stems(x));
  const byText = new Map(all.map((y) => [low(y.ph), y]));
  const clash = (v, p) => { const y = byText.get(low(v + ' ' + p)); return !!y && y.id !== x.id && stems(y).some((w) => mine.has(w)); };
  const parts = [x.part, ...take([all.filter((y) => y.verb === x.verb).map((y) => y.part), COMMON_PARTS], 2, (p) => p !== x.part && !clash(x.verb, p))];
  const verbs = [x.verb, ...take([all.filter((y) => y.part === x.part).map((y) => y.verb), COMMON_VERBS], 2,
    (v) => v !== x.verb && !parts.some((p) => clash(v, p)))];
  return { verbs: shuffle(verbs), parts: shuffle(parts) };
}

/* Synonyms trainer: the synonym, the antonym and 4 other words of the same part of speech.
   A word is never offered as a wrong option if it could be right: words linked as synonyms form a group
   (a word from the same group or from an opposite group is skipped), and so is a word whose translation
   shares a stem with the translations of the word, its synonym or its antonym. */
export function synOptions(pack, x) {
  const all = pack.syn;
  const trOf = new Map();
  const addTr = (w, text) => { const k = low(w); if (!trOf.has(k)) trOf.set(k, new Set()); for (const s of stemsOf(text)) trOf.get(k).add(s); };
  for (const y of all) { addTr(y.w, `${y.ru} ${y.uk}`); addTr(y.s, `${y.sRu} ${y.sUk}`); addTr(y.a, `${y.aRu} ${y.aUk}`); }
  const near = new Set(stemsOf(`${x.ru} ${x.uk} ${x.sRu} ${x.sUk} ${x.aRu} ${x.aUk}`));
  const sameMeaning = (w) => [...(trOf.get(low(w)) || [])].some((s) => near.has(s));
  const parent = new Map();
  const find = (w) => { let r = low(w); if (!parent.has(r)) parent.set(r, r); while (parent.get(r) !== r) r = parent.get(r); return r; };
  for (const y of all) { const a = find(y.w), b = find(y.s); if (a !== b) parent.set(a, b); }
  const anti = new Map();
  const link = (a, b) => { for (const [p, q] of [[a, b], [b, a]]) { if (!anti.has(p)) anti.set(p, new Set()); anti.get(p).add(q); } };
  for (const y of all) link(find(y.w), find(y.a));
  const me = find(x.w), opp = find(x.a);
  const none = new Set();
  const bad = (w) => { const r = find(w); return r === me || r === opp || (anti.get(me) || none).has(r) || (anti.get(opp) || none).has(r) || sameMeaning(w); };
  const words = (ys) => ys.flatMap((y) => [y.w, y.s, y.a]);
  const others = all.filter((y) => y.id !== x.id);
  const same = others.filter((y) => y.pos === x.pos);
  const fakes = take([words(same.filter((y) => y.lvl === x.lvl)), words(same), words(others)], 4, (w) => !bad(w));
  return shuffle([x.s, x.a, ...fakes]);
}
