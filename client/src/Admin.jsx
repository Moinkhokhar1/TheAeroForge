import { useState, useEffect } from 'react';
import { api, Inp } from './lib.jsx';
import { normPricing, normContent, CHECK_KEYS } from './defaults.js';
import { imgUrl } from './Carousel.jsx';

const TXT = [['name', 'Company name'], ['badge', 'Hero badge'], ['heroTitle', 'Hero title'], ['quoteTitle', 'Quote title'], ['servicesTitle', 'Services title'], ['materialsTitle', 'Materials title'], ['stepsTitle', 'How it works title'], ['aboutTitle', 'About title'], ['faqTitle', 'FAQ title'], ['contactTitle', 'Contact title'], ['location', 'Location'], ['hours', 'Hours'], ['phone', 'Phone / WhatsApp'], ['email', 'Email']];
const QUOTE_TXT = [['unitLabel', 'Model unit dropdown label'], ['technologyLabel', 'Technology dropdown label'], ['drawTitle', 'Drawings section title'], ['drawHint', 'Drawings section help text'], ['drawMaxMb', 'Drawings max size per file (MB)'], ['leadTitle', 'Details popup title'], ['leadButton', 'Details popup button'], ['holesTitle', 'Detected holes panel title']];
const AREA = [['heroText', 'Hero text'], ['quoteText', 'Quote text'], ['servicesText', 'Services text'], ['materialsText', 'Materials text'], ['aboutText', 'About text (blank line = new paragraph)'], ['contactText', 'Contact text'], ['leadText', 'Details popup text']];
const LISTS = [['stats', 'Hero stats', [['value', 'Value'], ['label', 'Label']]], ['services', 'Services', [['title', 'Title'], ['desc', 'Description']]], ['steps', 'How it works steps', [['title', 'Title'], ['desc', 'Description']]], ['faqs', 'FAQs', [['q', 'Question'], ['a', 'Answer']]]];
const YN = ['yes', 'no'];

const A = x => Array.isArray(x) ? x : [];
const normPages = (p = {}) => ({
  home: { title: '', text: '', ...p.home, slides: A(p.home?.slides) },
  industries: { title: '', text: '', ...p.industries, slides: A(p.industries?.slides), items: A(p.industries?.items) },
  services: { title: '', text: '', groupTitle: '', groupText: '', ...p.services, slides: A(p.services?.slides), categories: A(p.services?.categories), technologies: A(p.services?.technologies) },
  materials: { title: '', text: '', ...p.materials, slides: A(p.materials?.slides), technologies: A(p.materials?.technologies), items: A(p.materials?.items) }
});

const SLIDES = [['image', 'Image', 'image'], ['title', 'Title'], ['text', 'Caption', 'area']];

// field = [key, label, type, options]; type 'select' renders a dropdown, 'area' a textarea
const Sel = ({ label, value, onChange, opts }) => <div><label>{label}</label><select value={value} onChange={e => onChange(e.target.value)}>{opts.map(o => <option key={o} value={o}>{o === '' ? 'All' : o}</option>)}</select></div>;
const blankFor = ([, , t, opts]) => t === 'number' ? 1 : t === 'select' ? (opts[0] ?? '') : '';
function ImageField({ label, value, onChange }) {
  const [busy, setBusy] = useState(false), [e, setE] = useState('');
  const up = async file => {
    if (!file) return;
    if (!/\.(jpe?g|png|webp|gif)$/i.test(file.name)) return setE('Use a JPG, PNG, WEBP or GIF image');
    const fd = new FormData();
    fd.append('file', file);
    setBusy(true); setE('');
    try {
      const r = await api('/admin/image', { method: 'POST', body: fd, auth: true });
      onChange(r.file);
    } catch (x) { setE(x.message); }
    setBusy(false);
  };
  return <div><label>{label}</label>
    {value && <img src={imgUrl(value)} alt="" style={{ width: 120, height: 70, objectFit: 'cover', borderRadius: 8, display: 'block', margin: '4px 0 6px' }} />}
    <input type="file" accept="image/*" onChange={ev => { up(ev.target.files[0]); ev.target.value = ''; }} />
    {busy && <small> Uploading…</small>}
    {value && <button className="pill" onClick={() => onChange('')}>Remove</button>}
    {e && <p className="err">{e}</p>}
  </div>;
}

