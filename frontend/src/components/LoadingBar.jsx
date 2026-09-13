import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Top-of-page progress bar that shows whenever an axios request is in flight
 * OR a route change is settling. Style is deliberately understated — a thin
 * accent-orange strip that eases across the top like YouTube / GitHub.
 */
export default function LoadingBar() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const hideTimerRef = useRef(null);
  const routeTimerRef = useRef(null);
  const pendingRef = useRef(0);
  const location = useLocation();

  const startProgress = () => {
    clearTimeout(hideTimerRef.current);
    setVisible(true);
    // Animate up to 80% while requests are in flight; the last 20% closes on completion.
    setProgress(8);
    let p = 8;
    const tick = () => {
      // Slow, easing-style creep — never actually reaches 80.
      p += Math.max(0.15, (80 - p) * 0.02);
      if (p >= 80) p = 80;
      setProgress(p);
      rafRef.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  const finishProgress = () => {
    cancelAnimationFrame(rafRef.current);
    setProgress(100);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 260);
  };

  useEffect(() => {
    const onPending = (e) => {
      pendingRef.current = e.detail || 0;
      if (pendingRef.current > 0 && !visible) startProgress();
      else if (pendingRef.current === 0) finishProgress();
    };
    window.addEventListener('api:pending', onPending);
    return () => window.removeEventListener('api:pending', onPending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also flash the bar briefly on every route change, in case the new page
  // hasn't fired any API call yet — visual confirmation to the user that
  // something is happening.
  useEffect(() => {
    clearTimeout(routeTimerRef.current);
    startProgress();
    routeTimerRef.current = setTimeout(() => {
      if (pendingRef.current === 0) finishProgress();
    }, 450);
    return () => clearTimeout(routeTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(hideTimerRef.current);
    clearTimeout(routeTimerRef.current);
  }, []);

  return (
    <div
      className={`loading-bar${visible ? ' is-visible' : ''}`}
      aria-hidden="true"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="loading-bar__fill" style={{ width: `${progress}%` }} />
    </div>
  );
}
