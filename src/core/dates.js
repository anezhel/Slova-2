export const DAY = 86400000;
const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (ts = Date.now()) => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const startOfDay = (ts = Date.now()) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const endOfDay = (ts = Date.now()) => startOfDay(addDays(ts, 1)) - 1;
export const addDays = (ts, n) => { const d = new Date(ts); d.setDate(d.getDate() + n); return d.getTime(); };
export const daysFrom = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / DAY);
// last n day keys, oldest first, today last
export const lastDays = (n, now = Date.now()) => Array.from({ length: n }, (_, i) => dayKey(addDays(now, i - n + 1)));
