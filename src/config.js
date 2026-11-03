// vocca — settings for whoever maintains the app. One line here changes the design or a default.

export const CONFIG = {
  // Design: 'festival' | 'classic-light' | 'classic-dark' | 'classic' (light or dark like the phone).
  // Colors, fonts and effects of every theme come from Figma (src/theme/tokens.css).
  theme: 'festival',

  // Interface languages. New one = a file in src/i18n/ + one line in src/i18n/index.js.
  uiLanguages: ['ru', 'uk'],

  // Words per day (settings) and how many of them may be new.
  perDayOptions: [10, 20, 30, 40, 50],
  perDayDefault: 20,
  newPerDay: { 10: 3, 20: 5, 30: 8, 40: 10, 50: 13 },

  // Lesson
  answerPause: 5,        // seconds to say the answer aloud («Вспомните и скажите»)
  secondsPerNew: 60,     // estimate for «≈ N минут»
  secondsPerReview: 20,
  maxShowsPerLesson: 8,  // a word is not shown more often than this in one lesson

  // Other
  drillSize: 10,         // verbs in one trainer round
  testSize: 6,           // words in the vocabulary test
  slowRate: 0.5,         // «0.5× Медленно»
};
