// client/src/Footer.jsx
// Self-contained footer: styles are injected below, so no CSS file changes are needed.
// Reads everything from the admin-managed `content` object (c).

const css = `
.ft{background:#0b1220;color:#fff;padding:80px 0 0;margin-top:0}
.ft a{color:inherit;text-decoration:none}
.ft-grid{display:grid;grid-template-columns:1.4fr .8fr 1.2fr;gap:56px;padding-bottom:60px}
.ft-logo{display:flex;align-items:center;gap:12px;font:800 1.35rem 'Bricolage Grotesque',sans-serif;letter-spacing:-.02em}
.ft-logo i{width:38px;height:38px;border-radius:10px;background:#1b2845;display:grid;place-content:center;gap:4px}
.ft-logo i b{display:block;height:4px;border-radius:2px;background:#ee6a30}
.ft-logo i b:nth-child(1){width:20px}.ft-logo i b:nth-child(2){width:14px}.ft-logo i b:nth-child(3){width:8px}
.ft-about{color:#9aa7c2;max-width:380px;margin:20px 0 26px}
.ft-wa{display:inline-block;background:#c2410c;color:#fff!important;padding:13px 26px;border-radius:99px;font-weight:700}
.ft h4{font:700 .85rem 'Hanken Grotesk',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#9aa7c2;margin:0 0 22px}
.ft-links{display:grid;gap:14px}
.ft-links a{color:#e4e9f4;transition:color .15s}.ft-links a:hover{color:#ee6a30}
.ft-rows{display:grid;gap:18px}
.ft-rows span{display:block;color:#9aa7c2;font-size:.9rem}.ft-rows b{font-weight:600;color:#fff}
.ft-bar{border-top:1px solid #1d2a44;padding:26px 0;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;color:#9aa7c2;font-size:.92rem}
.ft-bar a:hover,.ft-ck:hover{color:#ee6a30}.ft-bar div{display:flex;gap:22px;flex-wrap:wrap}.ft-ck{background:none;border:0;padding:0;font:inherit;color:inherit;cursor:pointer}.ft-bar a,.ft-ck{text-decoration:underline;text-underline-offset:3px}
@media(max-width:900px){.ft-grid{grid-template-columns:1fr;gap:40px}}
`;

import { go, goHome } from './router.js';

export default function Footer({ c }) {
  const wa = 'https://wa.me/' + (c.phone || '').replace(/\D/g, '');
  const about = c.footerText || 'Precision 3D printing from STEP file to finished part. Quick quotes, honest advice and parts you can rely on.';
  return (
    <footer className="ft">
      <style>{css}</style>
      <div className="w">
        <div className="ft-grid">
          <div>
            <a className="ft-logo" href="/" onClick={(e) => goHome('top', e)}>
              <img src="/assets/logo-96.png" alt="" width="40" height="40" style={{ objectFit: 'contain', borderRadius: 10 }} />
              {c.name}
            </a>
            <p className="ft-about">{about}</p>
            <a className="ft-wa" href={wa} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
          </div>

          <div>
            <h4>Explore</h4>
            <div className="ft-links">
              <a href="/#quote" onClick={(e) => goHome('quote', e)}>Request a quote</a>
              <a href="/services" onClick={(e) => go('/services', e)}>Services</a>
              <a href="/#how" onClick={(e) => goHome('how', e)}>How it works</a>
              <a href="/#about" onClick={(e) => goHome('about', e)}>About</a>
              <a href="/#faq" onClick={(e) => goHome('faq', e)}>FAQ</a>
              <a href="/#contact" onClick={(e) => goHome('contact', e)}>Contact</a>
            </div>
          </div>

          <div>
            <h4>Contact</h4>
            <div className="ft-rows">
              <div><span>Phone</span><b><a href={'tel:' + (c.phone || '').replace(/\s/g, '')}>{c.phone}</a></b></div>
              <div><span>Email</span><b><a href={'mailto:' + c.email}>{c.email}</a></b></div>
              <div><span>Workshop</span><b>{c.location}</b></div>
              <div><span>Hours</span><b>{c.hours}</b></div>
            </div>
          </div>
        </div>

        <div className="ft-bar">
          <span>© {new Date().getFullYear()} {c.name}. All rights reserved.</span>
          <div>
            <a href="/privacy" onClick={(e) => go('/privacy', e)}>Privacy Policy</a>
            <a href="/terms" onClick={(e) => go('/terms', e)}>Terms &amp; Conditions</a>
            <button type="button" className="ft-ck" onClick={() => dispatchEvent(new Event('cookie-settings'))}>Cookie settings</button>
          </div>
        </div>
      </div>
    </footer>
  );
}