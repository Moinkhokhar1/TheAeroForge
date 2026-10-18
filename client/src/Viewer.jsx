// import { useEffect, useRef } from 'react';
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// export default function Viewer({ meshes }) {
//   const ref = useRef();
//   useEffect(() => {
//     const el = ref.current, w = el.clientWidth, h = el.clientHeight;
//     const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//     r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.setSize(w, h); el.appendChild(r.domElement);
//     const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(38, w / h, 0.1, 20000);
//     sc.add(new THREE.HemisphereLight(0xffffff, 0x334466, 1.3));
//     const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(1, 2, 1.5); sc.add(dl);
//     const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0xc4602b, roughness: 0.55, metalness: 0.1 });
//     meshes.forEach(m => {
//       const bg = new THREE.BufferGeometry();
//       bg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(m.attributes.position.array), 3));
//       if (m.attributes.normal) bg.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(m.attributes.normal.array), 3));
//       bg.setIndex(new THREE.BufferAttribute(new Uint32Array(m.index.array), 1));
//       if (!m.attributes.normal) bg.computeVertexNormals();
//       g.add(new THREE.Mesh(bg, mat));
//     });
//     g.rotation.x = -Math.PI / 2; sc.add(g); g.updateMatrixWorld(true);   // STEP is Z-up
//     const b = new THREE.Box3().setFromObject(g), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
//     const d = Math.max(s.x, s.y, s.z);
//     g.position.set(-c.x, -b.min.y, -c.z);
//     sc.add(new THREE.GridHelper(d * 3, 24, 0x3a5080, 0x25365a));
//     cam.position.set(d * 1.5, d * 1.1, d * 1.7);
//     const ctl = new OrbitControls(cam, r.domElement);
//     ctl.target.set(0, s.y / 2, 0); ctl.autoRotate = true; ctl.autoRotateSpeed = 1.2; ctl.enableDamping = true;
//     let id; const loop = () => { ctl.update(); r.render(sc, cam); id = requestAnimationFrame(loop); }; loop();
//     return () => { cancelAnimationFrame(id); ctl.dispose(); r.dispose(); el.innerHTML = ''; mat.dispose(); g.children.forEach(x => x.geometry.dispose()); };
//   }, [meshes]);
//   return <div ref={ref} style={{ height: 420 }} />;
// }
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const HOLE_COL = { hole: '#d9534f', cbore: '#4a90e2', sel: '#f5a623' };

