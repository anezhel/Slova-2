// 11 Прогресс
import { html, useState } from '../../lib/preact-htm.js';
import { t, plural, num } from '../i18n/index.js';
import { LANGUAGES } from '../content/index.js';
import { getState } from '../core/store.js';
import { streak, period, courseStats } from '../core/stats.js';
import { addDays, startOfDay } from '../core/dates.js';
import { Segmented, Chip } from '../ui/kit.js';

const TINT = (p) => `var(--tint-${p.tint || 'lavender'})`;

function Repeats({ mode, log }) {
  const wd = t('weekdays');
  let bars, total;
  if (mode === 'week') {
    const p = period(log, 7);
    total = p.r;
    bars = p.days.map((d, i) => ({ v: d.r, label: i === 6 ? t('progress.todayShort') : wd[new Date(d.key + 'T12:00').getDay()], today: i === 6 }));
  } else {
    const p = period(log, 28);
    total = p.r;
    const months = t('months');
    bars = [0, 1, 2, 3].map((w) => {
      const days = p.days.slice(w * 7, w * 7 + 7);
      const first = new Date(days[0].key + 'T12:00');
      return { v: days.reduce((a, d) => a + d.r, 0), label: `${first.getDate()} ${months[first.getMonth()]}`, today: w === 3 };
    });
  }
  const max = Math.max(1, ...bars.map((b) => b.v));
  return html`<div class="card r32 p18 col g14">
    <div class="row between"><span class="t-title-s">${t('progress.repeats')}</span><span class="t-caption-regular c-secondary">${t(mode === 'week' ? 'progress.repeatsWeek' : 'progress.repeatsMonth', { n: num(total) })}</span></div>
    <div class="row g8" style="align-items:stretch">${bars.map((b) => html`<div class="col g6 grow" style="flex-basis:0;align-items:center">
      <span class="t-label-semibold tnum">${b.v}</span>
      <div class="col" style="height:96px;width:100%;justify-content:flex-end">
        <div style=${`height:${b.v ? Math.max(6, Math.round((96 * b.v) / max)) : 3}px;border-radius:10px;` + (b.today ? 'background:var(--bg-chart-today);border:2px solid var(--border-strong)' : 'background:var(--bg-meter)')}></div></div>
      <span class=${b.today ? 't-micro-bold' : 't-micro-regular c-secondary'}>${b.label}</span></div>`)}</div>
  </div>`;
}

export function Progress() {
  const s = getState();
  const [mode, setMode] = useState('week');
  const days = mode === 'week' ? 7 : 28;
  const since = startOfDay(addDays(Date.now(), -(days - 1)));
  const stats = LANGUAGES.map((p) => ({ p, st: courseStats(p, since) }));
  const known = stats.reduce((a, x) => a + x.st.started, 0);
  const recent = stats.reduce((a, x) => a + x.st.recent, 0);
  const langsUsed = Math.max(1, stats.filter((x) => x.st.started).length);
  const per = period(s.log, days);
  const sr = streak(s.log);
  const h = Math.floor(per.sec / 3600), m = Math.round((per.sec % 3600) / 60);
  const buckets = stats.reduce((a, x) => { for (const k in a) a[k] += x.st.buckets[k]; return a; }, { new: 0, learning: 0, known: 0, solid: 0 });
  const bTotal = Math.max(1, buckets.new + buckets.learning + buckets.known + buckets.solid);
  const B = [['new', 'hatch', null], ['learning', '', 'var(--tint-peach)'], ['known', '', 'var(--tint-lavender)'], ['solid', '', 'var(--bg-accent)']];

  return html`<div class="screen screen--tab g16">
    <div class="row between"><h1 class="t-heading-h2">${t('progress.title')}</h1>
      <${Segmented} size="s" value=${mode} onChange=${setMode} options=${[{ value: 'week', label: t('progress.week') }, { value: 'month', label: t('progress.month') }]} /></div>
    <div class="inverse r32 p20 col g16">
      <div class="row between g12" style="align-items:flex-start">
        <div class="col g6"><span class="t-body-s c-on-inverse-2">${t('progress.known', { n: langsUsed, languages: plural(langsUsed, 'languages') })}</span>
          <span class="t-display-xl c-inverse-accent tnum">${num(known)}</span></div>
        <${Chip} label=${t(mode === 'week' ? 'progress.plusWeek' : 'progress.plusMonth', { n: num(recent) })} color="inverse-soft" />
      </div>
      <div class="row g8">${[[t('progress.streakVal', { n: sr }), t('progress.streak')],
        [per.accuracy == null ? '—' : per.accuracy + '%', t('progress.accuracy')],
        [h ? t('progress.hm', { h, m }) : t('progress.m', { m }), t('progress.time')]].map(([v, l]) => html`<div class="col g2 grow r16"
          style="flex-basis:0;padding:10px 12px;background:var(--bg-inverse-2)"><span class="t-title-s c-on-inverse nowrap">${v}</span><span class="t-label-semibold c-on-inverse-2">${l}</span></div>`)}</div>
    </div>
    <div class="card r32 p18 col g14">
      <div class="row between"><span class="t-title-s">${t('progress.byLang')}</span><span class="t-caption-regular c-secondary">${t('progress.byLangNote')}</span></div>
      <div class="row g12">${stats.map(({ p, st }) => {
        const pct = st.total ? Math.round((st.started / st.total) * 100) : 0;
        return html`<div class="col g8 grow" style="flex-basis:0;min-width:0" key=${p.id}><span class="t-title-l tnum">${pct}%</span>
          <div class="vbar hatch r22" style="height:140px"><i style=${`height:${pct}%;background:${TINT(p)}`}></i></div>
          <span class="col g2"><span class="t-body-s-strong">${p.code} · ${st.current}</span><span class="t-label-semibold c-secondary">${t('progress.wordsOf', { a: num(st.started), b: num(st.total) })}</span></span></div>`;
      })}</div>
    </div>
    <${Repeats} mode=${mode} log=${s.log} />
    <div class="card r32 p18 col g12">
      <div class="row between"><span class="t-title-s">${t('progress.memory')}</span><span class="t-caption-regular c-secondary">${t('progress.memoryNote')}</span></div>
      <div class="row g4" style="height:22px;align-items:stretch">${B.map(([k, cls, bg]) => buckets[k] ? html`<span key=${k} class=${cls} style=${`flex:${buckets[k] / bTotal} 1 0;min-width:9px;border-radius:8px;${bg ? 'background:' + bg : ''}`}></span>` : null)}
        ${!(bTotal > 1 || buckets.new) && html`<span class="hatch grow" style="border-radius:8px"></span>`}</div>
      <div class="row g12 wrap">${B.map(([k, cls, bg]) => html`<div class="row g8" key=${k} style="flex:1 1 40%">
        <span class=${cls} style=${`width:14px;height:14px;border-radius:999px;flex:none;${bg ? 'background:' + bg : ''}`}></span>
        <span class="t-caption-regular grow">${t('progress.buckets.' + k)}</span><span class="t-caption-strong tnum">${num(buckets[k])}</span></div>`)}</div>
    </div>
  </div>`;
}
