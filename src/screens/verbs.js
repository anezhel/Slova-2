// 09 Неправильные глаголы · 10 Тренажёр трёх форм
import { html, useState, useRef, useMemo, useEffect } from '../../lib/preact-htm.js';
import { t } from '../i18n/index.js';
import { LEVELS, getPack, tr } from '../content/index.js';
import { getState, course } from '../core/store.js';
import { verbsSummary, verbStatus, createDrill, rateVerb } from '../core/session.js';
import { tts } from '../core/tts.js';
import { Button, Chip, BackHeader, VerbRow, LessonHeader, IconButton, cx } from '../ui/kit.js';

export function Verbs({ go }) {
  const s = getState();
  const pack = getPack(s.course);
  const [lvl, setLvl] = useState(null);
  const cs = course(pack.id);
  const list = (pack.verbs || []).filter((v) => !lvl || v.lvl === lvl);
  const sum = verbsSummary(pack, lvl);
  const pct = sum.total ? Math.round((sum.learned / sum.total) * 100) : 0;
  const filters = [{ v: null, label: t('verbs.all') }, ...LEVELS.filter((l) => pack.verbs.some((v) => v.lvl === l)).map((l) => ({ v: l, label: l }))];
  return html`<div class="screen g14">
    <${BackHeader} onBack=${() => go('courses')} right=${html`<${Chip} label=${tr(pack.name, s.ui)} />`} />
    <h1 class="t-heading-h3 pre">${t('verbs.title')}</h1>
    <div class="inverse r16 row g16" style="padding:28px 18px">
      <span class="row g6" style="align-items:baseline"><span class="t-display-m c-inverse-accent tnum">${sum.learned}</span><span class="t-body-m c-on-inverse-2 nowrap">/ ${sum.total}</span></span>
      <span class="col g8 grow"><span class="t-body-s-medium c-on-inverse">${t('verbs.learned', { n: sum.due })}</span>
        <span class="bar" style="height:10px;background:var(--bg-inverse-2)"><i style=${`width:${pct}%;background:var(--text-inverse-accent)`}></i></span></span>
    </div>
    <div class="row g6 wrap">${filters.map((f) => html`<button key=${f.label} class=${cx('segment', 'segment--s', f.v === lvl && 'segment--on')} onClick=${() => setLvl(f.v)}>${f.label}</button>`)}</div>
    <div class="row g8 t-label-semibold c-secondary" style="padding:0 46px 0 14px"><span class="grow" style="flex-basis:0">${t('verbs.v1')}</span><span class="grow" style="flex-basis:0">${t('verbs.v2')}</span><span class="grow" style="flex-basis:0">${t('verbs.v3')}</span></div>
    <div class="col g6">${list.map((v) => html`<${VerbRow} key=${v.id} v1=${v.v1} v2=${v.v2} v3=${v.v3} status=${verbStatus(cs.verbs[v.id])} />`)}</div>
    <div class="spacer"></div>
    <div style="position:sticky;bottom:var(--pad-bottom);z-index:5"><${Button} label=${t('verbs.drill')} arrow onClick=${() => go('drill', { level: lvl })} /></div>
  </div>`;
}

const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const reg = (x) => (x.endsWith('e') ? x + 'd' : /[^aeiou][aeiou][bdgmnprt]$/.test(x) && x.length <= 6 ? x + x.slice(-1) + 'ed'
  : /[^aeiou]y$/.test(x) ? x.slice(0, -1) + 'ied' : x + 'ed');
// Plausible wrong forms: beginned, begined, begon, begain …
export function fakeForms(v) {
  const b = v.v1.toLowerCase();
  const real = new Set([b, ...v.v2.split('/'), ...v.v3.split('/')].map((x) => x.trim()));
  const swaps = (x) => { const m = /([aeiou]+)([^aeiou]*)$/.exec(x); if (!m) return []; const head = x.slice(0, m.index), tail = m[2]; return ['o', 'ai', 'a', 'u', 'ou', 'ee'].map((vw) => head + vw + tail); };
  const v2 = v.v2.split('/')[0].trim(), v3 = v.v3.split('/')[0].trim();
  const cand = [reg(b), b + 'ed', ...swaps(b), b + 'en', v2 + 'en', reg(v2), v3 + 'ed', ...swaps(v2), b + 't', v2 + 'n'];
  const out = [];
  for (const c of cand) if (c && c.length > 1 && !real.has(c) && !out.includes(c)) out.push(c);
  return out;
}

