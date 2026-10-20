// Google Analytics 4, loaded ONLY after the visitor accepts the cookie banner.
// Set VITE_GA_ID=G-XXXXXXXXXX in client/.env (or your build environment) to turn it on.
// Without an ID nothing is loaded and no analytics cookies are ever set.

const RAW = import.meta.env.VITE_GA_ID || '';
const ID = /^G-[A-Z0-9]+$/i.test(RAW) ? RAW : '';
const KEY = 'aeroforge_consent'; // 'granted' | 'denied'

let loaded = false;

export const getConsent = () => {
  try { return localStorage.getItem(KEY); } catch { return null; }
};

export function loadAnalytics() {
  if (!ID || loaded || getConsent() !== 'granted') return;
  loaded = true;
  window['ga-disable-' + ID] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', ID); // GA4 also reports history (pushState) page changes by itself
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID);
  document.head.appendChild(s);
}

function revoke() {
  if (ID) window['ga-disable-' + ID] = true;
  const host = location.hostname.split('.');
  const domains = [location.hostname, '.' + location.hostname, host.length > 2 ? '.' + host.slice(-2).join('.') : ''];
  document.cookie.split(';').forEach((c) => {
    const n = c.split('=')[0].trim();
    if (n === '_ga' || n.startsWith('_ga_') || n === '_gid')
      domains.forEach((d) => { document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/` + (d ? `; domain=${d}` : ''); });
  });
}

export function setConsent(v) {
  try { localStorage.setItem(KEY, v); } catch { /* private mode: choice lasts for this visit only */ }
  if (v === 'granted') loadAnalytics();
  else { revoke(); loaded = false; }
}

// track('generate_lead', { method: 'quote' }) - does nothing unless analytics is on.
export const track = (name, params = {}) => {
  if (loaded && window.gtag) window.gtag('event', name, params);
};