const List = ({ items, onChange, fields }) => (<>
  {items.map((it, i) => (
    <div className="item" key={i} style={{ gridTemplateColumns: `repeat(${fields.length},1fr) auto` }}>
      {fields.map(f => {
        const [k, l, t, opts] = f, upd = v => onChange(items.map((x, j) => j === i ? { ...x, [k]: v } : x));
        if (t === 'select') return <Sel key={k} label={l} value={it[k] ?? ''} opts={opts} onChange={upd} />;
        if (t === 'area') return <Inp key={k} area label={l} value={it[k] ?? ''} onChange={upd} />;
        if (t === 'image') return <ImageField key={k} label={l} value={it[k] || ''} onChange={upd} />;
        return <Inp key={k} label={l} type={t} value={it[k]} onChange={upd} />;
      })}
      <button className="pill" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
    </div>))}
  <button className="pill" onClick={() => onChange([...items, Object.fromEntries(fields.map(f => [f[0], blankFor(f)]))])}>+ Add</button>
</>);

const H3 = ({ children }) => <h3 style={{ margin: '24px 0 8px' }}>{children}</h3>;

// Materials with a PDF datasheet upload per row
function MaterialsEditor({ items, techNames, onChange }) {
  const [busy, setBusy] = useState(null);
  const upd = (i, patch) => onChange(items.map((x, j) => j === i ? { ...x, ...patch } : x));
  const up = async (i, file) => {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name)) return alert('Please choose a PDF file');
    const fd = new FormData();
    fd.append('file', file);
    setBusy(i);
    try {
      const r = await api('/admin/datasheet', { method: 'POST', body: fd, auth: true });
      upd(i, { datasheet: r.file, datasheetName: r.fileName });
    } catch (e) { alert(e.message); }
    setBusy(null);
  };
  return (<>
    {items.map((it, i) => (
      <div className="item" key={i} style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr auto' }}>
        <Inp label="Material name" value={it.name || ''} onChange={v => upd(i, { name: v })} />
        <Sel label="Technology" value={it.tech || ''} opts={techNames.length ? techNames : ['']} onChange={v => upd(i, { tech: v })} />
        <button className="pill" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
        <Inp area label="Details" value={it.desc || ''} onChange={v => upd(i, { desc: v })} />
        <Inp area label="Key properties (one per line)" value={it.props || ''} onChange={v => upd(i, { props: v })} />
        <div />
        <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 12 }}>
          <ImageField label="Material image (thumbnail)" value={it.image || ''} onChange={v => upd(i, { image: v })} />
          <div>
            <label>Datasheet PDF</label>
            <input type="file" accept=".pdf" onChange={e => { up(i, e.target.files[0]); e.target.value = ''; }} />
            {busy === i && <small> Uploading…</small>}
            {it.datasheet && <p className="mut sm">
              <a href={`/api/datasheets/${it.datasheet}`} target="_blank" rel="noreferrer">📄 {it.datasheetName || it.datasheet}</a>{' '}
              <button className="pill" onClick={() => upd(i, { datasheet: '', datasheetName: '' })}>Remove</button>
            </p>}
          </div>
        </div>
      </div>))}
    <button className="pill" onClick={() => onChange([...items, { name: '', tech: techNames[0] || '', desc: '', props: '', image: '', datasheet: '', datasheetName: '' }])}>+ Add material</button>
  </>);
}

