import { useState, useEffect } from 'react';
import { api } from './lib.jsx';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';
import { normContent } from './defaults.js';
import { go } from './router.js';

export default function NotFound() {
  const [c, setC] = useState(null);

  // Load site content so the nav/footer match the rest of the site.
  // If the API is down, the page still renders without them.
  useEffect(() => {
    api('/content')
      .then((d) => setC(normContent(d.content)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Page not found' + (c ? ' | ' + c.name : '');

    const m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex';
    document.head.appendChild(m);

    return () => {
      document.title = prev;
      m.remove();
    };
  }, [c]);

  return (
    <>
      {c && <Nav c={c} />}

      <section className="dk nf">
        <div className="w">
          <div className="nf-art" aria-hidden="true">
            <div className="nf-code">404</div>
            <span className="nf-head" />
          </div>

          <h1 className="nf-title">This layer didn't print</h1>
          <p className="lead">
            The page you're looking for doesn't exist, or it has been moved.
            Let's get you back to something solid.
          </p>

          <div className="cta" style={{ justifyContent: 'center' }}>
            <a className="btn big" href="/" onClick={(e) => go('/', e)}>Back to home</a>
          </div>
        </div>
      </section>

      {c && <Footer c={c} />}
    </>
  );
}