// UI kit — one function per Figma component. Looks come from CSS (tokens), not from here.
import { html } from '../../lib/preact-htm.js';
import { ICONS } from './icons.js';
import { t } from '../i18n/index.js';

export { html };
export const cx = (...a) => a.filter(Boolean).join(' ');
const ICON_SIZE = { 40: 16, 48: 20, 52: 22, 56: 24 };
export const LEVEL_CHIP = { A1: 'lime', A2: 'lavender', B1: 'peach', B2: 'pink' };

export const Icon = ({ name, size = 20 }) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" aria-hidden="true" dangerouslySetInnerHTML=${{ __html: ICONS[name] || '' }}></svg>`;

export const Backdrop = () => html`<div class="backdrop" aria-hidden="true"><i class="g-lime"></i><i class="g-yellow"></i><i class="g-blue"></i><i class="g-lavender"></i></div>`;

export function Button({ label, variant = 'primary', arrow = false, icon = 'arrow-right', onClick, disabled, hug, cls }) {
  return html`<button class=${cx('btn', 'btn--' + variant, arrow && 'btn--arrow', hug && 'btn--hug', cls)} onClick=${onClick} disabled=${disabled}>
    <span class="btn__label">${label}</span>
    ${arrow && html`<span class="btn__circle"><${Icon} name=${icon} size=${20} /></span>`}
  </button>`;
}

export const SmallButton = ({ label, icon, speed, onClick }) => html`<button class="btn-sm" onClick=${onClick}>
  ${speed ? html`<span class="btn-sm__speed">${speed}</span>` : html`<${Icon} name=${icon} size=${18} />`}<span>${label}</span></button>`;

export const IconButton = ({ icon, variant = 'surface', size = 48, onClick, label, disabled }) => html`<button
  class=${cx('ib', 'ib--' + variant, 'ib--' + size)} onClick=${onClick} aria-label=${label || icon} disabled=${disabled}><${Icon} name=${icon} size=${ICON_SIZE[size] || 20} /></button>`;

export const Chip = ({ label, color = 'neutral', size = 'm', icon }) => html`<span class=${cx('chip', 'chip--' + color, size !== 'm' && 'chip--' + size)}>
  ${icon && html`<${Icon} name=${icon} size=${size === 'm' ? 14 : 12} />`}${label}</span>`;

export function Segmented({ options, value, onChange, size = 'm', cls }) {
  return html`<div class=${cx('seg', size === 's' && 'seg--s', cls)} role="tablist">${options.map((o) => html`<button key=${o.value} role="tab"
    aria-selected=${o.value === value} class=${cx('segment', size === 's' && 'segment--s', size === 'tab' && 'segment--tab', o.value === value && 'segment--on')}
    onClick=${() => o.value !== value && onChange(o.value)}>${o.label}${o.sub && html`<span class="segment__sub">${o.sub}</span>`}</button>`)}</div>`;
}

export const Toggle = ({ on, onChange, label }) => html`<button class=${cx('toggle', on && 'toggle--on')} role="switch" aria-checked=${on} aria-label=${label} onClick=${() => onChange(!on)}><i></i></button>`;

export const Progress = ({ n, done }) => html`<div class="pseg grow">${Array.from({ length: Math.max(1, n) }, (_, i) => html`<i class=${i < done ? 'on' : ''}></i>`)}</div>`;

export const StatusDot = ({ status }) => html`<span class=${'sdot sdot--' + status}>${status === 'learned' && html`<${Icon} name="check" size=${12} />`}</span>`;

export function Ladder({ target }) {
  const labels = t('lesson.steps');
  return html`<div class="ladder">${labels.map((l, i) => {
    const st = i < target ? 'done' : i === target ? 'next' : 'todo';
    return html`<div class=${'lstep lstep--' + st}><span class="lstep__dot">${st === 'done' && html`<${Icon} name="check" size=${12} />`}</span><span class="lstep__label">${l}</span></div>`;
  })}</div>`;
}

const NAV = [['today', 'home'], ['courses', 'book'], ['progress', 'bars'], ['settings', 'gear']];
export const NavBar = ({ active, onNav }) => html`<nav class="nav">${NAV.map(([id, icon]) => html`<button key=${id}
  class=${cx('nav-item', id === active && 'nav-item--on')} aria-label=${t('nav.' + id)} aria-current=${id === active ? 'page' : null}
  onClick=${() => id !== active && onNav(id)}><${Icon} name=${icon} size=${22} /><span class="nav-item__label">${t('nav.' + id)}</span></button>`)}</nav>`;

