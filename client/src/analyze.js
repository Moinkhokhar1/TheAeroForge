/* Runs in the browser on the meshes returned by occt-import-js.
   - detectHoles: finds inward-facing cylindrical B-rep faces, groups coaxial ones.
   - geometryChecks: quick printability checks (closed mesh, thin walls, overhangs, single body). */

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]);
const unit = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// [name, tap drill Ø, clearance Ø]
const THREADS = [['M3', 2.5, 3.4], ['M4', 3.3, 4.5], ['M5', 4.2, 5.5], ['M6', 5, 6.6], ['M8', 6.8, 9], ['M10', 8.5, 11], ['M12', 10.2, 13.5]];
export const fitLabel = d => {
  const t = THREADS.find(x => Math.abs(d - x[1]) < 0.15) || THREADS.find(x => Math.abs(d - x[2]) < 0.2);
  return t ? 'fits ' + t[0] : '';
};

// least-squares circle through 2D points (Kasa fit)
function circle(xs, ys) {
  const n = xs.length; let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; }
  mx /= n; my /= n;
  let Suu = 0, Suv = 0, Svv = 0, Suuu = 0, Svvv = 0, Suvv = 0, Svuu = 0;
  for (let i = 0; i < n; i++) {
    const u = xs[i] - mx, v = ys[i] - my;
    Suu += u * u; Suv += u * v; Svv += v * v; Suuu += u * u * u; Svvv += v * v * v; Suvv += u * v * v; Svuu += v * u * u;
  }
  const det = Suu * Svv - Suv * Suv;
  if (Math.abs(det) < 1e-9) return null;
  const a = (Suuu + Suvv) / 2, b = (Svvv + Svuu) / 2;
  const uc = (a * Svv - b * Suv) / det, vc = (Suu * b - Suv * a) / det;
  return { x: uc + mx, y: vc + my, r: Math.sqrt(uc * uc + vc * vc + (Suu + Svv) / n) };
}

export function detectHoles(meshes) {
  const segs = [];
  for (const m of meshes) {
    const p = m.attributes.position.array, nr = m.attributes.normal && m.attributes.normal.array, ix = m.index.array;
    if (!nr || !m.brep_faces) continue;
    for (const f of m.brep_faces) {
      const set = new Set();
      for (let t = f.first * 3; t < (f.last + 1) * 3; t++) set.add(ix[t]);
      const vs = [...set]; if (vs.length < 8) continue;
      const N = vs.map(i => [nr[i * 3], nr[i * 3 + 1], nr[i * 3 + 2]]);
      // axis = cross product of the two most different normals; for a cylinder all normals are perpendicular to it
      let c = [0, 0, 0], bl = 0;
      for (const q of N) { const x = cross(N[0], q), l = len(x); if (l > bl) { bl = l; c = x; } }
      if (bl < 0.25) continue;
      let ax = unit(c);
      if (N.some(q => Math.abs(dot(q, ax)) > 0.05)) continue;
      const big = [0, 1, 2].reduce((b, i) => Math.abs(ax[i]) > Math.abs(ax[b]) ? i : b, 0);
      if (ax[big] < 0) ax = ax.map(v => -v);
      const u = unit(cross(ax, Math.abs(ax[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0])), v = cross(ax, u);
      const P = vs.map(i => [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]]);
      const xs = P.map(q => dot(q, u)), ys = P.map(q => dot(q, v)), ts = P.map(q => dot(q, ax));
      const cc = circle(xs, ys);
      if (!cc || !isFinite(cc.r) || cc.r < 0.2 || cc.r > 1e4) continue;
      let err = 0, inward = 0;
      for (let i = 0; i < P.length; i++) {
        const rx = xs[i] - cc.x, ry = ys[i] - cc.y;
        err += Math.abs(Math.hypot(rx, ry) - cc.r);
        inward += dot(N[i], u) * rx + dot(N[i], v) * ry;
      }
      if (err / P.length > 0.02 * cc.r + 0.01) continue;   // not a real cylinder
      if (inward >= 0) continue;                           // normals point away from axis = outer boss, not a hole
      segs.push({
        r: cc.r, ax,
        cpt: [u[0] * cc.x + v[0] * cc.y, u[1] * cc.x + v[1] * cc.y, u[2] * cc.x + v[2] * cc.y],
        t0: ts.reduce((a, b) => Math.min(a, b), Infinity), t1: ts.reduce((a, b) => Math.max(a, b), -Infinity),
      });
    }
  }

  // group coaxial segments
  const groups = [];
  for (const s of segs) {
    const g = groups.find(g => {
      if (dot(g.ax, s.ax) < 0.999) return false;
      const d = sub(s.cpt, g.c), a = dot(d, g.ax);
      return len([d[0] - g.ax[0] * a, d[1] - g.ax[1] * a, d[2] - g.ax[2] * a]) < 0.05;
    });
    g ? g.segs.push(s) : groups.push({ ax: s.ax, c: s.cpt, segs: [s] });
  }

  const holes = groups.map((g, gi) => {
    // merge same-radius segments that touch or overlap along the axis (a hole is often split in two faces)
    const sorted = [...g.segs].sort((a, b) => Math.round(a.r * 100) - Math.round(b.r * 100) || a.t0 - b.t0);
    const parts = [];
    for (const s of sorted) {
      const last = parts[parts.length - 1];
      if (last && Math.abs(last.r - s.r) < 0.01 && s.t0 <= last.t1 + 0.05) last.t1 = Math.max(last.t1, s.t1);
      else parts.push({ r: s.r, t0: s.t0, t1: s.t1 });
    }
    const rmax = Math.max(...parts.map(x => x.r)), rmin = Math.min(...parts.map(x => x.r));
    const cbore = rmax - rmin > 0.05;
    const lenOf = r => parts.filter(x => Math.abs(x.r - r) < 0.01).reduce((a, x) => a + (x.t1 - x.t0), 0);
    const dia = +(2 * rmax).toFixed(1), depth = +lenOf(rmax).toFixed(1);
    return {
      id: 'h' + gi, kind: cbore ? 'cbore' : 'hole', dia, depth,
      rawDia: 2 * rmax, rawDepth: lenOf(rmax), minDia: 2 * rmin, minLen: lenOf(rmin),
      sub: cbore ? `through Ø${(2 * rmin).toFixed(1)} × ${lenOf(rmin).toFixed(1)} mm` : '',
      fit: fitLabel(cbore ? 2 * rmin : 2 * rmax),
      axis: g.ax, base: g.c, parts,
    };
  });
  return holes;
}

