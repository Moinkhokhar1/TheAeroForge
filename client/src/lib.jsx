export const api = async (url, { body, method = 'GET', auth } = {}) => {
  const h = {}, fd = body instanceof FormData;
  if (body && !fd) h['Content-Type'] = 'application/json';
  if (auth) h.Authorization = 'Bearer ' + sessionStorage.getItem('t');
  const r = await fetch('/api' + url, { method, headers: h, body: body && !fd ? JSON.stringify(body) : body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Request failed');
  return j;
};
export const Inp = ({ label, value, onChange, type = 'text', area, ...p }) => (
  <div><label>{label}</label>
    {area ? <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} {...p} />
      : <input type={type} value={value ?? ''} {...p} onChange={e => onChange(type === 'number' ? +e.target.value : e.target.value)} />}
  </div>
);
