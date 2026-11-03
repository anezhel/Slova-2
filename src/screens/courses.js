// 08 Курсы · Слова по темам
import { html } from '../../lib/preact-htm.js';
import { t, plural, num } from '../i18n/index.js';
import { LANGUAGES, LEVELS, TOPICS, getPack, tr, wordTr } from '../content/index.js';
import { getState, update, course } from '../core/store.js';
import { courseStats } from '../core/stats.js';
import { verbsSummary } from '../core/session.js';
import { bucket } from '../core/srs.js';
import { Segmented, GroupRow, IconButton, Chip, BackHeader, StatusDot } from '../ui/kit.js';

const TINTS = ['lime', 'lavender', 'peach', 'pink', 'mint', 'sky', 'coral'];

export function Courses({ go }) {
  const s = getState();
  const pack = getPack(s.course);
  const st = courseStats(pack);
  const groups = [];
  const topics = Object.keys(TOPICS).filter((k) => pack.words.some((w) => w.topic === k));
  groups.push(html`<${GroupRow} key="topics" tile="Aa" tint="lime" title=${t('courses.topics')} subtitle=${topics.slice(0, 4).map((k) => tr(TOPICS[k], s.ui)).join(', ')}
    count=${num(pack.words.length)} onClick=${() => go('topics')} />`);
  if (pack.verbs && pack.verbs.length) {
    const v = verbsSummary(pack);
    groups.push(html`<${GroupRow} key="verbs" tile="V3" tint="lavender" title=${t('courses.verbs')} subtitle=${t('courses.verbsSub')} count=${`${v.learned}/${v.total}`} onClick=${() => go('verbs')} />`);
  }
  return html`<div class="screen screen--tab g16">
    <div class="row between"><h1 class="t-heading-h2">${t('courses.title')}</h1><${IconButton} icon="plus" onClick=${() => go('settings')} label=${t('settings.course')} /></div>
    <${Segmented} size="tab" value=${pack.id} onChange=${(v) => update((x) => { x.course = v; course(v); })}
      options=${LANGUAGES.map((p) => ({ value: p.id, label: p.code, sub: tr(p.name, s.ui) }))} />
    <div class="card r32 p20 col g16">
      <div class="row between g12" style="align-items:flex-start">
        <div class="col g6"><span class="t-caption-regular c-secondary">${t('courses.yourLevel')}</span><span class="t-display-xl">${st.current}</span></div>
        <div class="col g6" style="align-items:flex-end"><span class="t-number-l tnum">${num(st.started)}</span>
          <span class="t-caption-regular c-secondary right">${t('courses.wordsOf', { words: plural(st.started, 'words'), total: num(st.total), range: 'A1–B2' })}</span></div>
      </div>
      <div class="col g10">${LEVELS.map((l) => {
        const b = st.byLevel[l]; const pct = b.total ? Math.round((b.started / b.total) * 100) : 0;
        return html`<div class="row g10" key=${l}><span class="t-caption-strong" style="width:26px">${l}</span>
          <div class="bar hatch grow" style="height:22px"><i class=${'lv-' + l} style=${`width:${pct}%`}></i></div>
          <span class="t-caption-semibold right tnum" style="width:38px">${pct}%</span></div>`;
      })}</div>
    </div>
    <div class="row between" style="padding-top:4px;align-items:baseline"><h2 class="t-title-m">${t('courses.groups')}</h2>
      <span class="t-caption-regular c-secondary">${t('courses.groupsCount', { n: groups.length, groups: plural(groups.length, 'groups') })}</span></div>
    <div class="col g8">${groups}</div>
  </div>`;
}

export function Topics({ go }) {
  const s = getState();
  const pack = getPack(s.course);
  const cs = course(pack.id);
  const keys = Object.keys(TOPICS).filter((k) => pack.words.some((w) => w.topic === k));
  return html`<div class="screen g14">
    <${BackHeader} onBack=${() => go('courses')} right=${html`<${Chip} label=${tr(pack.name, s.ui)} />`} />
    <h1 class="t-heading-h3">${t('topics.title')}</h1>
    <div class="col g8">${keys.map((k, i) => {
      const ws = pack.words.filter((w) => w.topic === k);
      const started = ws.filter((w) => cs.words[w.id]).length;
      const name = tr(TOPICS[k], s.ui);
      return html`<${GroupRow} key=${k} tile=${name[0].toUpperCase()} tint=${TINTS[i % TINTS.length]} title=${name[0].toUpperCase() + name.slice(1)}
        subtitle=${ws.slice(0, 4).map((w) => w.w).join(', ')} count=${`${started}/${ws.length}`} onClick=${() => go('topic', { topic: k })} />`;
    })}</div>
  </div>`;
}

const STATUS = { none: 'new', new: 'learning', learning: 'learning', known: 'learned', solid: 'learned' };
export function TopicWords({ go, route }) {
  const s = getState();
  const pack = getPack(s.course);
  const cs = course(pack.id);
  const ws = pack.words.filter((w) => w.topic === route.topic);
  const name = tr(TOPICS[route.topic], s.ui) || '';
  return html`<div class="screen g14">
    <${BackHeader} onBack=${() => go('topics')} right=${html`<${Chip} label=${tr(pack.name, s.ui)} />`} />
    <h1 class="t-heading-h3">${name.charAt(0).toUpperCase() + name.slice(1)}</h1>
    <div class="col g6">${ws.map((w) => {
      const b = bucket(cs.words[w.id]);
      return html`<div class="vrow card" key=${w.id}><span class="col" style="flex:1 1 auto;min-width:0"><span class="t-body-l-strong ellipsis">${w.w}</span></span>
        <span class="t-body-m c-secondary ellipsis" style="flex:1 1 auto;min-width:0">${wordTr(w, s.ui)}</span>
        <span class="t-label-semibold c-secondary">${w.lvl}</span><${StatusDot} status=${STATUS[b]} /></div>`;
    })}</div>
  </div>`;
}