export function geometryChecks(meshes, { wall = 1, zmin = 0, dims = [1, 1, 1] } = {}) {
  const ids = new Map(), par = [], edge = new Map();
  const hash = (p, i) => Math.round(p[i] * 1e3) + ',' + Math.round(p[i + 1] * 1e3) + ',' + Math.round(p[i + 2] * 1e3);
  const id = (p, i) => { const k = hash(p, i); let v = ids.get(k); if (v === undefined) { v = par.length; par.push(v); ids.set(k, v); } return v; };
  const find = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  let total = 0, over = 0;
  for (const m of meshes) {
    const p = m.attributes.position.array, ix = m.index.array;
    for (let i = 0; i < ix.length; i += 3) {
      const a = ix[i] * 3, b = ix[i + 1] * 3, c = ix[i + 2] * 3;
      const v = [id(p, a), id(p, b), id(p, c)];
      for (let j = 0; j < 3; j++) {
        const x = v[j], y = v[(j + 1) % 3], k = x < y ? x * 4194304 + y : y * 4194304 + x;
        edge.set(k, (edge.get(k) || 0) + 1);
        par[find(x)] = find(y);
      }
      const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1];
      const uz = p[b + 2] - p[a + 2], vz = p[c + 2] - p[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz);
      if (!l) continue;
      total += l / 2;
      const onBed = Math.max(Math.abs(p[a + 2] - zmin), Math.abs(p[b + 2] - zmin), Math.abs(p[c + 2] - zmin)) < 0.01;
      if (!onBed && nz / l < -0.7071) over += l / 2;      // faces tilted more than 45° downward (Z is up)
    }
  }
  let open = 0; for (const n of edge.values()) if (n !== 2) { open++; break; }
  const roots = new Set(); for (let i = 0; i < par.length; i++) roots.add(find(i));
  return {
    watertight: { ok: open === 0 },
    thin: { ok: Math.min(...dims) >= wall },              // heuristic: smallest bounding-box side vs wall thickness
    overhang: { ok: total === 0 || over / total < 0.02 },
    integrity: { ok: roots.size === 1 },
  };
}