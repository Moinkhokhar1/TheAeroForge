import { useState, useEffect } from 'react';

// Full-screen loading screen. The styles live in client/index.html so the same
// screen can show before React has loaded; keep the markup here in sync with it.
const LAYERS = [40, 64, 84, 100, 112, 124];

// On a full page load the loading screen plays for at least this long, even if
// the data arrives sooner. 5600 = two full 2.8s animation cycles, so it ends
// right as the printed part fades out. Change it together with the 2.8s in index.html.
const MIN_MS = 5600;

// index.html records when the loading screen first appeared (window.__ld0).
const sinceStart = () => performance.now() - (window.__ld0 || 0);
const splashLeft = () => Math.max(0, MIN_MS - sinceStart());

// True while the first-load splash is still playing. `fade` says that a splash
// ran, so the page can fade in from it instead of cutting. Later page changes
// inside the app have nothing to wait for.
export function useSplash() {
  const [wait, setWait] = useState(() => splashLeft() > 0);
  const [fade] = useState(wait);

  useEffect(() => {
    if (!wait) return;
    const t = setTimeout(() => setWait(false), splashLeft());
    return () => clearTimeout(t);
  }, []);

  return { wait, fade };
}

// The first Loader continues the animation started by the static one in
// index.html (no restart). Later ones (in-app navigation) fade in after a short
// delay, so fast loads never flash a dark screen.
let handedOff = false;

export default function Loader() {
  const [state] = useState(() => {
    const soft = handedOff;
    handedOff = true;
    return { soft, offset: soft ? 0 : sinceStart() };
  });

  return (
    <div
      className={'ld' + (state.soft ? ' soft' : '')}
      style={state.soft ? undefined : { '--ld-t': `-${state.offset}ms` }}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="ld-print" aria-hidden="true">
        <div className="ld-head"><i /></div>
        <div className="ld-stack">
          {LAYERS.map((w) => <b key={w} style={{ width: w }} />)}
        </div>
        <div className="ld-plate" />
      </div>
      <Brand />
      <p className="ld-txt">Preparing your print</p>
    </div>
  );
}

function Brand() {
  return (
    <div className="ld-brand">
      <img src="/assets/icon-512.png" alt="" />
      <span>The AeroForge</span>
    </div>
  );
}

// Rendered on top of the page when the splash ends: fades the loading screen
// out, then removes itself.
export function SplashExit({ on }) {
  const [gone, setGone] = useState(false);
  if (!on || gone) return null;
  return (
    <div className="ld out" aria-hidden="true" onAnimationEnd={() => setGone(true)}>
      <Brand />
      <p className="ld-txt">Preparing your print</p>
    </div>
  );
}
