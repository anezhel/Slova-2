// All progress lives on the phone (localStorage). Backup/restore: core/backup.js.
import { CONFIG } from '../config.js';

const KEY = 'vocca:v1';

const fresh = () => ({
  app: 'vocca', v: 1,
  ui: (navigator.language || '').toLowerCase().startsWith('uk') ? 'uk' : 'ru',
  course: null,          // studied language (pack id)
  onboarded: false,
  autoplay: true,        // «Озвучивать слово сразу»
  speak: true,           // «Отвечать вслух»: pause in the lesson to say the word aloud
  courses: {},           // per language: levels, perDay, words / verbs / phrasal / syn {id: card}
  log: {},               // per day: answers, seconds, per language counters
});

function migrate(s) {
  const base = fresh();
  return Object.assign(base, s, { app: 'vocca', v: 1 });
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.app === 'vocca') return migrate(s); }
  } catch (e) { console.warn('vocca: cannot read progress', e); }
  return fresh();
}

let state = load();
const subs = new Set();
let timer;

export const getState = () => state;
export function flush() { clearTimeout(timer); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('vocca: cannot save', e); } }
const save = () => { clearTimeout(timer); timer = setTimeout(flush, 200); };
const emit = () => subs.forEach((f) => f());

export function update(fn) { fn(state); save(); emit(); }
export function replaceState(s) { state = migrate(s); flush(); emit(); }
export const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };

export function course(id = state.course) {
  if (!state.courses[id]) state.courses[id] = { levels: [], perDay: CONFIG.perDayDefault, words: {}, verbs: {}, phrasal: {}, syn: {} };
  const c = state.courses[id];
  c.words = c.words || {}; c.verbs = c.verbs || {}; c.phrasal = c.phrasal || {}; c.syn = c.syn || {}; c.levels = c.levels || [];
  return c;
}
export function dayLog(key) {
  if (!state.log[key]) state.log[key] = { r: 0, again: 0, hard: 0, good: 0, sec: 0, c: {} };
  return state.log[key];
}
export function courseDay(key, id) {
  const d = dayLog(key);
  if (!d.c[id]) d.c[id] = { r: 0, nw: 0, done: 0, sec: 0 };
  return d.c[id];
}

addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
