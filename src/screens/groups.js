// Фразовые глаголы · Синонимы и антонимы — group lists and their trainers (built like 09–10 «Неправильные глаголы»)
import { html, useState, useRef, useMemo, useEffect } from '../../lib/preact-htm.js';
import { t } from '../i18n/index.js';
import { LEVELS, getPack, tr } from '../content/index.js';
import { getState, course } from '../core/store.js';
import { groupSummary, itemStatus, createGroupDrill, rateItem, phrasalOptions, synOptions, plainEx, blankEx } from '../core/groups.js';
import { tts } from '../core/tts.js';
import { Button, Chip, BackHeader, LessonHeader, IconButton, Segmented, StatusDot, LEVEL_CHIP, cx } from '../ui/kit.js';

const exTr = (x, ui) => (ui === 'uk' ? x.exUk : x.exRu) || x.exRu;
const pair = (w, ru, uk, ui) => `${w} — ${(ui === 'uk' ? uk : ru) || ru}`;

function Summary({ sum }) {
  const pct = sum.total ? Math.round((sum.learned / sum.total) * 100) : 0;
  return html`<div class="inverse r16 row g16" style="padding:28px 18px">
    <span class="row g6" style="align-items:baseline"><span class="t-display-m c-inverse-accent tnum">${sum.learned}</span><span class="t-body-m c-on-inverse-2 nowrap">/ ${sum.total}</span></span>
    <span class="col g8 grow"><span class="t-body-s-medium c-on-inverse">${t('verbs.learned', { n: sum.due })}</span>
      <span class="bar" style="height:10px;background:var(--bg-inverse-2)"><i style=${`width:${pct}%;background:var(--text-inverse-accent)`}></i></span></span>
  </div>`;
}

function LevelFilter({ items, value, onChange }) {
  const filters = [{ v: null, label: t('verbs.all') }, ...LEVELS.filter((l) => items.some((x) => x.lvl === l)).map((l) => ({ v: l, label: l }))];
  return html`<div class="row g6 wrap">${filters.map((f) => html`<button key=${f.label} class=${cx('segment', 'segment--s', f.v === value && 'segment--on')}
    onClick=${() => onChange(f.v)}>${f.label}</button>`)}</div>`;
}

// A row that opens on tap and shows the example or the translations underneath
function XRow({ cells, status, open, onClick, wrap, children }) {
  return html`<button class=${cx('xrow card', wrap && 'xrow--wrap')} aria-expanded=${open} onClick=${onClick}>
    <span class="xrow__top">${cells.map((c, i) => html`<span key=${i} class=${i === 0 ? 't-body-l-strong' : cells.length === 2 ? 't-body-m c-secondary' : 't-body-m-medium'}>${c}</span>`)}
      <${StatusDot} status=${status} /></span>
    ${open && html`<span class="xrow__more">${children}</span>`}
  </button>`;
}

const Sticky = ({ label, onClick }) => html`<div class="spacer"></div>
  <div style="position:sticky;bottom:var(--pad-bottom);z-index:5"><${Button} label=${label} arrow onClick=${onClick} /></div>`;

/* ---------- Фразовые глаголы ---------- */

