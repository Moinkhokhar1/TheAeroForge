import { useState, useEffect, useRef, useId, lazy, Suspense } from 'react';
import { api, Inp, HoneyPot } from './lib.jsx';
import { HOLE_COL } from './holeColors.js';
import Footer from './Footer.jsx';
import CookieBanner from './CookieBanner.jsx';
import Legal from './Legal.jsx';
import { go, goHome, routeName, fixLegacy, SUB, LEGAL } from './router.js';
import { useSeo, pageSeo } from './seo.js';
import { track } from './analytics.js';
import './pages.css';
import Nav from './Nav.jsx';
import SubPage, { Showcase } from './Pages.jsx';
import { normPricing, normContent } from './defaults.js';
import { detectHoles, geometryChecks, fitLabel } from './analyze.js';
import NotFound from './NotFound.jsx';
import Loader, { useSplash, SplashExit } from './Loader.jsx';

// three.js (the 3D viewer) and the admin panel are big and most visitors never need them,
// so they are downloaded only when used.
const Viewer = lazy(() => import('./Viewer.jsx'));
const Admin = lazy(() => import('./Admin.jsx'));

/* ---- STEP measuring (runs fully in the browser via OpenCascade WASM) ---- */

let occtP;

const loadOcct = () =>
  occtP ||
  (occtP = new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = '/occt-import-js.js';
    s.onload = () =>
      window.occtimportjs({ locateFile: (n) => '/' + n }).then(ok, no);
    s.onerror = () => no(new Error('Could not load the CAD engine'));
    document.head.appendChild(s);
  }));

async function measure(file) {
  const occt = await loadOcct();

  const r = occt.ReadStepFile(new Uint8Array(await file.arrayBuffer()), null);

  if (!r.success || !r.meshes.length) {
    throw new Error('Could not read this STEP file');
  }

  let vol = 0;
  let area = 0;
  const mn = [1e9, 1e9, 1e9];
  const mx = [-1e9, -1e9, -1e9];

  for (const m of r.meshes) {
    const p = m.attributes.position.array;
    const ix = m.index.array;

    for (let i = 0; i < ix.length; i += 3) {
      const a = ix[i] * 3;
      const b = ix[i + 1] * 3;
      const c = ix[i + 2] * 3;

      const ux = p[b] - p[a];
      const uy = p[b + 1] - p[a + 1];
      const uz = p[b + 2] - p[a + 2];
      const vx = p[c] - p[a];
      const vy = p[c + 1] - p[a + 1];
      const vz = p[c + 2] - p[a + 2];

      area += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;

      vol +=
        (p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) -
          p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) +
          p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])) / 6;
    }

    for (let i = 0; i < p.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        mn[k] = Math.min(mn[k], p[i + k]);
        mx[k] = Math.max(mx[k], p[i + k]);
      }
    }
  }

  return {
    meshes: r.meshes,
    vol: Math.abs(vol) / 1000,
    area: area / 100,
    dims: mx.map((v, k) => +(v - mn[k]).toFixed(1)),
    min: mn,
  }; // cm³, cm²
}

const N = Number;

const estimate = (m, o, P, mat, tech, q) => {
  const shell = Math.min(m.vol, (m.area * N(P.wallMm)) / 10);

  const printed =
    (shell + ((m.vol - shell) * o.infill) / 100) *
    (o.supports ? 1 + N(P.supportsPct) / 100 : 1);

  const grams = printed * N(mat.density);

  const hours =
    (printed / (N(P.speedCm3PerHour) * N(tech.speedMul || 1))) *
    (N(tech.refLayer || 0.2) / N(q.layer));

  const unit =
    (grams * N(mat.pricePerGram) + hours * N(P.hourlyRate) * N(tech.rateMul || 1)) *
    (1 + N(P.markupPct) / 100);

  const total = Math.max(N(P.minPrice), unit * o.qty + N(P.setupFee));

  const bv = [...P.buildVolume].sort((a, b) => b - a);
  const fits = [...m.dims].sort((a, b) => b - a).every((d, i) => d <= bv[i]);

  return {
    total: Math.round(total),
    per: Math.round(total / o.qty),
    lo: Math.round(total * (1 - N(P.rangePct) / 100)),
    hi: Math.round(total * (1 + N(P.rangePct) / 100)),
    grams,
    hours,
    fits,
  };
};

