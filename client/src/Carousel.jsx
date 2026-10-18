import { useState, useEffect, useRef, useCallback } from 'react';

export const imgUrl = (f) =>
  !f ? '' : /^(https?:|data:)/.test(f) ? f : '/api/images/' + f;

const reduce =
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Carousel({ slides, auto = 5500, variant = 'hero' }) {
  const list = Array.isArray(slides) ? slides : [];
  const n = list.length;
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const x0 = useRef(null);

  const go = useCallback((d) => setI((v) => (v + d + n) % n), [n]);

  useEffect(() => {
    if (i >= n) setI(0);
  }, [n, i]);

  useEffect(() => {
    if (n < 2 || hold || !auto || reduce) return;
    const t = setInterval(() => go(1), auto);
    return () => clearInterval(t);
  }, [n, hold, auto, go]);

  if (!n) return null;

  return (
    <div
      className={'cr ' + variant}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      }}
      onTouchStart={(e) => {
        x0.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (x0.current == null) return;
        const dx = e.changedTouches[0].clientX - x0.current;
        x0.current = null;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="cr-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {list.map((s, k) => (
          <div
            key={k}
            className={'cr-slide g' + (k % 4) + (k === i ? ' act' : '')}
            aria-hidden={k !== i}
          >
            {imgUrl(s.image) && (
              <img
                src={imgUrl(s.image)}
                alt={s.title || ''}
                loading={k ? 'lazy' : 'eager'}
                draggable={false}
              />
            )}
            <div className="cr-cap">
              {s.title && <h3>{s.title}</h3>}
              {s.text && <p>{s.text}</p>}
            </div>
          </div>
        ))}
      </div>

      {n > 1 && (
        <>
          <button className="cr-btn prev" aria-label="Previous slide" onClick={() => go(-1)}>‹</button>
          <button className="cr-btn next" aria-label="Next slide" onClick={() => go(1)}>›</button>
          <div className="cr-dots">
            {list.map((_, k) => (
              <button
                key={k}
                className={k === i ? 'on' : ''}
                aria-label={'Go to slide ' + (k + 1)}
                onClick={() => setI(k)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}