export function Drill({ go, route, toast }) {
  const s = getState();
  const pack = getPack(s.course);
  const ref = useRef(null);
  if (!ref.current) ref.current = createDrill(pack, route.level || null);
  const D = ref.current;
  const [i, setI] = useState(0);
  const [slots, setSlots] = useState([null, null]);
  const [checked, setChecked] = useState(false);
  const v = pack.verbById.get(D.ids[i]);
  const options = useMemo(() => {
    if (!v) return [];
    const right = [...new Set([v.v2, v.v3])];
    const fakes = v.fakes && v.fakes.length ? v.fakes : fakeForms(v).slice(0, 8);
    return shuffle([...right, ...shuffle(fakes).slice(0, 6 - right.length)]);
  }, [i]);
  useEffect(() => { if (!v) { toast(t('drill.nothing')); go('verbs'); } }, []);
  if (!v) return null;
  const voice = tts.has(pack.tts);
  const forms = `${v.v1} — ${v.v2} — ${v.v3}`;
  const ok = [slots[0] === v.v2, slots[1] === v.v3];

  const pick = (o) => {
    if (checked) return;
    const k = slots[0] == null ? 0 : 1;
    const ns = [...slots]; ns[k] = o; setSlots(ns);
    if (k === 1) {
      setChecked(true);
      rateVerb(D, v.id, ns[0] === v.v2, ns[1] === v.v3);
      if (voice) tts.speak(`${v.v1}, ${v.v2.replace('/', ',')}, ${v.v3}`, pack.tts);
    }
  };
  const clear = (k) => { if (checked || slots[k] == null) return; const ns = [...slots]; ns[k] = null; if (k === 0) ns[1] = null; setSlots(ns); };
  const next = () => {
    if (i + 1 >= D.ids.length) { toast(t('drill.done', { n: D.right, total: D.ids.length })); go('verbs'); return; }
    setI(i + 1); setSlots([null, null]); setChecked(false); window.scrollTo(0, 0);
  };
  const slotState = (k) => checked ? (ok[k] ? 'correct' : 'wrong') : slots[k] != null ? 'filled' : (k === (slots[0] == null ? 0 : 1) ? 'active' : 'empty');
  const optState = (o) => {
    if (!checked) return slots.includes(o) ? 'used' : '';
    if (o === v.v2 || o === v.v3) return 'correct';
    return slots.includes(o) ? 'wrong' : 'dim';
  };
  const rows = [];
  for (let k = 0; k < options.length; k += 2) rows.push(options.slice(k, k + 2));
  const hint = [tr(pack.verbHints && pack.verbHints[v.g], s.ui), v.note && tr(v.note, s.ui)].filter(Boolean).join(' ');
  const allOk = ok[0] && ok[1];

  return html`<div class="screen g14">
    <${LessonHeader} onClose=${() => go('verbs')} n=${D.ids.length} done=${i + (checked ? 1 : 0)} counter=${`${i + 1}/${D.ids.length}`} />
    <div class="row g8"><${Chip} label=${t('drill.chip')} color="lavender" /><${Chip} label=${v.lvl} color="lavender" /></div>
    <div class="card r32 p20 col g16">
      <div class="row between g12" style="align-items:flex-start">
        <div class="col g6"><span class="t-body-s c-secondary">${t('drill.task')}</span><span class="t-display-m">${v.v1}</span><span class="t-body-l c-secondary">${tr(v, s.ui)}</span></div>
        ${voice && html`<${IconButton} icon="speaker" variant="strong" size=${52} onClick=${() => tts.speak(v.v1, pack.tts)} />`}
      </div>
      <div class="row g8">${[['V1', null], ['V2 · Past', 0], ['V3', 1]].map(([head, k]) => html`<div class="col g6 grow" style="flex-basis:0" key=${head}>
        <span class="t-label-semibold c-secondary">${head}</span>
        ${k === null ? html`<span class="slot slot--given">${v.v1}</span>`
          : html`<button class=${'slot slot--' + slotState(k)} onClick=${() => clear(k)}>${checked ? [v.v2, v.v3][k] : slots[k] || ''}</button>`}</div>`)}</div>
    </div>
    <div class="col g8">${rows.map((r, n) => html`<div class="row g8" key=${n}>${r.map((o) => html`<button key=${o} class=${cx('opt', optState(o) && 'opt--' + optState(o))} onClick=${() => pick(o)}>${o}</button>`)}</div>`)}</div>
    ${checked && html`<div class="card r24 col g8" style="padding:14px 16px">
      <div class="row g8"><${Chip} label=${allOk ? t('drill.right') : t('drill.wrong')} color=${allOk ? 'lime' : 'coral'} size="s" /><span class="t-body-m-strong">${forms}</span></div>
      ${hint && html`<p class="t-body-s c-secondary">${hint}</p>`}</div>`}
    <div class="spacer"></div>
    <${Button} label=${t('drill.nextVerb')} arrow onClick=${next} disabled=${!checked} />
  </div>`;
}
