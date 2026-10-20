// Tiny History-API router. Real URLs (/services, /privacy ...) instead of "#/services",
// so each page can be crawled, indexed and listed in the sitemap.

export const SUB = ['industries', 'services', 'materials'];
export const LEGAL = ['privacy', 'terms'];

// '' = home page, otherwise 'services', 'privacy', 'whatever' ...
export const routeName = () => location.pathname.replace(/^\/+|\/+$/g, '');

// Old links used "#/services" and "#/?s=quote". Turn them into real URLs.
export function fixLegacy() {
  const h = location.hash;
  let m = h.match(/^#\/(industries|services|materials|privacy|terms)\/?$/);
  if (m) return history.replaceState(null, '', '/' + m[1]);
  m = h.match(/^#\/\?s=([\w-]+)/);
  if (m) return history.replaceState(null, '', '/#' + m[1]);
  if (h === '#/') history.replaceState(null, '', '/');
}

// Navigate without a page reload. Ctrl/Cmd/middle-click still open a new tab.
export function go(to, e) {
  if (e) {
    if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
  }
  history.pushState(null, '', to);
  window.dispatchEvent(new Event('navigate'));
}

// Go to a section of the home page: goHome('quote', e) -> "/#quote"
export const goHome = (id, e) => go(id && id !== 'top' ? '/#' + id : '/', e);
