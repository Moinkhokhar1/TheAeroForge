import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export const goHome = (id, e) => {
  if (e) e.preventDefault();
  const onHome = !/^#\/[a-z]/i.test(location.hash);
  const scroll = () => {
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView(); return true; }
    return false;
  };
  if (onHome) { scroll(); return; }
  location.hash = '#/';
  let tries = 0;
  const t = setInterval(() => {
    if (scroll() || ++tries > 30) clearInterval(t);
  }, 100);
};

const LINKS = [
  ['Instant quote', { home: 'quote' }],
  ['Industries', { route: 'industries' }],
  ['Services', { route: 'services' }],
  ['Materials', { route: 'materials' }],
  ['How it works', { home: 'how' }],
  ['About', { home: 'about' }],
  ['FAQ', { home: 'faq' }],
];

export default function Nav({ c }) {
  const [open, setOpen] = useState(false);
  const h = location.hash;
  const on = (r) => (r && h.startsWith('#/' + r) ? 'on' : '');
  const close = () => setOpen(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const k = (e) => e.key === 'Escape' && close();
    addEventListener('keydown', k);
    addEventListener('hashchange', close);
    return () => {
      document.body.style.overflow = '';
      removeEventListener('keydown', k);
      removeEventListener('hashchange', close);
    };
  }, [open]);

  const link = ([label, t], i, cls = '') =>
    t.route ? (
      <a key={label} href={'#/' + t.route} className={(cls + ' ' + on(t.route)).trim()} style={{ '--i': i }} onClick={close}>
        {label}
      </a>
    ) : (
      <a key={label} href="#/" className={cls} style={{ '--i': i }} onClick={(e) => { close(); goHome(t.home, e); }}>
        {label}
      </a>
    );

  return (
    <>
      <nav>
        <div className="w nav">
            <a className="logo" href="#/">
              <img src="/assets/icon-512.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 10 }} />
              {c.name}
            </a>

          <div className="links">
            {LINKS.map((l, i) => link(l, i))}
            <a className="btn" href="#/" onClick={(e) => goHome('contact', e)}>Send inquiry</a>
          </div>

          <button
            className={'nv-burger' + (open ? ' open' : '')}
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {createPortal(
        <>
          <div className={'nv-back' + (open ? ' open' : '')} onClick={close} />
          <aside className={'nv-drawer' + (open ? ' open' : '')} aria-hidden={!open}>
            <div className="nv-top">
              <b style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/assets/icon-512.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                {c.name}
              </b>
              <button className="nv-burger open" aria-label="Close menu" onClick={close}>
                <span /><span /><span />
              </button>
            </div>

            <div className="nv-list">
              {LINKS.map((l, i) => link(l, i))}
            </div>

            <a
              className="nv-cta"
              href="#/"
              style={{ '--i': LINKS.length }}
              onClick={(e) => { close(); goHome('contact', e); }}
            >
              Send inquiry
            </a>

            <div className="nv-foot" style={{ '--i': LINKS.length + 1 }}>
              <span>{c.hours}</span>
              <a href={'tel:' + String(c.phone || '').replace(/\s/g, '')}>{c.phone}</a>
              <a href={'mailto:' + c.email}>{c.email}</a>
            </div>
          </aside>
        </>,
        document.body
      )}
    </>
  );
}