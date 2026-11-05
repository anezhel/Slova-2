// 03 Сегодня · 07 Всё повторено
import { html } from '../../lib/preact-htm.js';
import { t, plural, num } from '../i18n/index.js';
import { getPack } from '../content/index.js';
import { getState, course } from '../core/store.js';
import { planToday, forecast, verbsSummary, todaysWords } from '../core/session.js';
import { groupSummary } from '../core/groups.js';
import { streak } from '../core/stats.js';
import { addDays } from '../core/dates.js';
import { Button, Progress, Chip, Icon } from '../ui/kit.js';

const Stat = ({ value, label }) => html`<div class="col g4 grow" style="flex-basis:0"><span class="t-number-l tnum">${value}</span><span class="t-caption-regular c-secondary">${label}</span></div>`;

function Forecast({ counts, doneToday }) {
  const max = Math.max(1, ...counts);
  const wd = t('weekdays');
  const label = (i) => (i === 0 ? t('today.today') : i === 1 ? t('today.tomorrow') : wd[new Date(addDays(Date.now(), i)).getDay()]);
  return html`<div class="card r28 col g16" style="padding:16px 16px 14px">
    <div class="row between"><span class="t-body-m-strong">${t('today.forecast')}</span><span class="t-caption-regular c-secondary">${t('today.forecastNote')}</span></div>
    <div class="row g8" style="align-items:stretch">${counts.map((c, i) => html`<div class="col g6 grow" style="flex-basis:0">
      <div class="col" style="height:40px;justify-content:flex-end">
        <div class=${i === 0 ? '' : 'hatch'} style=${`height:${c ? Math.max(8, Math.round((40 * c) / max)) : 4}px;border-radius:8px;${i === 0 ? 'background:var(--bg-meter)' : ''}`}></div></div>
      <span class="t-body-m-strong tnum">${i === 0 && doneToday ? '✓' : c}</span><span class="t-label-semibold c-secondary">${label(i)}</span></div>`)}</div>
  </div>`;
}

function VerbsTile({ pack, go }) {
  const v = verbsSummary(pack);
  return html`<button class="inverse r28 row g14" style="height:80px;padding:0 14px;text-align:left" onClick=${() => go('verbs')}>
    <span class="rfull row center" style="width:52px;height:52px;background:var(--bg-inverse-2);flex:none"><span class="t-body-l-strong c-inverse-accent">V3</span></span>
    <span class="col g2 grow"><span class="t-body-l-strong c-on-inverse">${t('today.verbsTitle')}</span>
      <span class="t-caption-regular c-on-inverse-2">${v.due ? t('today.verbsDue', { n: v.due, verbs: plural(v.due, 'verbs') }) : t('today.verbsNone')}</span></span>
    <span class="rfull row center" style="width:48px;height:48px;background:var(--bg-cta-on-inverse);color:var(--text-on-cta-inverse);flex:none"><${Icon} name="arrow-right" size=${18} /></span>
  </button>`;
}

// Phrasal verbs and synonyms: a tile only when something is due today
function GroupTiles({ pack, go }) {
  return [['phrasal', 'up'], ['syn', '≈']].filter(([kind]) => pack[kind] && pack[kind].length).map(([kind, tile]) => {
    const g = groupSummary(pack, kind);
    return g.due ? html`<button key=${kind} class="inverse r28 row g14" style="height:80px;padding:0 14px;text-align:left" onClick=${() => go(kind)}>
      <span class="rfull row center" style="width:52px;height:52px;background:var(--bg-inverse-2);flex:none"><span class="t-body-l-strong c-inverse-accent">${tile}</span></span>
      <span class="col g2 grow"><span class="t-body-l-strong c-on-inverse">${t('courses.' + kind)}</span>
        <span class="t-caption-regular c-on-inverse-2">${t('today.groupDue', { n: g.due })}</span></span>
      <span class="rfull row center" style="width:48px;height:48px;background:var(--bg-cta-on-inverse);color:var(--text-on-cta-inverse);flex:none"><${Icon} name="arrow-right" size=${18} /></span>
    </button>` : null;
  });
}

export function Today({ go }) {
  const s = getState();
  const pack = getPack(s.course);
  const plan = planToday(pack);
  const fc = forecast(pack, 5);
  fc[0] = plan.total;
  const allDone = plan.left === 0 && plan.done > 0;
  const verbs = pack.verbs && pack.verbs.length;
  const again = todaysWords(pack).length > 0;

  if (plan.total === 0) {
    const noLevels = !course(pack.id).levels.length;
    return html`<div class="screen screen--tab g16">
      <h1 class="t-heading-h3 pre">${t(noLevels ? 'today.noLevelsTitle' : 'today.emptyTitle')}</h1>
      <div class="card r32 p18 col g16"><p class="t-body-s c-secondary">${t(noLevels ? 'today.noLevelsText' : 'today.emptyText')}</p>
        <${Button} label=${t('today.openSettings')} arrow onClick=${() => go('settings')} />
        ${!noLevels && again && html`<${Button} label=${t('today.again')} variant="secondary" onClick=${() => go('lesson', { practice: true })} />`}</div>
      ${verbs && html`<${VerbsTile} pack=${pack} go=${go} />`}
      <${GroupTiles} pack=${pack} go=${go} />
    </div>`;
  }

  if (allDone) {
    const st = streak(s.log);
    const minutes = Math.max(1, Math.round(plan.secToday / 60));
    return html`<div class="screen screen--tab g14">
      <div class="col g6">${st > 0 && html`<span><${Chip} label=${t('today.streak', { n: st, days: plural(st, 'days') })} color="peach" size="xs" /></span>`}
        <h1 class="t-heading-h3 pre">${t('today.doneTitle')}</h1></div>
      <div class="card r32 p18 col" style="gap:40px">
        <div class="row g8"><${Stat} value=${`${plan.done}/${plan.total}`} label=${t('today.reviewed')} />
          <${Stat} value=${plan.newToday} label=${plural(plan.newToday, 'newWords')} />
          <${Stat} value=${minutes} label=${plural(minutes, 'minutes')} /></div>
        <${Button} label=${t('today.again')} arrow icon="rotate-ccw" onClick=${() => go('lesson', { practice: true })} disabled=${!again} />
      </div>
      <${Forecast} counts=${fc} doneToday=${true} />
      ${verbs && html`<${VerbsTile} pack=${pack} go=${go} />`}
      <${GroupTiles} pack=${pack} go=${go} />
    </div>`;
  }

  return html`<div class="screen screen--tab g16">
    <h1 class="t-heading-h3 pre">${t('today.title', { n: num(plan.total), words: plural(plan.total, 'words') })}</h1>
    <div class="card r32 p18 col g16">
      <div class="row g8"><${Stat} value=${plan.fresh.length} label=${plural(plan.fresh.length, 'newShort')} />
        <${Stat} value=${plan.reviews.length} label=${t('today.review')} />
        <${Stat} value=${'≈' + plan.minutes} label=${plural(plan.minutes, 'minutes')} /></div>
      <${Progress} n=${plan.total} done=${plan.done} />
      <${Button} label=${t(plan.done ? 'today.continue' : 'today.start')} arrow onClick=${() => go('lesson')} />
    </div>
    <${Forecast} counts=${fc} doneToday=${false} />
    ${verbs && html`<${VerbsTile} pack=${pack} go=${go} />`}
      <${GroupTiles} pack=${pack} go=${go} />
  </div>`;
}
