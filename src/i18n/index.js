// Interface texts. Add a language: create src/i18n/<code>.js with the same keys and add one line below.
import ru from './ru.js';
import uk from './uk.js';

export const UI = { ru, uk };

let current = ru;
export const setUiLang = (code) => { current = UI[code] || ru; document.documentElement.lang = code; };

const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

// t('today.title', { n: 12 }) — {name} placeholders are filled from vars.
export function t(path, vars) {
  let s = get(current, path);
  if (s == null) s = get(ru, path);
  if (s == null) return path;
  if (typeof s !== 'string' || !vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''));
}

// Russian and Ukrainian share plural rules: 1 слово, 2 слова, 5 слов.
export function plural(n, key) {
  const forms = get(current, 'pl.' + key) || get(ru, 'pl.' + key);
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b === 1) return forms[0];
  if (b >= 2 && b <= 4) return forms[1];
  return forms[2];
}

// 1240 -> "1 240"
export const num = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
