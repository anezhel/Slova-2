// App shell: which screen is open, bottom menu, dialogs and short messages.
import { html, useState, useEffect, useReducer, useRef } from '../lib/preact-htm.js';
import { getState, subscribe } from './core/store.js';
import { tts } from './core/tts.js';
import { setUiLang } from './i18n/index.js';
import { Backdrop, NavBar, Sheet } from './ui/kit.js';
import { Onboarding, VocabTest } from './screens/onboarding.js';
import { Today } from './screens/today.js';
import { Lesson } from './screens/lesson.js';
import { Courses, Topics, TopicWords } from './screens/courses.js';
import { Verbs, Drill } from './screens/verbs.js';
import { Progress } from './screens/progress.js';
import { Settings } from './screens/settings.js';

// Screen name -> component. A new screen = one line here.
const SCREENS = { onboarding: Onboarding, test: VocabTest, today: Today, lesson: Lesson, courses: Courses, topics: Topics,
  topic: TopicWords, verbs: Verbs, drill: Drill, progress: Progress, settings: Settings };
const TABS = ['today', 'courses', 'progress', 'settings'];

export function App() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => subscribe(force), []);
  useEffect(() => tts.onChange(force), []);
  const s = getState();
  setUiLang(s.ui);
  const [route, setRoute] = useState(() => ({ name: s.onboarded && s.course ? 'today' : 'onboarding', n: 0 }));
  const [msg, setMsg] = useState(null);
  const [sheet, setSheet] = useState(null);
  const timer = useRef(0);

  const go = (name, params = {}) => { setRoute({ name, ...params, n: route.n + 1 }); window.scrollTo(0, 0); };
  const toast = (text) => { setMsg(text); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(null), 2800); };
  const confirm = (opts) => new Promise((resolve) => setSheet({ ...opts, resolve }));
  const close = (v) => { const r = sheet && sheet.resolve; setSheet(null); r && r(v); };

  const Screen = SCREENS[route.name] || Today;
  return html`
    <${Backdrop} />
    <${Screen} key=${route.name + route.n} route=${route} go=${go} toast=${toast} confirm=${confirm} />
    ${TABS.includes(route.name) && html`<${NavBar} active=${route.name} onNav=${go} />`}
    ${msg && html`<div class="toast" role="status">${msg}</div>`}
    ${sheet && html`<${Sheet} ...${sheet} onYes=${() => close(true)} onNo=${() => close(false)} />`}`;
}