function Panel({ logout }) {
  const [d, setD] = useState(null), [tab, setTab] = useState('inq'), [msg, setMsg] = useState('');
  const refresh = () => api('/admin/data', { auth: true }).then(x => setD({ ...x, content: normContent(x.content), pricing: normPricing(x.pricing), pages: normPages(x.pages) })).catch(logout);
  useEffect(() => { refresh(); }, []);
  if (!d) return null;
  const save = async k => { await api('/admin/' + k, { method: 'PUT', body: d[k], auth: true }); setMsg('Saved ✔'); setTimeout(() => setMsg(''), 2000); };
  const setC = (k, v) => setD({ ...d, content: { ...d.content, [k]: v } }), setP = (k, v) => setD({ ...d, pricing: { ...d.pricing, [k]: v } });
  const setPg = (sec, k, v) => setD({ ...d, pages: { ...d.pages, [sec]: { ...d.pages[sec], [k]: v } } });
  const c = d.content, p = d.pricing, pg = d.pages, tok = sessionStorage.getItem('t');
  const Save = ({ k }) => <p><button className="btn" onClick={() => save(k)}>Save changes</button> <span className="ok">{msg}</span></p>;
  const newCount = d.inquiries.filter(i => i.status === 'new').length;
  const techNames = p.technologies.map(t => t.name), currencyCodes = p.currencies.map(x => x.code);
  const matTechNames = pg.materials.technologies.map(t => t.name);
  const catNames = pg.services.categories.map(x => x.name);
  return (
    <div className="w ad">
      <div className="adh"><h2>Admin panel</h2><div><a className="pill" href="/">View site</a> <button className="pill" onClick={logout}>Logout</button></div></div>
      <div className="pills" style={{ marginBottom: 20 }}>{[['inq', `Inquiries (${newCount} new)`], ['content', 'Website content'], ['pages', 'Industries / Services / Materials'], ['pricing', 'Pricing & materials']].map(([k, l]) => <button key={k} className={'pill' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</button>)}</div>

      {tab === 'inq' && <div className="card tbl"><table><thead><tr><th>Date</th><th>From</th><th>Message</th><th>File</th><th>Status</th><th></th></tr></thead><tbody>
        {d.inquiries.map(q => <tr key={q.id}>
          <td>{new Date(q.createdAt).toLocaleString()}</td>
          <td><b>{q.name}</b><br /><a href={'mailto:' + q.email}>{q.email}</a><br />{q.phone}<br /><small>{q.topic}</small></td>
          <td style={{ maxWidth: 380, whiteSpace: 'pre-wrap' }}>
            {q.message}
            {q.notes && (<><br /><br /><b>Customer notes:</b><br />{q.notes}</>)}
          </td>
          <td>
            {q.file ? <a href={`/api/admin/files/${q.file}?t=${tok}`}>⬇ {q.fileName}</a> : '—'}
            {(q.drawings || []).length > 0 && <div style={{ marginTop: 6 }}><small>Drawings:</small></div>}
            {(q.drawings || []).map((f, i) => <div key={i}><a href={`/api/admin/files/${f.file}?t=${tok}`}>⬇ {f.fileName}</a></div>)}
          </td>
          <td><span className={'tag ' + q.status}>{q.status}</span></td>
          <td><button className="pill" onClick={() => api('/admin/inquiries/' + q.id, { method: 'PATCH', body: { status: q.status === 'new' ? 'done' : 'new' }, auth: true }).then(refresh)}>{q.status === 'new' ? 'Mark done' : 'Reopen'}</button>{' '}
            <button className="pill" onClick={() => confirm('Delete this inquiry?') && api('/admin/inquiries/' + q.id, { method: 'DELETE', auth: true }).then(refresh)}>🗑</button></td>
        </tr>)}</tbody></table>{!d.inquiries.length && <p>No inquiries yet.</p>}</div>}

      {tab === 'content' && <div className="card">
        <div className="r3">{TXT.map(([k, l]) => <Inp key={k} label={l} value={c[k]} onChange={v => setC(k, v)} />)}</div>
        {AREA.map(([k, l]) => <Inp key={k} area label={l} value={c[k]} onChange={v => setC(k, v)} />)}
        {LISTS.map(([k, l, f]) => <div key={k}><H3>{l}</H3><List items={c[k]} onChange={v => setC(k, v)} fields={f} /></div>)}

        <H3>Quote form &amp; viewer</H3>
        <div className="r3">
          {QUOTE_TXT.map(([k, l]) => <Inp key={k} label={l} value={c[k]} onChange={v => setC(k, v)} />)}
          <Sel label="Show drawings & notes section" value={c.drawEnabled} opts={YN} onChange={v => setC('drawEnabled', v)} />
          <Sel label="Show detected holes list" value={c.showHoles} opts={YN} onChange={v => setC('showHoles', v)} />
          <Sel label="Show geometry analysis panel" value={c.showChecks} opts={YN} onChange={v => setC('showChecks', v)} />
        </div>
        <H3>Geometry analysis checks</H3>
        <List items={c.checks} onChange={v => setC('checks', v)} fields={[['key', 'Check', 'select', CHECK_KEYS], ['label', 'Label shown to customer'], ['on', 'Show', 'select', YN]]} />
        <Save k="content" /></div>}

      {tab === 'pages' && <div className="card">
        <p className="mut sm">Images upload instantly, but they only appear on the site after you press Save changes at the bottom.</p>

        <H3>Home page: Recent work carousel</H3>
        <Inp label="Section title" value={pg.home.title} onChange={v => setPg('home', 'title', v)} />
        <Inp area label="Intro text" value={pg.home.text} onChange={v => setPg('home', 'text', v)} />
        <List items={pg.home.slides} onChange={v => setPg('home', 'slides', v)} fields={SLIDES} />

        <H3>Industries page</H3>
        <Inp label="Page title" value={pg.industries.title} onChange={v => setPg('industries', 'title', v)} />
        <Inp area label="Intro text" value={pg.industries.text} onChange={v => setPg('industries', 'text', v)} />
        <p className="mut sm">Banner carousel slides.</p>
        <List items={pg.industries.slides} onChange={v => setPg('industries', 'slides', v)} fields={SLIDES} />
        <p className="mut sm">Industries.</p>
        <List items={pg.industries.items} onChange={v => setPg('industries', 'items', v)} fields={[['image', 'Image', 'image'], ['name', 'Industry'], ['desc', 'Description', 'area'], ['uses', 'Use cases (one per line)', 'area']]} />

        <H3>Services page</H3>
        <Inp label="Page title" value={pg.services.title} onChange={v => setPg('services', 'title', v)} />
        <Inp area label="Intro text" value={pg.services.text} onChange={v => setPg('services', 'text', v)} />
        <Inp label="Group heading (e.g. Advance Manufacturing)" value={pg.services.groupTitle} onChange={v => setPg('services', 'groupTitle', v)} />
        <Inp area label="Group text" value={pg.services.groupText} onChange={v => setPg('services', 'groupText', v)} />
        <p className="mut sm">Banner carousel slides.</p>
        <List items={pg.services.slides} onChange={v => setPg('services', 'slides', v)} fields={SLIDES} />
        <p className="mut sm">Categories, e.g. Metal 3D printing, Plastic 3D printing.</p>
        <List items={pg.services.categories} onChange={v => setPg('services', 'categories', v)} fields={[['image', 'Image', 'image'], ['name', 'Category'], ['desc', 'Description', 'area']]} />
        <p className="mut sm">Technologies under each category, e.g. FDM, SLA, MJF (image optional).</p>
        <List items={pg.services.technologies} onChange={v => setPg('services', 'technologies', v)} fields={[['image', 'Image', 'image'], ['category', 'Category', 'select', ['', ...catNames]], ['name', 'Technology'], ['desc', 'Description', 'area']]} />

        <H3>Materials page</H3>
        <Inp label="Page title" value={pg.materials.title} onChange={v => setPg('materials', 'title', v)} />
        <Inp area label="Intro text" value={pg.materials.text} onChange={v => setPg('materials', 'text', v)} />
        <p className="mut sm">Banner carousel slides.</p>
        <List items={pg.materials.slides} onChange={v => setPg('materials', 'slides', v)} fields={SLIDES} />
        <p className="mut sm">Technologies (shown as selectable tabs, with an image).</p>
        <List items={pg.materials.technologies} onChange={v => setPg('materials', 'technologies', v)} fields={[['image', 'Image', 'image'], ['name', 'Technology'], ['desc', 'Description', 'area']]} />
        <p className="mut sm">Materials for each technology, with an image and an optional PDF datasheet.</p>
        <MaterialsEditor items={pg.materials.items} techNames={matTechNames} onChange={v => setPg('materials', 'items', v)} />
        <Save k="pages" /></div>}

      {tab === 'pricing' && <div className="card">
        <div className="r3">{[['currency', 'Currency symbol', 'text'], ['setupFee', 'Setup fee', 'number'], ['hourlyRate', 'Machine rate / hour', 'number'], ['speedCm3PerHour', 'Print speed (cm³/h)', 'number'], ['markupPct', 'Markup %', 'number'], ['minPrice', 'Minimum order', 'number'], ['supportsPct', 'Supports extra %', 'number'], ['wallMm', 'Wall thickness (mm)', 'number'], ['rangePct', 'Estimate range ± %', 'number']]
          .map(([k, l, t]) => <Inp key={k} label={l} type={t} value={p[k]} onChange={v => setP(k, v)} />)}
          {['X', 'Y', 'Z'].map((a, i) => <Inp key={a} label={`Build volume ${a} (mm)`} type="number" value={p.buildVolume[i]} onChange={v => setP('buildVolume', p.buildVolume.map((x, j) => j === i ? v : x))} />)}</div>

        <H3>Technologies (shown in the Technology dropdown)</H3>
        <p className="mut sm">Machine rate and print speed are multiplied by these values. Reference layer is the layer height your base print speed is measured at.</p>
        <List items={p.technologies} onChange={v => setP('technologies', v)} fields={[['name', 'Name'], ['desc', 'Description'], ['rateMul', 'Rate ×', 'number'], ['speedMul', 'Speed ×', 'number'], ['refLayer', 'Reference layer (mm)', 'number']]} />

        <H3>Model units (shown in the unit dropdown)</H3>
        <p className="mut sm">"mm per unit" converts the customer's choice to millimetres, e.g. 25.4 for inches.</p>
        <List items={p.units} onChange={v => setP('units', v)} fields={[['name', 'Name'], ['factor', 'mm per unit', 'number']]} />

        <H3>Quality levels (shown in the Quality dropdown)</H3>
        <List items={p.qualities} onChange={v => setP('qualities', v)} fields={[['name', 'Name'], ['layer', 'Layer height (mm)', 'number'], ['tech', 'Technology', 'select', ['', ...techNames]]]} />

        <H3>Infill options (shown in the Infill dropdown)</H3>
        <List items={p.infills} onChange={v => setP('infills', v)} fields={[['value', 'Infill %', 'number']]} />

        <H3>Materials (shown after a technology is chosen)</H3>
        <List items={p.materials} onChange={v => setP('materials', v)} fields={[['name', 'Name'], ['tech', 'Technology', 'select', ['', ...techNames]], ['desc', 'Description'], ['density', 'Density g/cm³', 'number'], ['pricePerGram', 'Price / gram', 'number']]} />

        <H3>Currencies</H3>
        <p className="mut sm">Prices are calculated in the currency whose rate is 1, then multiplied by the rate of the currency the customer picks.</p>
        <List items={p.currencies} onChange={v => setP('currencies', v)} fields={[['code', 'Code'], ['symbol', 'Symbol'], ['rate', 'Rate', 'number']]} />

        <H3>Countries (shown in the Country dropdown)</H3>
        <List items={p.countries} onChange={v => setP('countries', v)} fields={[['name', 'Country'], ['currency', 'Default currency', 'select', currencyCodes]]} />
        <Save k="pricing" /></div>}
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(!!sessionStorage.getItem('t')), [email, setEmail] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState('');
  const login = async () => {
    setErr('');
    try {
      const { token } = await api('/login', { method: 'POST', body: { email: email.trim(), password: pw } });
      sessionStorage.setItem('t', token);
      setAuthed(true);
    } catch (e) { setErr(e.message); }
  };
  const logout = () => { sessionStorage.removeItem('t'); setAuthed(false); };
  if (authed) return <Panel logout={logout} />;
  return <div className="w" style={{ maxWidth: 420, paddingTop: 100 }}><div className="card"><h3>Admin login</h3>
    <Inp label="Email" type="email" value={email} onChange={setEmail} autoComplete="username" /><br />
    <Inp label="Password" type="password" value={pw} onChange={setPw} autoComplete="current-password" onKeyDown={e => e.key === 'Enter' && login()} /><br />
    <button className="btn" onClick={login}>Login</button>{err && <p className="err">{err}</p>}</div></div>;
}