export function PhrasalVerbs({ go }) {
  const s = getState();
  const pack = getPack(s.course);
  const [lvl, setLvl] = useState(null);
  const [by, setBy] = useState('verb');
  const [open, setOpen] = useState(null);
  const cs = course(pack.id);
  const all = pack.phrasal || [];
  const voice = tts.has(pack.tts);
  const groups = useMemo(() => {
    const m = new Map();
    for (const x of all) {
      if (lvl && x.lvl !== lvl) continue;
      const k = by === 'verb' ? x.verb : x.key;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(x);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  }, [lvl, by]);
  const toggle = (x) => { const o = open === x.id ? null : x.id; setOpen(o); if (o && voice) tts.speak(x.ph, pack.tts); };
  return html`<div class="screen g14">
    <${BackHeader} onBack=${() => go('courses')} right=${html`<${Chip} label=${tr(pack.name, s.ui)} />`} />
    <h1 class="t-heading-h3 pre">${t('phrasal.title')}</h1>
    <${Summary} sum=${groupSummary(pack, 'phrasal', lvl)} />
    <${Segmented} options=${[{ value: 'verb', label: t('phrasal.byVerb') }, { value: 'part', label: t('phrasal.byParticle') }]} value=${by} onChange=${setBy} />
    <${LevelFilter} items=${all} value=${lvl} onChange=${setLvl} />
    ${groups.map(([k, xs]) => html`<div class="col g6" key=${by + k}>
      <div class="ghead"><span class="t-title-s">${by === 'verb' ? k : '… ' + k}</span><span class="t-caption-semibold c-secondary tnum">${xs.length}</span></div>
      ${xs.map((x) => html`<${XRow} key=${x.id} wrap cells=${[x.ph, tr(x, s.ui)]} status=${itemStatus(cs.phrasal[x.id])} open=${open === x.id} onClick=${() => toggle(x)}>
        ${x.ex && html`<span class="t-body-m-medium">${plainEx(x.ex)}</span><span class="t-body-s c-secondary">${exTr(x, s.ui)}</span>`}
        ${x.note && html`<span class="t-caption-regular c-secondary">${tr(x.note, s.ui)}</span>`}
      </${XRow}>`)}
    </div>`)}
    <${Sticky} label=${t('phrasal.drill')} onClick=${() => go('phrasalDrill', { level: lvl })} />
  </div>`;
}

/* ---------- Синонимы и антонимы ---------- */

export function Synonyms({ go }) {
  const s = getState();
  const pack = getPack(s.course);
  const [lvl, setLvl] = useState(null);
  const [open, setOpen] = useState(null);
  const cs = course(pack.id);
  const all = pack.syn || [];
  const list = all.filter((x) => !lvl || x.lvl === lvl);
  const voice = tts.has(pack.tts);
  const toggle = (x) => { const o = open === x.id ? null : x.id; setOpen(o); if (o && voice) tts.speak(`${x.w}, ${x.s}, ${x.a}`, pack.tts); };
  return html`<div class="screen g14">
    <${BackHeader} onBack=${() => go('courses')} right=${html`<${Chip} label=${tr(pack.name, s.ui)} />`} />
    <h1 class="t-heading-h3 pre">${t('syn.title')}</h1>
    <${Summary} sum=${groupSummary(pack, 'syn', lvl)} />
    <${LevelFilter} items=${all} value=${lvl} onChange=${setLvl} />
    <div class="row g8 t-label-semibold c-secondary" style="padding:0 46px 0 14px">${['word', 'syn', 'ant'].map((k) => html`<span key=${k} class="grow" style="flex-basis:0">${t('syn.' + k)}</span>`)}</div>
    <div class="col g6">${list.map((x) => html`<${XRow} key=${x.id} cells=${[x.w, '≈ ' + x.s, '≠ ' + x.a]} status=${itemStatus(cs.syn[x.id])} open=${open === x.id} onClick=${() => toggle(x)}>
      <span class="t-body-s">${pair(x.w, x.ru, x.uk, s.ui)}</span>
      <span class="t-body-s c-secondary">≈ ${pair(x.s, x.sRu, x.sUk, s.ui)}</span>
      <span class="t-body-s c-secondary">≠ ${pair(x.a, x.aRu, x.aUk, s.ui)}</span>
    </${XRow}>`)}</div>
    <${Sticky} label=${t('syn.drill')} onClick=${() => go('synDrill', { level: lvl })} />
  </div>`;
}

/* ---------- Trainer with two answer slots ----------
   options: [{ text, slot }] — with `slot` an option goes only to that slot (verb / particle),
   without it to the first empty slot (synonym, then antonym). Tap a filled slot to empty it. */
function PairDrill({ D, item, chip, task, title, titleCls = 't-display-m', sub, speak, context, labels, answers, rows, verdict, more, say, nextLabel, onNext, onClose }) {
  const [slots, setSlots] = useState([null, null]);
  const [checked, setChecked] = useState(false);
  const ok = [slots[0] === answers[0], slots[1] === answers[1]];
  const used = (o) => (o.slot != null ? slots[o.slot] === o.text : slots.includes(o.text));
  const pick = (o) => {
    if (checked || used(o)) return;
    const k = o.slot != null ? o.slot : slots[0] == null ? 0 : 1;
    const ns = [...slots]; ns[k] = o.text; setSlots(ns);
    if (ns[0] != null && ns[1] != null) {
      setChecked(true);
      rateItem(D, item.id, ns[0] === answers[0], ns[1] === answers[1]);
      if (say) say();
    }
  };
  const clear = (k) => { if (checked || slots[k] == null) return; const ns = [...slots]; ns[k] = null; setSlots(ns); };
  const active = slots[0] == null ? 0 : 1;
  const slotState = (k) => (checked ? (ok[k] ? 'correct' : 'wrong') : slots[k] != null ? 'filled' : k === active ? 'active' : 'empty');
  const optState = (o) => {
    if (!checked) return used(o) ? 'used' : '';
    if (o.slot != null ? answers[o.slot] === o.text : answers.includes(o.text)) return 'correct';
    return used(o) ? 'wrong' : 'dim';
  };
  const allOk = ok[0] && ok[1];
  return html`<div class="screen g14">
    <${LessonHeader} onClose=${onClose} n=${D.ids.length} done=${D.i + (checked ? 1 : 0)} counter=${`${D.i + 1}/${D.ids.length}`} />
    <div class="row g8"><${Chip} label=${chip} color="lavender" /><${Chip} label=${item.lvl} color=${LEVEL_CHIP[item.lvl]} /></div>
    <div class="card r32 p20 col g16">
      <div class="row between g12" style="align-items:flex-start">
        <div class="col g6" style="min-width:0"><span class="t-body-s c-secondary">${task}</span>
          <span class=${titleCls} style="overflow-wrap:anywhere">${title}</span>${sub && html`<span class="t-body-l c-secondary">${sub}</span>`}</div>
        ${speak && html`<${IconButton} icon="speaker" variant="strong" size=${52} onClick=${speak} />`}
      </div>
      ${context && html`<p class="t-body-l">${context}</p>`}
      <div class="row g8">${[0, 1].map((k) => html`<div class="col g6 grow" style="flex-basis:0;min-width:0" key=${k}>
        <span class="t-label-semibold c-secondary">${labels[k]}</span>
        <button class=${'slot slot--' + slotState(k)} onClick=${() => clear(k)}>${checked ? answers[k] : slots[k] || ''}</button></div>`)}</div>
    </div>
    <div class="col g8">${rows.map((r, n) => html`<div class="row g8" key=${n}>${r.map((o) => html`<button key=${o.slot + ':' + o.text}
      class=${cx('opt', optState(o) && 'opt--' + optState(o))} onClick=${() => pick(o)}>${o.text}</button>`)}</div>`)}</div>
    ${checked && html`<div class="card r24 col g8" style="padding:14px 16px">
      <div class="row g8" style="align-items:flex-start"><${Chip} label=${allOk ? t('drill.right') : t('drill.wrong')} color=${allOk ? 'lime' : 'coral'} size="s" />
        <span class="t-body-m-strong" style="padding-top:3px">${verdict}</span></div>
      ${more}</div>`}
    <div class="spacer"></div>
    <${Button} label=${nextLabel} arrow onClick=${onNext} disabled=${!checked} />
  </div>`;
}

// Shared round logic: which item is open, the «Готово: N из M» message at the end
function useRound(pack, kind, route, go, toast, back, nothing) {
  const ref = useRef(null);
  if (!ref.current) ref.current = createGroupDrill(pack, kind, route.level || null);
  const D = ref.current;
  const [i, setI] = useState(0);
  D.i = i;
  useEffect(() => { if (!D.ids.length) { toast(nothing); go(back); } }, []);
  const next = () => {
    if (i + 1 >= D.ids.length) { toast(t('drill.done', { n: D.right, total: D.ids.length })); go(back); return; }
    setI(i + 1); window.scrollTo(0, 0);
  };
  return { D, id: D.ids[i], next };
}

export function PhrasalDrill({ go, route, toast }) {
  const s = getState();
  const pack = getPack(s.course);
  const { D, id, next } = useRound(pack, 'phrasal', route, go, toast, 'phrasal', t('phrasal.nothing'));
  const x = id && pack.phrasalById.get(id);
  const opts = useMemo(() => (x ? phrasalOptions(pack, x) : null), [id]);
  if (!x) return null;
  const voice = tts.has(pack.tts);
  return html`<${PairDrill} key=${x.id} D=${D} item=${x} chip=${t('phrasal.chip')} task=${t('phrasal.task')} title=${'«' + tr(x, s.ui) + '»'} titleCls="t-title-l"
    context=${blankEx(x.ex)} labels=${[t('phrasal.verb'), t('phrasal.particle')]} answers=${[x.verb, x.part]}
    rows=${[opts.verbs.map((v) => ({ text: v, slot: 0 })), opts.parts.map((p) => ({ text: p, slot: 1 }))]}
    verdict=${pair(x.ph, x.ru, x.uk, s.ui)}
    more=${html`${x.ex && html`<p class="t-body-m-medium">${plainEx(x.ex)}</p><p class="t-body-s c-secondary">${exTr(x, s.ui)}</p>`}
      ${x.note && html`<p class="t-caption-regular c-secondary">${tr(x.note, s.ui)}</p>`}`}
    say=${voice ? () => tts.speak(plainEx(x.ex) || x.ph, pack.tts) : null}
    nextLabel=${t('phrasal.next')} onNext=${next} onClose=${() => go('phrasal')} />`;
}

export function SynDrill({ go, route, toast }) {
  const s = getState();
  const pack = getPack(s.course);
  const { D, id, next } = useRound(pack, 'syn', route, go, toast, 'syn', t('syn.nothing'));
  const x = id && pack.synById.get(id);
  const opts = useMemo(() => (x ? synOptions(pack, x) : []), [id]);
  if (!x) return null;
  const voice = tts.has(pack.tts);
  const rows = [];
  for (let k = 0; k < opts.length; k += 2) rows.push(opts.slice(k, k + 2).map((w) => ({ text: w })));
  return html`<${PairDrill} key=${x.id} D=${D} item=${x} chip=${t('syn.chip')} task=${t('syn.task')} title=${x.w} sub=${tr(x, s.ui)}
    speak=${voice ? () => tts.speak(x.w, pack.tts) : null}
    labels=${[t('syn.syn'), t('syn.ant')]} answers=${[x.s, x.a]} rows=${rows}
    verdict=${`${x.w} ≈ ${x.s} ≠ ${x.a}`}
    more=${html`<p class="t-body-s c-secondary">≈ ${pair(x.s, x.sRu, x.sUk, s.ui)}</p><p class="t-body-s c-secondary">≠ ${pair(x.a, x.aRu, x.aUk, s.ui)}</p>`}
    say=${voice ? () => tts.speak(`${x.w}, ${x.s}, ${x.a}`, pack.tts) : null}
    nextLabel=${t('syn.next')} onNext=${next} onClose=${() => go('syn')} />`;
}
