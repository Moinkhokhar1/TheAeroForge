import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { go, goHome, routeName } from './router.js';

export { goHome };

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
  const on = (r) => (r && routeName() === r ? 'on' : '');
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
      <a key={label} href={'/' + t.route} className={(cls + ' ' + on(t.route)).trim()} style={{ '--i': i }} onClick={(e) => { close(); go('/' + t.route, e); }}>
        {label}
      </a>
    ) : (
      <a key={label} href={'/#' + t.home} className={cls} style={{ '--i': i }} onClick={(e) => { close(); goHome(t.home, e); }}>
        {label}
      </a>
    );

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <nav aria-label="Main">
        <div className="w nav">
            <a className="logo" href="/" onClick={(e) => goHome('top', e)}>
              <img src="/assets/logo-96.png" alt="" width="40" height="40" style={{ objectFit: 'contain', borderRadius: 10 }} />
              {c.name}
            </a>

          <div className="links">
            {LINKS.map((l, i) => link(l, i))}
            <a className="btn" href="/#quote" onClick={(e) => goHome('quote', e)}>Request a quote</a>
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
                <img src="/assets/logo-96.png" alt="" width="32" height="32" style={{ objectFit: 'contain' }} />
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
              href="/#quote"
              style={{ '--i': LINKS.length }}
              onClick={(e) => { close(); goHome('quote', e); }}
            >
              Request a quote
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