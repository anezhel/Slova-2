// 04 Новое слово · 05 Вспомните и скажите · 06 Ответ и оценка
import { html, useState, useEffect, useRef } from '../../lib/preact-htm.js';
import { CONFIG } from '../config.js';
import { t } from '../i18n/index.js';
import { getPack, wordTr, exTr } from '../content/index.js';
import { getState } from '../core/store.js';
import { planToday, todaysWords, createLesson, nextTask, introDone, answer, targetStep, lessonDone } from '../core/session.js';
import { tts } from '../core/tts.js';
import { Button, SmallButton, IconButton, Chip, LessonHeader, Ladder, Orb, RatingTile, Ipa, LEVEL_CHIP } from '../ui/kit.js';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// "The bus isn't very reliable." -> "The bus isn't very ____."  (empty if the word is not found)
export function blank(sentence, word) {
  if (!sentence || !word) return '';
  const w = word.toLowerCase();
  const tries = [w];
  if (w.length > 4) tries.push(w.slice(0, -2)); else if (w.length > 3) tries.push(w.slice(0, -1));
  for (const stem of tries) {
    const m = new RegExp('(^|[^\\p{L}])(' + esc(stem) + '[\\p{L}\']*)', 'iu').exec(sentence);
    if (m) { const i = m.index + m[1].length; return sentence.slice(0, i) + '____' + sentence.slice(i + m[2].length); }
  }
  return '';
}