// Materials and qualities available for one technology.
const forTech = (P, t) => {
  const f = (a) => {
    const r = a.filter((x) => !x.tech || x.tech === t);
    return r.length ? r : a;
  };
  return { mats: f(P.materials), quals: f(P.qualities) };
};

const Sel = ({ label, value, onChange, opts }) => {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </>
  );
};

/* ---- Detected holes list ---- */

function HoleList({ title, holes, selected, onSelect }) {
  const [open, setOpen] = useState(true);

  const H = {
    box: { background: '#fff', color: '#0f172a', borderRadius: 14, border: '1px solid #d6def5', marginTop: 12, overflow: 'hidden' },
    head: { display: 'flex', gap: 10, alignItems: 'center', width: '100%', padding: '14px 16px', border: 0, background: '#fff', cursor: 'pointer', font: 'inherit', color: 'inherit' },
    cat: { padding: '14px 16px 6px', fontSize: 12, fontWeight: 700, letterSpacing: '.06em', color: '#64748b', textTransform: 'uppercase' },
  };

  return (
    <div style={H.box}>
      <button style={H.head} onClick={() => setOpen(!open)}>
        <b>{title}</b>
        <span style={{ color: '#64748b' }}>
          {holes.length} {holes.length === 1 ? 'hole' : 'holes'}
        </span>
        <span style={{ color: '#16a34a' }}>✔</span>
        <span style={{ marginLeft: 'auto' }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div style={{ maxHeight: 300, overflowY: 'auto', borderTop: '1px solid #e2e8f0', paddingBottom: 6 }}>
          {!holes.length && (
            <p style={{ padding: '12px 16px', margin: 0, color: '#64748b' }}>
              No round holes found in this model.
            </p>
          )}

          {[['hole', 'Holes'], ['cbore', 'Counterbored holes']].map(([k, l]) => {
            const hs = holes.filter((h) => h.kind === k);

            return hs.length ? (
              <div key={k}>
                <div style={H.cat}>{l}</div>

                {hs.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => onSelect(h.id === selected ? null : h.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      background: h.id === selected ? '#f1f5f9' : 'transparent',
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        flex: 'none',
                        background: h.id === selected ? HOLE_COL.sel : HOLE_COL[h.kind],
                      }}
                    />

                    <span>
                      Ø{h.dia} × {h.depth} mm
                      {h.sub && (
                        <small style={{ display: 'block', color: '#64748b' }}>{h.sub}</small>
                      )}
                    </span>

                    <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 14 }}>
                      {h.fit}
                    </span>
                  </div>
                ))}
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

/* ---- Quote section ---- */

function Quote({ c, P }) {
  const [file, setFile] = useState(null);
  const [m, setM] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [sel, setSel] = useState(null);
  const [unit, setUnit] = useState(P.units[0].name);

  const [draws, setDraws] = useState([]);
  const [notes, setNotes] = useState('');
  const [dOpen, setDOpen] = useState(false);
  const [dErr, setDErr] = useState('');

  const t0 = P.technologies[0].name;
  const d0 = forTech(P, t0);
  const inf0 = (P.infills.find((x) => N(x.value) === 20) || P.infills[0]).value;

  const [o, setO] = useState({
    tech: t0,
    material: d0.mats[0].name,
    quality: (d0.quals[1] || d0.quals[0]).name,
    infill: N(inf0),
    qty: 1,
    supports: false,
  });

  const [modal, setModal] = useState(false);
  const [hp, setHp] = useState('');
  const openedAt = useRef(Date.now());
  const [done, setDone] = useState(false);
  const [note, setNote] = useState('');
  const [fe, setFe] = useState('');
  const [lb, setLb] = useState(false);
  const [lf, setLf] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('lead')) || { name: '', email: '', phone: '' };
    } catch {
      return { name: '', email: '', phone: '' };
    }
  });

  const tech = P.technologies.find((x) => x.name === o.tech) || P.technologies[0];
  const { mats, quals } = forTech(P, tech.name);
  const mat = mats.find((x) => x.name === o.material) || mats[0];
  const q = quals.find((x) => x.name === o.quality) || quals[0];

  const base = P.currencies.find((x) => N(x.rate) === 1) || P.currencies[0];
  const money = (n) => base.symbol + Math.round(n).toLocaleString('en-IN');

  const set = (k, v) => setO({ ...o, [k]: v });

  const setTech = (t) => {
    const d = forTech(P, t);
    setO({
      ...o,
      tech: t,
      material: d.mats[0].name,
      quality: (d.quals[1] || d.quals[0]).name,
    });
  };

  const uf = N((P.units.find((x) => x.name === unit) || P.units[0]).factor) || 1;

  const ms = m && {
    ...m,
    dims: m.dims.map((v) => +(v * uf).toFixed(1)),
    vol: m.vol * uf ** 3,
    area: m.area * uf ** 2,
  };

  const e = ms && estimate(ms, o, P, mat, tech, q);

  const holes = m
    ? m.holes.map((h) => ({
        ...h,
        dia: +(h.rawDia * uf).toFixed(1),
        depth: +(h.rawDepth * uf).toFixed(1),
        sub:
          h.kind === 'cbore'
            ? `through Ø${(h.minDia * uf).toFixed(1)} × ${(h.minLen * uf).toFixed(1)} mm`
            : '',
        fit: fitLabel((h.kind === 'cbore' ? h.minDia : h.rawDia) * uf),
      }))
    : [];

  const ck = ms && {
    ...m.checks,
    thin: { ok: Math.min(...ms.dims) >= N(P.wallMm) },
  };

  const maxMb = N(c.drawMaxMb) || 5;

  const addDraws = (list) => {
    let msg = '';
    const ok = [];
    for (const f of list) {
      if (f.size > maxMb * 1048576) msg = `${f.name} is larger than ${maxMb} MB`;
      else ok.push(f);
    }
    let all = [...draws, ...ok];
    if (all.length > 5) {
      all = all.slice(0, 5);
      msg = 'You can add up to 5 files';
    }
    setDraws(all);
    setDErr(msg);
  };

  const pick = async (f) => {
    if (!f) return;
    setErr('');
    if (!/\.(step|stp)$/i.test(f.name)) return setErr('Please choose a .step or .stp file');
    if (f.size > 50 * 1024 * 1024) return setErr('File is larger than 50 MB');

    setBusy(true);
    try {
      const r = await measure(f);
      r.holes = detectHoles(r.meshes);
      r.checks = geometryChecks(r.meshes, {
        wall: N(P.wallMm),
        zmin: r.min[2],
        dims: r.dims,
      });
      setM(r);
      setFile(f);
      setNote('');
      setSel(null);
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  };

  // Price is NOT shown to the customer, it is only saved in the inquiry for you.
  const summary = () =>
    `Instant quote request for ${file.name} (model unit: ${unit}): ${o.tech}, ${o.material}, ${o.quality}, ${o.infill}% infill, qty ${o.qty}. ` +
    `Size ${ms.dims.join(' × ')} mm, volume ${ms.vol.toFixed(1)} cm³, ${m.holes.length} holes detected. ` +
    `Internal estimate: ${money(e.total)}${e.fits ? '' : ' (may exceed build volume)'}.`;

  const openInquiry = () => {
    if (!m) return setNote('Upload a STEP file first.');
    setNote('');
    setFe('');
    openedAt.current = Date.now();
    setModal(true);
  };

  const resetAll = () => {
    setM(null);
    setFile(null);
    setDraws([]);
    setNotes('');
    setSel(null);
    setDOpen(false);
    setNote('');
  };

  const submit = async () => {
    const { name, email, phone } = lf;
    if (name.trim().length < 2) return setFe('Please enter your name');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setFe('Please enter a valid email');
    if (phone.replace(/\D/g, '').length < 10) return setFe('Please enter a valid mobile number');

    setFe('');
    setLb(true);

    try {
      const big = file.size > 15 * 1024 * 1024;
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('email', email.trim());
      fd.append('phone', phone.trim());
      fd.append('topic', 'Instant quote');
      fd.append('hp_url', hp);
      fd.append('elapsed', String(Date.now() - openedAt.current));
      fd.append('message', summary() + (big ? ' (File is over 15 MB, so it was not attached.)' : ''));
      if (notes.trim()) fd.append('notes', notes.trim());
      if (!big) fd.append('file', file);
      draws.forEach((f) => fd.append('drawings', f));

      await api('/inquiries', { method: 'POST', body: fd });

      sessionStorage.setItem(
        'lead',
        JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() })
      );
      track('generate_lead', { method: 'quote_tool' });
      setModal(false);
      setDone(true);
    } catch (x) {
      setFe(x.message);
    }
    setLb(false);
  };

  const checks =
    ck && c.showChecks !== 'no'
      ? c.checks
          .filter((x) => x.on !== 'no' && ck[x.key])
          .map((x) => ({ label: x.label, ok: ck[x.key].ok }))
      : [];

  return (
    <section id="quote" className="dk">
      <div className="w">
        <h2>{c.quoteTitle}</h2>
        <p className="lead">{c.quoteText}</p>

        <div className="qgrid">
          {!m ? (
            <label
              className={'drop' + (drag ? ' on' : '')}
              onDragOver={(ev) => {
                ev.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(ev) => {
                ev.preventDefault();
                setDrag(false);
                pick(ev.dataTransfer.files[0]);
              }}
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ee6a30" strokeWidth="2" strokeLinecap="round">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3" />
              </svg>
              <h3>{busy ? 'Measuring your model…' : 'Drop your STEP file here'}</h3>
              <p>or click to browse (.step, .stp, up to 50 MB)</p>
              {err && <p className="err" role="alert">{err}</p>}
              <input hidden type="file" accept=".step,.stp" onChange={(ev) => pick(ev.target.files[0])} />
            </label>
          ) : (
            <div>
              <div className="vbox">
                <Suspense fallback={<p className="mut" style={{ padding: 40, textAlign: 'center' }}>Loading 3D viewer…</p>}>
                  <Viewer
                    meshes={m.meshes}
                    holes={m.holes}
                    selected={sel}
                    onSelect={setSel}
                    volume={(ms.vol * 1000).toFixed(2)}
                    checks={checks}
                    showHoles={c.showHoles !== 'no'}
                  />
                </Suspense>
                <div className="vfoot">
                  <span>{file.name}</span>
                  <button className="lnk" onClick={resetAll}>
                    Use another file
                  </button>
                </div>
              </div>

              <div className="sbox">
                <div><span>Dimensions</span><b>{ms.dims.join(' × ')} mm</b></div>
                <div><span>Volume</span><b>{ms.vol.toFixed(2)} cm³</b></div>
                <div><span>Surface area</span><b>{ms.area.toFixed(1)} cm²</b></div>
              </div>

              {c.showHoles !== 'no' && (
                <HoleList title={c.holesTitle} holes={holes} selected={sel} onSelect={setSel} />
              )}
            </div>
          )}

          <div className="qcard">
            <Sel label={c.unitLabel} value={unit} onChange={setUnit} opts={P.units.map((x) => [x.name, x.name])} />
            <Sel label={c.technologyLabel} value={tech.name} onChange={setTech} opts={P.technologies.map((x) => [x.name, x.name])} />
            <p className="mut">{tech.desc}</p>

            <Sel label="Material" value={mat.name} onChange={(v) => set('material', v)} opts={mats.map((x) => [x.name, x.name])} />
            <p className="mut">{mat.desc}</p>

            <Sel label="Quality" value={q.name} onChange={(v) => set('quality', v)} opts={quals.map((x) => [x.name, `${x.name} (${x.layer} mm)`])} />
            <Sel label="Infill" value={o.infill} onChange={(v) => set('infill', N(v))} opts={P.infills.map((x) => [N(x.value), N(x.value) + '%'])} />

            <div>
              <label>Quantity</label>
              <div className="step">
                <button onClick={() => set('qty', Math.max(1, o.qty - 1))}>−</button>
                <span>{o.qty}</span>
                <button onClick={() => set('qty', Math.min(1000, o.qty + 1))}>+</button>
              </div>
            </div>

            {c.drawEnabled !== 'no' && (
              <div style={{ border: '1px solid rgba(148,163,184,.4)', borderRadius: 14, margin: '14px 0', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setDOpen(!dOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', background: 'none', border: 0, color: 'inherit', font: 'inherit', cursor: 'pointer' }}
                >
                  <span>{dOpen ? '−' : '+'}</span>
                  <b>{c.drawTitle}</b>
                  {(draws.length > 0 || notes.trim()) && (
                    <small style={{ marginLeft: 'auto' }}>
                      {draws.length} file{draws.length === 1 ? '' : 's'}
                      {notes.trim() ? ' + notes' : ''}
                    </small>
                  )}
                </button>

                {dOpen && (
                  <div style={{ padding: '0 14px 14px' }}>
                    <p className="mut sm">{c.drawHint}</p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.dxf,.dwg,.png,.jpg,.jpeg,.step,.stp,.stl,.zip"
                      onChange={(ev) => {
                        addDraws([...ev.target.files]);
                        ev.target.value = '';
                      }}
                    />
                    {draws.map((f, i) => (
                      <p key={i} className="mut sm">
                        📎 {f.name} ({(f.size / 1048576).toFixed(1)} MB){' '}
                        <button type="button" className="lnk" onClick={() => setDraws(draws.filter((_, j) => j !== i))}>
                          Remove
                        </button>
                      </p>
                    ))}
                    {dErr && <p className="err">{dErr}</p>}
                    <Inp
                      label="Notes"
                      area
                      value={notes}
                      onChange={setNotes}
                      placeholder="Tolerances, threads, finish, anything we should know."
                    />
                  </div>
                )}
              </div>
            )}

            <hr />

            {e && !e.fits && (
              <p className="warn">
                ⚠ This part may exceed our {P.buildVolume.join(' × ')} mm build volume. We will review it.
              </p>
            )}

            <button className="btn full" style={{ marginTop: 0 }} onClick={openInquiry}>
              Send inquiry
            </button>
            {note && <p className="err">{note}</p>}
            <p className="mut sm">Final price is confirmed after we review your file.</p>
          </div>
        </div>

        {/* Contact details popup */}
        {modal && (
          <div className="mback" onClick={() => setModal(false)}>
            <div className="modal" role="dialog" aria-modal="true" aria-label="Your contact details" onClick={(ev) => ev.stopPropagation()}>
              <button className="mx" aria-label="Close" onClick={() => setModal(false)}>×</button>

              <h3>Your contact details</h3>
              <p className="mut">So we know where to send your quote.</p>

              <HoneyPot value={hp} onChange={setHp} />
              <Inp label="Full name" value={lf.name} onChange={(v) => setLf({ ...lf, name: v })} autoComplete="name" required />
              <Inp label="Email" type="email" value={lf.email} onChange={(v) => setLf({ ...lf, email: v })} autoComplete="email" required />
              <Inp
                label="Mobile number"
                type="tel"
                value={lf.phone}
                onChange={(v) => setLf({ ...lf, phone: v })}
                autoComplete="tel"
                required
                onKeyDown={(ev) => ev.key === 'Enter' && submit()}
              />

              {fe && <p className="err" role="alert">{fe}</p>}

              <button className="btn full" disabled={lb} onClick={submit}>
                {lb ? 'Sending…' : 'Send inquiry'}
              </button>
            </div>
          </div>
        )}

        {/* Success popup */}
        {done && (
          <div
            className="mback"
            onClick={() => {
              setDone(false);
              resetAll();
            }}
          >
            <div className="modal" role="dialog" aria-modal="true" style={{ textAlign: 'center' }} onClick={(ev) => ev.stopPropagation()}>
              <div style={{ fontSize: 48, color: '#16a34a' }}>✔</div>
              <h3>Inquiry received!</h3>
              <p className="mut">We have received your inquiry. We will get back to you shortly.</p>
              <button
                className="btn full"
                onClick={() => {
                  setDone(false);
                  resetAll();
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---- Contact section ---- */

function Contact({ c }) {
  const blank = {
    name: '',
    phone: '',
    email: '',
    topic: 'Custom print job',
    message: '',
  };

  const [f, setF] = useState(blank);
  const [file, setFile] = useState(null);
  const [errs, setErrs] = useState({});
  const [s, setS] = useState({});
  const [busy, setBusy] = useState(false);
  const [hp, setHp] = useState('');
  const t0 = useRef(Date.now());
  const topicId = useId();
  const fileId = useId();

  const validate = () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = 'Please enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Please enter a valid email address.';
    if (f.phone.trim() && f.phone.replace(/\D/g, '').length < 10) e.phone = 'Please enter a valid phone number (at least 10 digits).';
    if (f.message.trim().length < 10) e.message = 'Please tell us a little more (at least 10 characters).';
    if (file) {
      if (!/\.(step|stp|stl|3mf|obj|pdf|zip)$/i.test(file.name)) e.file = 'Please attach a STEP, STL, 3MF, OBJ, PDF or ZIP file.';
      else if (file.size > 15 * 1048576) e.file = 'That file is larger than 15 MB.';
    }
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrs(e);
    setS({});

    if (Object.keys(e).length) {
      // jump to the first problem so keyboard and screen-reader users land on it
      setTimeout(() => document.querySelector('#contact [aria-invalid="true"]')?.focus(), 0);
      return;
    }

    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.append(k, v.trim()));
    fd.append('hp_url', hp);
    fd.append('elapsed', String(Date.now() - t0.current));
    if (file) fd.append('file', file);

    setBusy(true);

    try {
      await api('/inquiries', { method: 'POST', body: fd });
      track('generate_lead', { method: 'contact_form' });
      setS({ ok: 'Thanks! We will get back to you within a few hours.' });
      setF(blank);
      setFile(null);
      t0.current = Date.now();
    } catch (x) {
      setS({ err: x.message });
    }

    setBusy(false);
  };

  const set = (k) => (v) => setF({ ...f, [k]: v });

  return (
    <section id="contact" className="dk">
      <div className="w cgrid">
        <div>
          <h2>{c.contactTitle}</h2>
          <p className="lead">{c.contactText}</p>

          <div className="crows">
            {[
              ['WhatsApp', c.phone],
              ['Email', c.email],
              ['Workshop', c.location],
              ['Hours', c.hours],
            ].map(([l, v]) => (
              <div key={l}>
                <span>{l}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>
        </div>

        <form className="qcardfooter form" onSubmit={submit} noValidate>
          <HoneyPot value={hp} onChange={setHp} />

          <div className="row2">
            <Inp label="Your name *" value={f.name} onChange={set('name')} error={errs.name} autoComplete="name" maxLength={100} required />
            <Inp label="Phone" type="tel" value={f.phone} onChange={set('phone')} error={errs.phone} autoComplete="tel" maxLength={30} />
          </div>

          <Inp label="Email *" type="email" value={f.email} onChange={set('email')} error={errs.email} autoComplete="email" maxLength={120} required />

          <label htmlFor={topicId}>What do you need?</label>

          <select id={topicId} value={f.topic} onChange={(e) => set('topic')(e.target.value)}>
            {[
              'Custom print job',
              'Small-batch production',
              'CAD / design help',
              'Something else',
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <Inp
            label="Message *"
            area
            value={f.message}
            error={errs.message}
            placeholder="Material, quantity, deadline, anything we should know."
            onChange={set('message')}
            maxLength={4000}
            required
          />

          <label htmlFor={fileId}>Attach a file (optional)</label>

          <input
            id={fileId}
            type="file"
            accept=".step,.stp,.stl,.3mf,.obj,.pdf,.zip"
            aria-invalid={errs.file ? 'true' : undefined}
            aria-describedby={errs.file ? fileId + '-e' : undefined}
            onChange={(e) => setFile(e.target.files[0] || null)}
          />

          {errs.file && <p className="err sm" id={fileId + '-e'} role="alert">{errs.file}</p>}
          {file && !errs.file && <p className="mut sm">📎 {file.name} will be sent with your inquiry.</p>}

          <p className="mut sm">STEP, STL, 3MF, OBJ, PDF or ZIP, up to 15 MB.</p>

          <button className="btn full" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send inquiry'}
          </button>

          <p className="mut sm" style={{ marginTop: 14 }}>
            By sending this you agree to our{' '}
            <a href="/privacy" onClick={(e) => go('/privacy', e)}>Privacy Policy</a>.
          </p>

          <div aria-live="polite">
            {s.ok && <p className="ok">{s.ok}</p>}
            {s.err && <p className="err" role="alert">{s.err}</p>}
          </div>
        </form>
      </div>
    </section>
  );
}
/* ---- How it works timeline ---- */

function Steps({ steps }) {
  const ref = useRef(null);
  const fill = useRef(null);

  useEffect(() => {
    const root = ref.current;
    const items = [...root.querySelectorAll('.tl-step')];
    const wide = window.matchMedia('(min-width: 900px)');
    let furthest = -1;

    const grow = () => {
      if (furthest < 0) return;
      const el = items[furthest];
      const f = fill.current;
      if (wide.matches) {
        f.style.width = el.offsetLeft + 20 + 'px';
        f.style.height = '';
      } else {
        f.style.height = el.offsetTop + 20 + 'px';
        f.style.width = '';
      }
    };

    // Hide steps only after JS is running, so content never stays invisible
    root.classList.add('on');

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add('in');
          furthest = Math.max(furthest, items.indexOf(en.target));
          io.unobserve(en.target);
        });
        grow();
      },
      { threshold: 0.3 }
    );

    items.forEach((el) => io.observe(el));
    window.addEventListener('resize', grow);

    return () => {
      io.disconnect();
      window.removeEventListener('resize', grow);
    };
  }, [steps.length]);

  return (
    <div className="tl" ref={ref}>
      <span className="tl-track" aria-hidden="true">
        <span className="tl-fill" ref={fill} />
      </span>

      {steps.map((s, i) => (
        <div className="tl-step" key={i} style={{ '--i': i }}>
          <span className="tl-num">{i + 1}</span>
          <h3>{s.title}</h3>
          <p>{s.desc}</p>
        </div>
      ))}
    </div>
  );
}
/* ---- Main website ---- */

function Site() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(0);
  const splash = useSplash();

  useSeo(pageSeo('home', d?.content?.name || 'The Aero Forge'));

  useEffect(() => {
    api('/content')
      .then(setD)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) {
    return <p style={{ padding: 40 }}>Can't reach the server: {err}</p>;
  }

  if (!d || splash.wait) {
    return <Loader />;
  }

  const c = normContent(d.content);
  const P = normPricing(d.pricing);
  const pg = d.pages || {};

  return (
    <>
      <SplashExit on={splash.fade} />
      <Nav c={c} />

      <main id="main">
      <header className="hero">
        <div className="w">
          <span className="badge">{c.badge}</span>

          <h1>{c.heroTitle}</h1>
          <p className="lead">{c.heroText}</p>

          <div className="cta">
            <a className="btn big" href="/#quote" onClick={(e) => goHome('quote', e)}>
              Request a quote
            </a>
          </div>

          <div className="stats">
            {c.stats.map((s, i) => (
              <div key={i}>
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <Showcase data={pg.home} />

      <Quote c={c} P={P} />

      <section id="services">
        <div className="w">
          <h2>{c.servicesTitle}</h2>
          <p className="lead">{c.servicesText}</p>

          <div className="g3">
            {c.services.map((s, i) => (
              <div className="card" key={i}>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="w">
          <h2>{c.materialsTitle}</h2>
          <p className="lead">{c.materialsText}</p>

          <div className="mats">
            {P.materials.map((x) => (
              <div key={x.name}>
                <h3>{x.name}</h3>
                <p>{x.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bb">
        <div className="w">
          <h2>{c.stepsTitle}</h2>

          <div className="steps">
            {c.steps.map((s, i) => (
              <div className="stp" key={i}>
                <span>{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="wh">
        <div className="w agrid">
          <div>
            <h2>{c.aboutTitle}</h2>

            {c.aboutText.split('\n\n').map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </div>

          <div className="info">
            {[
              ['Location', c.location],
              ['Hours', c.hours],
              ['Phone', <a href={'tel:' + c.phone.replace(/\s/g, '')}>{c.phone}</a>],
              ['Email', <a href={'mailto:' + c.email}>{c.email}</a>],
            ].map(([l, v]) => (
              <div key={l}>
                <span>{l}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq">
        <div className="w fgrid">
          <h2>{c.faqTitle}</h2>

          <div className="faq">
            {c.faqs.map((f, i) => (
              <div key={i}>
                <button onClick={() => setOpen(open === i ? -1 : i)}>
                  {f.q}
                  <span>{open === i ? '−' : '+'}</span>
                </button>

                {open === i && <p>{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Contact c={c} />
      </main>

      <Footer c={c} />
    </>
  );
}

/* ---- Application entry point ---- */

export default function App() {
  const [, tick] = useState(0);
  const lastPath = useRef('');

  useEffect(() => {
    const f = () => {
      fixLegacy();
      tick((n) => n + 1);
    };
    addEventListener('popstate', f);
    addEventListener('hashchange', f);
    addEventListener('navigate', f);
    return () => {
      removeEventListener('popstate', f);
      removeEventListener('hashchange', f);
      removeEventListener('navigate', f);
    };
  }, []);

  // After every navigation: scroll to the "#section" in the URL, or back to the top on a new page.
  useEffect(() => {
    const id = location.hash.slice(1);
    const page = location.pathname;

    if (id && !id.startsWith('/')) {
      let tries = 0;
      const t = setInterval(() => {
        const el = document.getElementById(id);
        if (el) { el.scrollIntoView(); clearInterval(t); }
        else if (++tries > 40) clearInterval(t); // content may still be loading; give up after ~4s
      }, 100);
      lastPath.current = page;
      return () => clearInterval(t);
    }

    if (page !== lastPath.current) window.scrollTo(0, 0);
    lastPath.current = page;
  });

  const r = routeName();
  const h = location.hash;

  let view;
  if (h === '#/admin' && r === '') view = <Suspense fallback={<Loader />}><Admin /></Suspense>;
  else if (SUB.includes(r)) view = <SubPage key={r} route={r} />;
  else if (LEGAL.includes(r)) view = <Legal key={r} kind={r} />;
  // A real path we don't have (the server sends these with a 404 status), or "#/something" that
  // isn't a route. Plain anchors like #quote are fine.
  else if ((r !== '' && r !== 'index.html') || /^#\/[^?]/.test(h)) view = <NotFound />;
  else view = <Site />;

  return (
    <>
      {view}
      {h !== '#/admin' && <CookieBanner />}
    </>
  );
}
