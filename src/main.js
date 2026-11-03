import { html, render } from '../lib/preact-htm.js';
import { CONFIG } from './config.js';
import { loadContent } from './content/index.js';
import { App } from './app.js';

document.documentElement.dataset.theme = CONFIG.theme;
const canvas = getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim();
if (canvas) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', canvas);

if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

loadContent().then(() => {
  render(html`<${App} />`, document.getElementById('app'));
}).catch((e) => {
  console.error(e);
  document.getElementById('app').innerHTML = '<p style="padding:40px 20px;font:16px system-ui">vocca: не удалось загрузить слова. Проверьте интернет и откройте снова.</p>';
});

// Offline: cache the app on the phone (sw.js). A new version is picked up on the next launch.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('sw', e));
}
