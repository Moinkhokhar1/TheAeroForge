import { Fragment, useState, useEffect, useRef } from 'react';
import { api } from './lib.jsx';
import { normContent } from './defaults.js';
import Nav, { goHome } from './Nav.jsx';
import Footer from './Footer.jsx';
import Carousel, { imgUrl } from './Carousel.jsx';
import Loader, { useSplash, SplashExit } from './Loader.jsx';

const A = (x) => (Array.isArray(x) ? x : []);
const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setOn(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={'rv' + (on ? ' in' : '')} style={{ transitionDelay: delay + 'ms' }}>
      {children}
    </div>
  );
}

const Words = ({ text }) =>
  String(text || '').split(' ').map((w, i) => (
    <Fragment key={i}>
      <span className="pg-w" style={{ animationDelay: i * 70 + 'ms' }}>{w}</span>{' '}
    </Fragment>
  ));

const Pic = ({ src, label }) => {
  const u = imgUrl(src);
  return (
    <div className="pg-pic">
      {u ? <img src={u} alt={label || ''} loading="lazy" /> : <span>{(label || '?').trim()[0]}</span>}
    </div>
  );
};

const Hero = ({ eyebrow, title, text, slides }) => (
  <>
    <header className="pg-hero">
      <div className="w">
        <span className="pg-eyebrow">{eyebrow}</span>
        <h1><Words text={title} /></h1>
        {text && <p className="pg-lead">{text}</p>}
      </div>
    </header>
    {A(slides).length > 0 && (
      <div className="w pg-slides">
        <Carousel slides={slides} />
      </div>
    )}
  </>
);

const Cta = () => (
  <Reveal>
    <div className="pg-cta">
      <h3>Have a part in mind?</h3>
      <p>Upload your STEP file for an instant estimate, or talk to us about your project.</p>
      <a className="pg-btn" href="#/" onClick={(e) => goHome('quote', e)}>Get an instant quote</a>{' '}
      <a className="pg-btn o" href="#/" onClick={(e) => goHome('contact', e)}>Talk to us</a>
    </div>
  </Reveal>
);

function Industries({ data }) {
  return (
    <main className="pg">
      <Hero eyebrow="Industries" title={data.title} text={data.text} slides={data.slides} />
      <div className="w">
        <div className="pg-grid">
          {A(data.items).map((it, i) => (
            <Reveal key={i} delay={(i % 3) * 90}>
              <div className="pg-card">
                <Pic src={it.image} label={it.name} />
                <div className="pg-body">
                  <h3>{it.name}</h3>
                  <p>{it.desc}</p>
                  {lines(it.uses).length > 0 && (
                    <ul>{lines(it.uses).map((u, j) => <li key={j}>{u}</li>)}</ul>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Cta />
      </div>
    </main>
  );
}

function Services({ data }) {
  const cats = A(data.categories);
  const techs = A(data.technologies);
  return (
    <main className="pg">
      <Hero eyebrow="Services" title={data.title} text={data.text} slides={data.slides} />
      <div className="w">
        <Reveal>
          <h2 className="pg-h2">{data.groupTitle}</h2>
          {data.groupText && <p className="pg-sub">{data.groupText}</p>}
        </Reveal>

        {cats.map((cat, i) => {
          const list = techs.filter((t) => t.category === cat.name);
          return (
            <section className="pg-block" key={i}>
              <Reveal>
                <div className={'pg-split' + (i % 2 ? ' rev' : '')}>
                  <Pic src={cat.image} label={cat.name} />
                  <div>
                    <h3>{cat.name}</h3>
                    <p>{cat.desc}</p>
                  </div>
                </div>
              </Reveal>

              {list.length > 0 && (
                <div className="pg-grid">
                  {list.map((t, j) => (
                    <Reveal key={j} delay={(j % 3) * 90}>
                      <div className="pg-card">
                        {t.image && <Pic src={t.image} label={t.name} />}
                        <div className="pg-body">
                          <span className="pg-tag">{t.name}</span>
                          <p>{t.desc}</p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
            </section>
          );
        })}
        <Cta />
      </div>
    </main>
  );
}

function Materials({ data }) {
  const techs = A(data.technologies);
  const items = A(data.items);
  const [sel, setSel] = useState(0);
  const tech = techs[sel] || techs[0];
  const list = tech ? items.filter((m) => m.tech === tech.name) : [];
  return (
    <main className="pg">
      <Hero eyebrow="Materials" title={data.title} text={data.text} slides={data.slides} />
      <div className="w">
        <div className="pg-tabs">
          {techs.map((t, i) => (
            <button key={i} className={i === sel ? 'on' : ''} onClick={() => setSel(i)}>
              {t.name}
            </button>
          ))}
        </div>

        {tech && (
          <div className="pg-split pg-tech" key={tech.name}>
            <Pic src={tech.image} label={tech.name} />
            <div>
              <h3>{tech.name}</h3>
              <p>{tech.desc}</p>
            </div>
          </div>
        )}

        {tech && (
          <Reveal>
            <div className="pg-tbl">
              <table>
                <thead>
                  <tr><th>Material</th><th>Details</th><th>Key properties</th><th>Datasheet</th></tr>
                </thead>
                <tbody>
                  {list.map((m, i) => (
                    <tr key={i}>
                      <td>
                        <div className="pg-mn">
                          <span className="pg-th">
                            {imgUrl(m.image) ? <img src={imgUrl(m.image)} alt="" loading="lazy" /> : (m.name || '?')[0]}
                          </span>
                          <b>{m.name}</b>
                        </div>
                      </td>
                      <td>{m.desc}</td>
                      <td style={{ whiteSpace: 'pre-line' }}>{lines(m.props).join('\n')}</td>
                      <td>
                        {m.datasheet ? (
                          <a className="pg-pdf" href={`/api/datasheets/${m.datasheet}`} target="_blank" rel="noreferrer">⬇ PDF</a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                  {!list.length && (
                    <tr><td colSpan={4}>No materials listed for this technology yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Reveal>
        )}
        <Cta />
      </div>
    </main>
  );
}

/* Home page "Recent work" carousel. Hidden until slides are added in admin. */
export function Showcase({ data }) {
  const slides = A(data && data.slides);
  if (!slides.length) return null;
  return (
    <section id="work" className="pg-show">
      <div className="w">
        <Reveal>
          <h2 className="pg-h2" style={{ marginTop: 0 }}>{data.title}</h2>
          {data.text && <p className="pg-sub">{data.text}</p>}
        </Reveal>
        <Reveal delay={100}>
          <Carousel slides={slides} variant="wide" />
        </Reveal>
      </div>
    </section>
  );
}

export default function SubPage({ route }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const splash = useSplash();

  useEffect(() => {
    api('/content').then(setD).catch((e) => setErr(e.message));
  }, []);

  if (err) return <p style={{ padding: 40 }}>Can't reach the server: {err}</p>;
  if (!d || splash.wait) return <Loader />;

  const c = normContent(d.content);
  const pg = d.pages || {};
  const View = { industries: Industries, services: Services, materials: Materials }[route];
  document.title = `${route[0].toUpperCase() + route.slice(1)} | ${c.name}`;

  return (
    <>
      <SplashExit on={splash.fade} />
      <Nav c={c} />
      <View data={pg[route] || {}} />
      <Footer c={c} />
    </>
  );
}