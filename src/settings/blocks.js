// «Настройки» = this list of blocks, top to bottom.
// Add a setting: one line in SETTINGS (+ texts in src/i18n). Remove one: delete its line. Reorder: move the line.
// Each block type is drawn by a function in src/screens/settings.js; blocks share the same look (label + control + note).
export const SETTINGS = [
  { type: 'uiLanguage' },     // Язык интерфейса
  { type: 'course' },         // Изучаемый язык
  { type: 'levels' },         // Уровни слов
  { type: 'perDay' },         // Слов в день: 10–50
  { type: 'pronunciation' },  // Озвучивать слово сразу + нет голоса
  { type: 'reminder' },       // Напоминание (подсказка)
  { type: 'backup' },         // Резервная копия
  { type: 'howItWorks' },     // Как работает повторение
  { type: 'reset' },          // Сброс прогресса языка
  { type: 'footer' },         // vocca · сколько слов в языках
];