const R = 118, C = 2 * Math.PI * R;
export const Orb = ({ count, frac }) => html`<div class="orb">
  <svg viewBox="0 0 240 240" aria-hidden="true"><circle class="orb__track" cx="120" cy="120" r=${R} fill="none" stroke-width="4" />
    <circle class="orb__arc" cx="120" cy="120" r=${R} fill="none" stroke-width="4" stroke-linecap="round" stroke-dasharray=${C} stroke-dashoffset=${C * (1 - frac)} /></svg>
  <div class="orb__ball">${count}</div></div>`;

export const CourseCard = ({ code, name, note, on, onClick }) => html`<button class=${cx('ccard', on ? 'ccard--on' : 'card')} onClick=${onClick} aria-pressed=${on}>
  <span class="row between"><span class="ccard__code">${code}</span>${on && html`<span class="ccard__check"><${Icon} name="check" size=${14} /></span>`}</span>
  <span class="col g2"><span class="ccard__name">${name}</span><span class="ccard__note">${note}</span></span></button>`;

export const GroupRow = ({ tile, tint = 'lime', title, subtitle, count, onClick }) => html`<button class="grow-row card" onClick=${onClick}>
  <span class=${'tile tile--' + tint}>${tile}</span>
  <span class="col g2 grow"><span class="t-body-m-strong ellipsis">${title}</span><span class="t-caption-regular c-secondary ellipsis">${subtitle}</span></span>
  ${count != null && html`<span class="t-caption-semibold c-secondary nowrap">${count}</span>`}<span class="c-secondary"><${Icon} name="chevron-right" size=${18} /></span></button>`;

export const ChoiceRow = ({ code, name, note, on, onClick }) => html`<button class="crow" onClick=${onClick} aria-pressed=${on}>
  <span class="code-tile">${code}</span>
  <span class="col g2 grow"><span class="t-body-l-strong">${name}</span><span class="t-caption-regular c-secondary">${note}</span></span>
  <span class=${cx('radio', on && 'radio--on')}>${on && html`<${Icon} name="check" size=${14} />`}</span></button>`;

export const VerbRow = ({ v1, v2, v3, status }) => html`<div class="vrow card">
  <span class="t-body-l-strong">${v1}</span><span class="t-body-m-medium">${v2}</span><span class="t-body-m-medium">${v3}</span><${StatusDot} status=${status} /></div>`;

export const RatingTile = ({ label, on, onClick }) => html`<button class=${cx('rtile', on && 'rtile--on')} onClick=${onClick} aria-pressed=${on}>${label}</button>`;

export const ToggleRow = ({ title, subtitle, on, onChange }) => html`<div class="trow">
  <span class="col g2 grow"><span class="t-body-l-strong">${title}</span><span class="t-caption-regular c-secondary">${subtitle}</span></span>
  <${Toggle} on=${on} onChange=${onChange} label=${title} /></div>`;

export const InfoRow = ({ icon, text, warn }) => html`<div class="irow">
  <span class=${cx('itile', warn && 'itile--warn')}><${Icon} name=${icon} size=${22} /></span><span class="t-body-s c-secondary grow">${text}</span></div>`;

export const LessonHeader = ({ onClose, n, done, counter }) => html`<div class="row g12">
  <${IconButton} icon="close" onClick=${onClose} label=${t('lesson.finish')} /><${Progress} n=${n} done=${done} />
  <span class="t-body-m-strong right tnum" style="min-width:34px">${counter}</span></div>`;

export const BackHeader = ({ onBack, right }) => html`<div class="row between">
  <${IconButton} icon="chevron-left" onClick=${onBack} label=${t('common.back')} />${right}</div>`;

export const Ipa = ({ ipa, size = 'l' }) => ipa ? html`<span class=${'t-phonetic-' + size}>/${ipa}/</span>` : null;

export function Sheet({ title, text, yes, no, danger, onYes, onNo }) {
  return html`<div class="sheet-wrap" onClick=${(e) => e.target === e.currentTarget && onNo()}>
    <div class="sheet" role="dialog" aria-modal="true">
      <h2 class="t-title-m">${title}</h2>${text && html`<p class="t-body-s c-secondary">${text}</p>`}
      <${Button} label=${yes} variant=${danger ? 'danger' : 'primary'} onClick=${onYes} />
      <${Button} label=${no || t('common.cancel')} variant="secondary" onClick=${onNo} /></div></div>`;
}