export function Lesson({ go, route, confirm }) {
  const s = getState();
  const pack = getPack(s.course);
  const ref = useRef(null);
  if (!ref.current) {
    const plan = route.practice ? { fresh: [], reviews: todaysWords(pack) } : planToday(pack);
    ref.current = createLesson(pack, plan, !!route.practice);
    ref.current.firstTask = nextTask(ref.current);
  }
  const L = ref.current;
  const [task, setTask] = useState(L.firstTask);
  const [phase, setPhase] = useState(L.firstTask && L.firstTask.type === 'intro' ? 'intro' : 'recall');
  const [rating, setRating] = useState(null);
  const voice = tts.has(pack.tts);

  const advance = () => {
    const nt = nextTask(L);
    if (!nt) { go('today'); return; }
    setTask(nt); setPhase(nt.type === 'intro' ? 'intro' : 'recall'); setRating(null);
    window.scrollTo(0, 0);
  };
  useEffect(() => { if (!task) go('today'); }, []);
  const word = task && pack.byId.get(task.id);
  const say = (rate = 1) => voice && word && tts.speak(word.w, pack.tts, rate);
  useEffect(() => { if (word && s.autoplay && (phase === 'intro' || phase === 'answer')) setTimeout(() => say(), 250); }, [task, phase]);
  useEffect(() => () => tts.stop(), []);
  if (!word) return null;

  const it = L.items.get(word.id);
  const close = async () => { if (await confirm({ title: t('lesson.quitTitle'), text: t('lesson.quitText'), yes: t('lesson.quitYes'), no: t('lesson.quitNo') })) go('today'); };
  const done = lessonDone(L);
  const ui = s.ui;

  if (phase === 'intro') {
    return html`<div class="screen g12">
      <${LessonHeader} onClose=${close} n=${L.newTotal} done=${L.newSeen + 1} counter=${`${L.newSeen + 1}/${L.newTotal}`} />
      <div class="row g8"><${Chip} label=${t('lesson.newWord')} color="lime" /><${Chip} label=${word.lvl} color=${LEVEL_CHIP[word.lvl]} /></div>
      <div class="card r32 col g12" style="padding:32px 20px">
        <div class="row between g12" style="align-items:flex-start">
          <div class="col g6" style="min-width:0">
            <span class="t-display-l" style="overflow-wrap:anywhere">${word.w}</span>
            <span class="t-body-l c-secondary">${pack.ipa && word.ipa ? html`<${Ipa} ipa=${word.ipa} /> · ` : ''}${word.pos ? t('pos.' + word.pos) : ''}</span>
          </div>
          ${voice && html`<${IconButton} icon="speaker" variant="strong" size=${56} onClick=${() => say()} />`}
        </div>
        <span class="t-title-l">${wordTr(word, ui)}</span>
        ${voice && html`<div class="row g8"><${SmallButton} icon="play" label=${t('lesson.listen')} onClick=${() => say()} />
          <${SmallButton} speed="0.5×" label=${t('lesson.slow')} onClick=${() => say(CONFIG.slowRate)} /></div>`}
      </div>
      ${word.ex && html`<button class="soft r24 col g4" style="padding:14px 16px;text-align:left" onClick=${() => voice && tts.speak(word.ex, pack.tts)}>
        <span class="t-body-l-medium">${word.ex}</span><span class="t-body-s c-secondary">${exTr(word, ui)}</span></button>`}
      <div class="spacer col" style="justify-content:flex-end"><p class="t-body-s c-secondary tc">${t('lesson.sayAloud')}</p></div>
      <${Button} label=${t('common.next')} arrow onClick=${() => { introDone(L, word.id); advance(); }} />
    </div>`;
  }

  if (phase === 'recall') return html`<${Recall} key=${word.id + ':' + L.pos} L=${L} word=${word} ui=${ui} done=${done} close=${close} onReveal=${() => setPhase('answer')} />`;

  // answer + rating
  const preview = rating || 'good';
  const target = targetStep(it, preview);
  const note = preview === 'again' ? t('lesson.repeatAgain') : t('lesson.repeatIn', { t: t('lesson.stepsLong')[target] });
  const next = () => { answer(L, word.id, rating); advance(); };
  const finish = () => { if (rating) answer(L, word.id, rating); go('today'); };
  return html`<div class="screen g14">
    <${LessonHeader} onClose=${close} n=${L.total} done=${done + (rating ? 1 : 0)} counter=${`${Math.min(L.total, done + 1)}/${L.total}`} />
    <div class="card r32 col g20" style="padding:40px 18px 40px 20px">
      <div class="row g8"><${Chip} label=${L.practice ? t('lesson.practice') : t('lesson.correct')} color="neutral" /></div>
      <div class="row between g12">
        <div class="col g4" style="min-width:0"><span class="t-number-l" style="overflow-wrap:anywhere">${word.w}</span>
          <span class="t-body-m c-secondary">${wordTr(word, ui)}${pack.ipa && word.ipa ? html` · <${Ipa} ipa=${word.ipa} size="m" />` : ''}</span></div>
        ${voice && html`<${IconButton} icon="speaker" variant="strong" size=${52} onClick=${() => say()} />`}
      </div>
    </div>
    <div class="row" style="padding-top:4px"><h2 class="t-title-m">${t('lesson.howEasy')}</h2></div>
    <div class="row g10">${['again', 'hard', 'good'].map((r) => html`<${RatingTile} key=${r} label=${t('lesson.ratings.' + r)} on=${rating === r} onClick=${() => setRating(r)} />`)}</div>
    ${L.practice ? html`<p class="t-caption-regular c-secondary">${t('lesson.practiceNote')}</p>` : html`<div class="card r28 col g14" style="padding:24px 16px">
      <div class="row between g8"><span class="t-body-m-strong">${t('lesson.path')}</span><span class="t-caption-regular c-secondary">${note}</span></div>
      <${Ladder} target=${target} /></div>`}
    <div class="spacer"></div>
    <div class="row g10"><${Button} label=${t('lesson.finish')} variant="secondary" hug onClick=${finish} />
      <${Button} label=${t('lesson.nextCard')} arrow onClick=${next} disabled=${!rating} /></div>
  </div>`;
}

function Recall({ L, word, ui, done, close, onReveal }) {
  const total = CONFIG.answerPause;
  const [left, setLeft] = useState(total);
  useEffect(() => {
    if (left <= 0) { const id = setTimeout(onReveal, 350); return () => clearTimeout(id); }
    const id = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  const ctx = blank(word.ex, word.w);
  return html`<div class="screen g14">
    <${LessonHeader} onClose=${close} n=${L.total} done=${done} counter=${`${Math.min(L.total, done + 1)}/${L.total}`} />
    <div class="col g4 center"><span class="t-display-m">«${wordTr(word, ui)}»</span>${ctx && html`<span class="t-body-m c-secondary">${ctx}</span>`}</div>
    <div class="col center g18 spacer">
      <${Orb} count=${left} frac=${left / total} />
      <div class="col g4 center"><span class="t-title-s">${t('lesson.say')}</span><span class="t-body-s c-secondary">${t('lesson.pauseLeft', { n: left })}</span></div>
    </div>
    <${Button} label=${t('lesson.showAnswer')} variant="secondary" onClick=${onReveal} />
  </div>`;
}