export default function Viewer({ meshes, holes = [], selected = null, onSelect, volume, checks = [], showHoles = true }) {
  const wrap = useRef(), cv = useRef(), g = useRef({});
  const [mode, setMode] = useState('3D'), [bg, setBg] = useState('white'), [holesOn, setHolesOn] = useState(true);
  const [xray, setXray] = useState(true), [box, setBox] = useState(false), [fs, setFs] = useState(false);
  const dark = bg === 'black', ink = dark ? '#fff' : '#0f172a';

  useEffect(() => { g.current.onSelect = onSelect; });

  /* ---- scene setup (re-runs when a new file is loaded) ---- */
  useEffect(() => {
    const el = cv.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(window.devicePixelRatio);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 1.1));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(1, -1, 2); scene.add(dl);
    const root = new THREE.Group(); scene.add(root);
    const mat = new THREE.MeshStandardMaterial({ color: 0xb9bec6, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, roughness: 0.8 });
    const lineMat = new THREE.LineBasicMaterial({ color: 0x222222 });
    const bb = new THREE.Box3();
    for (const m of meshes) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(m.attributes.position.array, 3));
      geo.setIndex(new THREE.BufferAttribute(new Uint32Array(m.index.array), 1));
      if (m.attributes.normal) geo.setAttribute('normal', new THREE.Float32BufferAttribute(m.attributes.normal.array, 3)); else geo.computeVertexNormals();
      geo.computeBoundingBox(); bb.union(geo.boundingBox);
      root.add(new THREE.Mesh(geo, mat), new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), lineMat));
    }
    const center = bb.getCenter(new THREE.Vector3()), size = bb.getSize(new THREE.Vector3()), d = size.length() || 1;
    root.position.copy(center).negate();                     // everything orbits around the part centre
    const boxHelper = new THREE.Box3Helper(bb, 0xee6a30); boxHelper.visible = false; root.add(boxHelper);
    const holeGroup = new THREE.Group(); root.add(holeGroup);

    const persp = new THREE.PerspectiveCamera(40, 1, d / 100, d * 20); persp.up.set(0, 0, 1);
    const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, d * 10);
    const controls = new OrbitControls(persp, renderer.domElement); controls.enableDamping = true;

    const fit = () => {
      if (g.current.mode === '2D') { ortho.position.set(0, 0, d * 2); ortho.up.set(0, 1, 0); ortho.zoom = 1; ortho.updateProjectionMatrix(); controls.object = ortho; controls.enableRotate = false; }
      else { persp.position.set(d * 0.9, -d * 0.9, d * 0.7); controls.object = persp; controls.enableRotate = true; }
      controls.target.set(0, 0, 0); controls.update();
    };
    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1, hh = d * 0.6;
      renderer.setSize(w, h); persp.aspect = w / h; persp.updateProjectionMatrix();
      ortho.left = -hh * w / h; ortho.right = hh * w / h; ortho.top = hh; ortho.bottom = -hh; ortho.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();

    let raf; const loop = () => { raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, controls.object); }; loop();

    // click a hole in the 3D view to select it (ignore drags)
    let down = null; const dom = renderer.domElement;
    const pd = e => { down = [e.clientX, e.clientY]; };
    const pu = e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return;
      const r = dom.getBoundingClientRect(), rc = new THREE.Raycaster();
      rc.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), controls.object);
      const hit = rc.intersectObjects(holeGroup.children, false)[0];
      g.current.onSelect && g.current.onSelect(hit ? hit.object.userData.id : null);
    };
    dom.addEventListener('pointerdown', pd); dom.addEventListener('pointerup', pu);

    Object.assign(g.current, { scene, mat, lineMat, boxHelper, holeGroup, fit });
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      dom.removeEventListener('pointerdown', pd); dom.removeEventListener('pointerup', pu);
      renderer.dispose(); el.removeChild(renderer.domElement);
    };
  }, [meshes]);

  /* ---- toggles ---- */
  useEffect(() => { g.current.mode = mode; g.current.fit(); }, [mode, meshes]);
  useEffect(() => { g.current.scene.background = new THREE.Color(dark ? 0x111418 : 0xf4f6fb); g.current.lineMat.color.set(dark ? 0xdddddd : 0x222222); }, [bg, meshes]);
  useEffect(() => { const { mat } = g.current; mat.opacity = xray ? 0.35 : 1; mat.depthWrite = !xray; mat.needsUpdate = true; }, [xray, meshes]);
  useEffect(() => { g.current.boxHelper.visible = box; }, [box, meshes]);
  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement); document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  /* ---- hole overlays ---- */
  useEffect(() => {
    const hg = g.current.holeGroup;
    hg.children.forEach(c => { c.geometry.dispose(); c.material.dispose(); }); hg.clear();
    if (!holesOn || !showHoles) return;
    for (const h of holes) {
      const col = h.id === selected ? HOLE_COL.sel : HOLE_COL[h.kind];
      const ax = new THREE.Vector3(...h.axis);
      for (const s of h.parts) {
        const me = new THREE.Mesh(new THREE.CylinderGeometry(s.r, s.r, Math.max(s.t1 - s.t0, 0.01), 28), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.6 }));
        me.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ax);
        me.position.set(...h.base).addScaledVector(ax, (s.t0 + s.t1) / 2);
        me.userData.id = h.id; hg.add(me);
      }
    }
  }, [holes, selected, holesOn, showHoles, meshes]);

  const btn = on => ({ border: 0, borderRadius: 12, padding: '10px 14px', cursor: 'pointer', font: '600 13px inherit', background: on ? '#2563eb' : 'rgba(255,255,255,.92)', color: on ? '#fff' : '#0f172a' });
  const seg = on => ({ border: 0, padding: '9px 22px', cursor: 'pointer', font: '700 15px inherit', borderRadius: 999, background: on ? '#2563eb' : 'transparent', color: on ? '#fff' : '#0f172a' });

  return (
    <div ref={wrap} style={{ position: 'relative', height: fs ? '100vh' : 460, borderRadius: 16, overflow: 'hidden', border: '1px solid #d6def5' }}>
      <div ref={cv} style={{ position: 'absolute', inset: 0 }} />

      <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 2, background: 'rgba(255,255,255,.92)', borderRadius: 999, padding: 3 }}>
        {['2D', '3D'].map(k => <button key={k} style={seg(mode === k)} onClick={() => setMode(k)}>{k}</button>)}
      </div>

      <div style={{ position: 'absolute', top: 62, left: 14, color: ink, font: '600 13px inherit' }}>
        Volume: {volume} mm³
        <div style={{ marginTop: 10, background: 'rgba(255,255,255,.95)', border: '1.5px solid #0f172a', borderRadius: 10, padding: '8px 12px', color: '#0f172a' }}>
          {[['white', '#fff'], ['black', '#000']].map(([k, c]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', cursor: 'pointer', fontSize: 15 }}>
              <input type="radio" name="vbg" checked={bg === k} onChange={() => setBg(k)} style={{ display: 'none' }} />
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: bg === k ? '3px solid #2563eb' : '1px solid #94a3b8' }} />
              {k[0].toUpperCase() + k.slice(1)}
            </label>))}
        </div>
      </div>

      {!!checks.length && (
        <div style={{ position: 'absolute', top: 12, right: 12, textAlign: 'right', color: ink, font: '500 13px/1.9 inherit' }}>
          <b>Geometry analysis</b>
          {checks.map(c => (
            <div key={c.label}>{c.label}{' '}
              <span style={{ display: 'inline-block', width: 22, height: 22, lineHeight: '22px', textAlign: 'center', borderRadius: '50%', background: c.ok ? '#bbf7d0' : '#fde68a', color: c.ok ? '#16a34a' : '#b45309', fontWeight: 700 }}>{c.ok ? '✓' : '!'}</span>
            </div>))}
        </div>
      )}

      <div style={{ position: 'absolute', left: 10, right: 10, bottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button style={btn(false)} onClick={() => g.current.fit()}>Center</button>
        {showHoles && <button style={btn(holesOn)} onClick={() => setHolesOn(!holesOn)}>Holes</button>}
        <button style={btn(xray)} onClick={() => setXray(!xray)}>X-ray</button>
        <button style={btn(box)} onClick={() => setBox(!box)}>Bounds</button>
        <button style={{ ...btn(false), marginLeft: 'auto' }} onClick={() => document.fullscreenElement ? document.exitFullscreen() : wrap.current.requestFullscreen && wrap.current.requestFullscreen()}>⛶</button>
      </div>
    </div>
  );
}