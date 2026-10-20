import { useId } from 'react';

export const api = async (url, { body, method = 'GET', auth } = {}) => {
  const h = {}, fd = body instanceof FormData;
  if (body && !fd) h['Content-Type'] = 'application/json';
  if (auth) h.Authorization = 'Bearer ' + sessionStorage.getItem('t');
  const r = await fetch('/api' + url, { method, headers: h, body: body && !fd ? JSON.stringify(body) : body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
};

// Labelled input. The label is tied to the field (click/screen-reader friendly) and an
// `error` string is shown under it and announced.
export const Inp = ({ label, value, onChange, type = 'text', area, error, ...p }) => {
  const id = useId();
  const common = { id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': error ? id + '-e' : undefined, ...p };
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      {area
        ? <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} {...common} />
        : <input type={type} value={value ?? ''} {...common} onChange={e => onChange(type === 'number' ? +e.target.value : e.target.value)} />}
      {error && <p className="err sm" id={id + '-e'} role="alert">{error}</p>}
    </div>
  );
};

// Spam trap: invisible to people, tempting to bots. The server drops anything that fills it in.
export const HoneyPot = ({ value, onChange }) => (
  <div className="hp" aria-hidden="true">
    <label>Leave this empty
      <input type="text" name="hp_url" tabIndex={-1} autoComplete="off" value={value} onChange={e => onChange(e.target.value)} />
    </label>
  </div>
);
