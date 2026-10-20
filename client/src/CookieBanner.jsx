import { useState, useEffect } from 'react';
import { getConsent, setConsent, loadAnalytics } from './analytics.js';
import { go } from './router.js';

// Accept and Decline have the same weight on purpose: declining must be as easy as accepting.
// The footer's "Cookie settings" button fires "cookie-settings" to reopen this.
export default function CookieBanner() {
  const [open, setOpen] = useState(() => getConsent() === null);

  useEffect(() => {
    loadAnalytics(); // returning visitor who already accepted
    const f = () => setOpen(true);
    addEventListener('cookie-settings', f);
    return () => removeEventListener('cookie-settings', f);
  }, []);

  if (!open) return null;

  const choose = (v) => { setConsent(v); setOpen(false); };

  return (
    <div className="ck" role="region" aria-label="Cookie consent">
      <p>
        <b>Cookies &amp; privacy.</b> We only use analytics cookies if you say yes, to see which pages are useful.
        Everything else on this site works without them.{' '}
        <a href="/privacy" onClick={(e) => go('/privacy', e)}>Read our privacy policy</a>.
      </p>
      <div className="ck-row">
        <button type="button" className="ck-b" onClick={() => choose('granted')}>Accept analytics</button>
        <button type="button" className="ck-b" onClick={() => choose('denied')}>Decline</button>
      </div>
    </div>
  );
}
