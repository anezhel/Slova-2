// «Резервная копия»: progress of all languages as one .json file the person keeps in Files / iCloud.
import { getState, replaceState, flush } from './store.js';
import { dayKey } from './dates.js';

export async function saveBackup() {
  flush();
  const name = `vocca-backup-${dayKey()}.json`;
  const data = JSON.stringify({ ...getState(), exportedAt: new Date().toISOString() });
  const file = new File([data], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return true; }
    catch (e) { if (e && e.name === 'AbortError') return false; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  return true;
}

export function pickFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json,.json';
    input.style.display = 'none';
    input.onchange = () => { resolve(input.files && input.files[0]); input.remove(); };
    document.body.appendChild(input);
    input.click();
  });
}

export async function readBackup(file) {
  const s = JSON.parse(await file.text());
  if (!s || s.app !== 'vocca' || typeof s.courses !== 'object') throw new Error('not a vocca backup');
  return s;
}

export const restoreBackup = (s) => { delete s.exportedAt; replaceState(s); };
