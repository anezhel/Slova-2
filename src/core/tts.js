// Pronunciation with the phone's own voices (Web Speech API). Works offline on iPhone for the voices iOS has.
const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices = [];
const listeners = new Set();

function load() {
  if (!synth) return;
  voices = synth.getVoices() || [];
  listeners.forEach((f) => f());
}
if (synth) {
  load();
  if ('onvoiceschanged' in synth) synth.onvoiceschanged = load;
  setTimeout(load, 500); setTimeout(load, 2000);
  // iOS speaks only after a tap: unlock once on the first touch
  const unlock = () => { try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch (e) { /* ignore */ } removeEventListener('touchend', unlock); removeEventListener('click', unlock); };
  addEventListener('touchend', unlock, { once: true }); addEventListener('click', unlock, { once: true });
}

const norm = (l) => (l || '').replace('_', '-').toLowerCase();
function pick(lang) {
  const want = norm(lang), base = want.split('-')[0];
  return voices.find((v) => norm(v.lang) === want && v.localService) || voices.find((v) => norm(v.lang) === want)
    || voices.find((v) => norm(v.lang).split('-')[0] === base);
}

export const tts = {
  supported: !!synth,
  onChange(f) { listeners.add(f); return () => listeners.delete(f); },
  // false only when we know the voice list and the language is missing
  has(lang) { if (!synth) return false; if (!voices.length) return true; return !!pick(lang); },
  speak(text, lang, rate = 1) {
    if (!synth || !text) return;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      const v = pick(lang);
      if (v) u.voice = v;
      u.rate = rate;
      synth.speak(u);
    } catch (e) { console.warn('tts', e); }
  },
  stop() { try { synth && synth.cancel(); } catch (e) { /* ignore */ } },
};
