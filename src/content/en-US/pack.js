// Language pack: American English. Words — words.tsv, irregular verbs — verbs.tsv (open in Excel/Numbers).
export default {
  id: 'en-US',
  code: 'EN',
  name: { ru: 'Английский (США)', uk: 'Англійська (США)' },
  lower: { ru: 'английский (США)', uk: 'англійська (США)' },
  tts: 'en-US',          // voice for pronunciation
  ipa: true,             // words have a US transcription
  tint: 'lavender',      // color of this language on «Прогресс»
  files: { words: 'words.tsv', verbs: 'verbs.tsv' },
  noVoice: {
    ru: 'На этом устройстве нет английского голоса, поэтому английские карточки будут без звука.',
    uk: 'На цьому пристрої немає англійського голосу, тому англійські картки будуть без звуку.',
  },
  // Hints for the irregular verbs trainer (column `group` in verbs.tsv)
  verbHints: {
    iau: { ru: 'i → a → u, как sing — sang — sung и swim — swam — swum.', uk: 'i → a → u, як sing — sang — sung і swim — swam — swum.' },
    same: { ru: 'Все три формы одинаковые, как cut — cut — cut и put — put — put.', uk: 'Усі три форми однакові, як cut — cut — cut і put — put — put.' },
    ought: { ru: 'Вторая и третья формы на -ought / -aught, как buy — bought — bought и teach — taught — taught.', uk: 'Друга й третя форми на -ought / -aught, як buy — bought — bought і teach — taught — taught.' },
    twin: { ru: 'Вторая и третья формы совпадают, как send — sent — sent и keep — kept — kept.', uk: 'Друга й третя форми збігаються, як send — sent — sent і keep — kept — kept.' },
    aba: { ru: 'Третья форма совпадает с первой, как come — came — come и run — ran — run.', uk: 'Третя форма збігається з першою, як come — came — come і run — ran — run.' },
    en: { ru: 'Третья форма на -en или -n, как take — took — taken и give — gave — given.', uk: 'Третя форма на -en або -n, як take — took — taken і give — gave — given.' },
    own: { ru: '-ew во второй форме и -own / -awn в третьей, как know — knew — known и draw — drew — drawn.', uk: '-ew у другій формі та -own / -awn у третій, як know — knew — known і draw — drew — drawn.' },
    oken: { ru: '-o- во второй форме и -o-…-en в третьей, как speak — spoke — spoken и choose — chose — chosen.', uk: '-o- у другій формі та -o-…-en у третій, як speak — spoke — spoken і choose — chose — chosen.' },
    itten: { ru: '-o- во второй форме и -i-…-en в третьей, как write — wrote — written и drive — drove — driven.', uk: '-o- у другій формі та -i-…-en у третій, як write — wrote — written і drive — drove — driven.' },
    ore: { ru: '-ore во второй форме и -orn в третьей, как wear — wore — worn и tear — tore — torn.', uk: '-ore у другій формі та -orn у третій, як wear — wore — worn і tear — tore — torn.' },
    us: { ru: 'Американский вариант: get — got — gotten, prove — proved — proven.', uk: 'Американський варіант: get — got — gotten, prove — proved — proven.' },
    unique: { ru: 'Особый глагол — формы стоит запомнить целиком.', uk: 'Особливе дієслово — форми варто запам’ятати повністю.' },
  },
};
