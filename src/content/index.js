// Languages you can study. A new language = a new folder (pack.js + words.tsv) and ONE line in LANGUAGES.
import en from './en-US/pack.js';
import lv from './lv/pack.js';

export const LANGUAGES = [en, lv];
export const LEVELS = ['A1', 'A2', 'B1', 'B2'];
export { TOPICS } from './topics.js';

export const getPack = (id) => LANGUAGES.find((p) => p.id === id) || LANGUAGES[0];

// Tab-separated table: first line = column names, lines starting with # are comments.
export function parseTSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() && !l.startsWith('#'));
  const head = lines.shift().split('\t').map((s) => s.trim());
  return lines.map((l) => {
    const cells = l.split('\t');
    const row = {};
    head.forEach((h, i) => { row[h] = (cells[i] || '').trim(); });
    return row;
  });
}

async function fetchTable(pack, file) {
  const res = await fetch(new URL(`./${pack.id}/${file}`, import.meta.url));
  if (!res.ok) throw new Error(`${pack.id}/${file}: ${res.status}`);
  return parseTSV(await res.text());
}

export async function loadContent() {
  await Promise.all(LANGUAGES.map(async (p) => {
    const seen = new Set();
    p.words = (await fetchTable(p, p.files.words)).filter((r) => r.word && LEVELS.includes(r.level)).map((r) => {
      let id = r.id || r.word;
      while (seen.has(id)) id += '+';
      seen.add(id);
      return { id, w: r.word, ipa: r.ipa || '', pos: r.pos || '', lvl: r.level, topic: r.topic || 'basics',
        ru: r.ru, uk: r.uk || r.ru, ex: r.example || '', exRu: r.example_ru || '', exUk: r.example_uk || r.example_ru || '' };
    });
    p.byId = new Map(p.words.map((w) => [w.id, w]));
    if (p.files.verbs) {
      p.verbs = (await fetchTable(p, p.files.verbs)).filter((r) => r.v1).map((r) => ({
        id: r.v1, v1: r.v1, v2: r.v2, v3: r.v3, ru: r.ru, uk: r.uk || r.ru, lvl: r.level || 'A2', g: r.group || 'unique',
        fakes: (r.fakes || '').split(',').map((s) => s.trim()).filter(Boolean),
        note: r.note ? { ru: r.note, uk: r.note_uk || r.note } : null }));
      p.verbById = new Map(p.verbs.map((v) => [v.id, v]));
    }
  }));
}

// Text in the interface language with a fallback to Russian
export const tr = (obj, ui) => (obj && (obj[ui] || obj.ru)) || '';
export const wordTr = (w, ui) => (ui === 'uk' ? w.uk : w.ru) || w.ru;
export const exTr = (w, ui) => (ui === 'uk' ? w.exUk : w.exRu) || w.exRu;
