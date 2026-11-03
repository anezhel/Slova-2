// 12 Настройки — drawn from the list in src/settings/blocks.js
import { html } from '../../lib/preact-htm.js';
import { CONFIG } from '../config.js';
import { UI, t, plural, num } from '../i18n/index.js';
import { LANGUAGES, LEVELS, getPack, tr } from '../content/index.js';
import { getState, update, course } from '../core/store.js';
import { newLimit, minutesFor } from '../core/session.js';
import { saveBackup, pickFile, readBackup, restoreBackup } from '../core/backup.js';
import { tts } from '../core/tts.js';
import { SETTINGS } from '../settings/blocks.js';
import { Button, Segmented, ChoiceRow, ToggleRow, InfoRow, Ladder, Icon, cx } from '../ui/kit.js';

const Block = ({ label, children, note }) => html`<section class="col g8">
  ${label && html`<span class="t-body-m-strong">${label}</span>`}${children}${note && html`<p class="t-caption-regular c-secondary">${note}</p>`}</section>`;

const BLOCKS = {
  uiLanguage: ({ s }) => html`<${Block} label=${t('settings.uiLang')}>
    <${Segmented} options=${CONFIG.uiLanguages.map((c) => ({ value: c, label: UI[c].langName }))} value=${s.ui} onChange=${(v) => update((x) => { x.ui = v; })} /></${Block}>`,

  course: ({ s, pack }) => html`<${Block} label=${t('settings.course')} note=${t('settings.courseNote', { name: tr(pack.lower, s.ui) })}>
    <div class="card list-card">${LANGUAGES.map((p) => {
      const c = course(p.id);
      const lv = c.levels.length ? LEVELS.filter((l) => c.levels.includes(l)) : LEVELS;
      const range = lv.length > 1 ? `${lv[0]}–${lv[lv.length - 1]}` : lv[0];
      return html`<${ChoiceRow} key=${p.id} code=${p.code} name=${tr(p.name, s.ui)} note=${`${range} · ${num(p.words.length)} ${plural(p.words.length, 'words')}`}
        on=${p.id === pack.id} onClick=${() => update((x) => { x.course = p.id; })} />`;
    })}</div></${Block}>`,

  levels: ({ pack }) => {
    const c = course(pack.id);
    const toggle = (l) => update(() => { c.levels = c.levels.includes(l) ? c.levels.filter((x) => x !== l) : LEVELS.filter((x) => x === l || c.levels.includes(x)); });
    return html`<${Block} label=${t('settings.levels')} note=${t('settings.levelsNote')}>
      <div class="row g8">${LEVELS.map((l) => { const on = c.levels.includes(l); return html`<button key=${l} class=${cx('ltoggle', on ? 'lv-' + l : 'ltoggle--off')}
        aria-pressed=${on} onClick=${() => toggle(l)}>${l}${on && html`<${Icon} name="check" size=${14} />`}</button>`; })}</div></${Block}>`;
  },

  perDay: ({ pack }) => {
    const c = course(pack.id);
    const n = newLimit(c.perDay), m = minutesFor(n, c.perDay - n);
    return html`<section class="accent r32 p18 col g14">
      <div class="row between g12" style="align-items:flex-start">
        <div class="col g4 grow"><span class="t-body-m-strong c-on-accent">${t('settings.perDay')}</span>
          <span class="t-caption-regular c-on-pastel">${t('settings.perDayNote', { mode: t('settings.modes')[c.perDay] || '', n, m, minutes: plural(m, 'minutesAcc') })}</span></div>
        <span class="t-display-l c-on-accent tnum">${c.perDay}</span>
      </div>
      <div class="row g6">${CONFIG.perDayOptions.map((v) => { const on = v === c.perDay; return html`<button key=${v} class="rfull row center grow t-body-l-strong"
        style=${`flex-basis:0;height:44px;${on ? 'background:var(--bg-cta-circle);color:var(--tint-lime)' : 'border:1.5px solid var(--border-on-accent);color:var(--text-on-accent)'}`}
        aria-pressed=${on} onClick=${() => update(() => { c.perDay = v; })}>${v}</button>`; })}</div>
    </section>`;
  },

  pronunciation: ({ s, pack }) => {
    const noVoice = tts.supported ? !tts.has(pack.tts) : true;
    return html`<${Block} label=${t('settings.pron')}><div class="card r28 p16 col g14">
      <${ToggleRow} title=${t('settings.autoplay')} subtitle=${t('settings.autoplaySub')} on=${s.autoplay} onChange=${(v) => update((x) => { x.autoplay = v; })} />
      ${noVoice && html`<div class="line"></div><${InfoRow} icon="speaker" warn text=${tr(pack.noVoice, s.ui) || t('settings.noVoice', { name: tr(pack.lower, s.ui) })} />`}
    </div></${Block}>`;
  },

  reminder: () => html`<${Block} label=${t('settings.reminder')}><div class="card r28 p16"><${InfoRow} icon="bell" text=${t('settings.reminderText')} /></div></${Block}>`,

  backup: ({ toast, confirm }) => {
    const restore = async () => {
      const f = await pickFile(); if (!f) return;
      let data; try { data = await readBackup(f); } catch (e) { toast(t('settings.restoreBad')); return; }
      const date = data.exportedAt ? new Date(data.exportedAt).toLocaleDateString(getState().ui === 'uk' ? 'uk-UA' : 'ru-RU') : '—';
      if (await confirm({ title: t('settings.restoreTitle'), text: t('settings.restoreText', { date }), yes: t('settings.restoreYes') })) { restoreBackup(data); toast(t('settings.restored')); }
    };
    return html`<${Block} label=${t('settings.backup')}><p class="t-caption-regular c-secondary">${t('settings.backupText')}</p>
      <${Button} label=${t('settings.save')} variant="outline" onClick=${async () => { if (await saveBackup()) toast(t('settings.saved')); }} />
      <${Button} label=${t('settings.restore')} variant="outline" onClick=${restore} /></${Block}>`;
  },

  howItWorks: () => html`<${Block} label=${t('settings.how')}><div class="card r28 p16 col g12">
    <${Ladder} target=${4} />
    <p class="t-body-s c-secondary">${t('settings.howIntro')}</p>
    <div class="col g6">${['again', 'hard', 'good'].map((r) => html`<p class="t-body-s" key=${r}><b class="t-body-s-strong">«${t('lesson.ratings.' + r)}»</b>${t('settings.how' + r[0].toUpperCase() + r.slice(1))}</p>`)}</div>
    <p class="t-body-s c-secondary">${t('settings.howLearned')}</p></div></${Block}>`,

  reset: ({ s, pack, toast, confirm }) => {
    const name = tr(pack.lower, s.ui);
    const go = async () => {
      if (await confirm({ title: t('settings.resetTitle'), text: t('settings.resetText', { name }), yes: t('settings.resetYes'), danger: true })) {
        update((x) => { const c = course(pack.id); c.words = {}; c.verbs = {}; for (const d of Object.values(x.log)) if (d.c) delete d.c[pack.id]; });
        toast(t('settings.resetDone'));
      }
    };
    return html`<${Block} label=${t('settings.reset')}><${Button} label=${t('settings.resetBtn', { name })} variant="danger" onClick=${go} /></${Block}>`;
  },

  footer: ({ s }) => html`<p class="t-caption-regular c-secondary tc pre">${'vocca\n' + LANGUAGES.map((p) =>
    t('settings.footerItem', { name: tr(p.lower, s.ui), n: num(p.words.length), words: plural(p.words.length, 'words') })).join(' · ')}</p>`,
};

export function Settings(props) {
  const s = getState();
  const pack = getPack(s.course);
  const ctx = { ...props, s, pack };
  return html`<div class="screen screen--tab g18">
    <h1 class="t-heading-h2">${t('settings.title')}</h1>
    ${SETTINGS.map((b, i) => { const R = BLOCKS[b.type]; return R ? html`<${R} key=${b.type + i} ...${ctx} ...${b} />` : null; })}
  </div>`;
}
