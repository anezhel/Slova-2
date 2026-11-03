// 01 Выбор языков · 02 Тест словаря
import { html, useState } from '../../lib/preact-htm.js';
import { CONFIG } from '../config.js';
import { UI, t } from '../i18n/index.js';
import { LANGUAGES, LEVELS, getPack, tr } from '../content/index.js';
import { getState, update, course } from '../core/store.js';
import { testWords, testLevel } from '../core/session.js';
import { tts } from '../core/tts.js';
import { Button, Segmented, CourseCard, IconButton, Progress, Chip, Ipa, LEVEL_CHIP, cx } from '../ui/kit.js';

export function Onboarding({ go }) {
  const s = getState();
  const [courseId, setCourse] = useState(s.course || LANGUAGES[0].id);
  return html`<div class="screen g24">
    <div class="row between"><span class="t-brand-wordmark">vocca</span><span class="t-body-s c-secondary">${t('onboarding.step', { n: 1 })}</span></div>
    <h1 class="t-display-m pre">${t('onboarding.title')}</h1>
    <div class="col g10">
      <span class="t-body-m-strong">${t('onboarding.uiLang')}</span>
      <${Segmented} options=${CONFIG.uiLanguages.map((c) => ({ value: c, label: UI[c].langName }))} value=${s.ui} onChange=${(v) => update((st) => { st.ui = v; })} />
    </div>
    <div class="col g10">
      <span class="t-body-m-strong">${t('onboarding.course')}</span>
      ${LANGUAGES.map((p) => html`<${CourseCard} key=${p.id} code=${p.code} name=${tr(p.name, s.ui)} note="A1–B2" on=${p.id === courseId} onClick=${() => setCourse(p.id)} />`)}
    </div>
    <div class="spacer"></div>
    <${Button} label=${t('onboarding.next')} arrow onClick=${() => { update((st) => { st.course = courseId; course(courseId); }); go('test'); }} />
  </div>`;
}

export function VocabTest({ go, toast }) {
  const s = getState();
  const pack = getPack(s.course);
  const [words] = useState(() => testWords(pack));
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState([]);
  const w = words[i];
  const est = testLevel(answers);
  const estIdx = est ? LEVELS.indexOf(est) : -1;

  const done = (ans) => {
    const lvl = testLevel(ans);
    const k = lvl ? LEVELS.indexOf(lvl) : 0;
    const levels = LEVELS.slice(k, k + 2);
    update((st) => { course(pack.id).levels = levels; st.onboarded = true; });
    toast(t('test.result', { levels: levels.join(', ') }));
    go('today');
  };
  const reply = (known) => {
    const ans = [...answers, { lvl: w.lvl, known }];
    setAnswers(ans);
    if (i + 1 >= words.length) done(ans); else setI(i + 1);
  };
  const skip = () => { update((st) => { st.onboarded = true; }); toast(t('test.resultNone')); go('today'); };
  if (!w) { skip(); return null; }
  const voice = tts.has(pack.tts);

  return html`<div class="screen g18">
    <div class="row between">
      <${IconButton} icon="chevron-left" onClick=${() => go('onboarding')} label=${t('common.back')} />
      <span class="t-body-s c-secondary">${t('onboarding.step', { n: 2 })}</span>
      <button class="t-body-m-strong" onClick=${skip}>${t('common.skip')}</button>
    </div>
    <h1 class="t-heading-h3 pre">${t('test.title')}</h1>
    <div class="col g8">
      <${Progress} n=${words.length} done=${i} />
      <div class="row between t-caption-regular c-secondary"><span>${t('test.wordOf', { n: i + 1, total: words.length })}</span><span>${tr(pack.name, s.ui)} · A1–B2</span></div>
    </div>
    <div class="card r32 p20 col between" style="min-height:244px">
      <div class="row between" style="align-items:flex-start">
        <${Chip} label=${w.lvl} color=${LEVEL_CHIP[w.lvl]} />
        ${voice && html`<${IconButton} icon="speaker" variant="strong" size=${52} onClick=${() => tts.speak(w.w, pack.tts)} />`}
      </div>
      <div class="col g8"><span class="t-display-l" style="overflow-wrap:anywhere">${w.w}</span>${pack.ipa && html`<span class="c-secondary"><${Ipa} ipa=${w.ipa} /></span>`}</div>
    </div>
    <div class="soft r24 row between g12" style="padding:14px 16px">
      <span class="t-body-s c-secondary">${t('test.hint')}</span>
      <span class="row g4">${LEVELS.map((l, k) => html`<span class=${cx('lbadge', k <= estIdx ? 'lv-' + l : 'lbadge--off')}>${l}</span>`)}</span>
    </div>
    <div class="spacer"></div>
    <div class="row g10">
      <${Button} label=${t('test.dontKnow')} variant="secondary" onClick=${() => reply(false)} />
      <${Button} label=${t('test.know')} onClick=${() => reply(true)} />
    </div>
  </div>`;
}
