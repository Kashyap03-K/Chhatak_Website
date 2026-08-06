import { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';

export default function ReelsWall() {
  const trackRef = useRef(null);
  const [reels, setReels] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/reels/')
      .then(({ data }) => { if (Array.isArray(data)) setReels(data.filter((r) => r.video_url)); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.reel-card');
    const step = card ? card.getBoundingClientRect().width + 24 : 360;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (loaded && reels.length === 0) return null;

  return (
    <section id="reels" className="section reels-wall reels-wall--centered">
      <div className="container">
        <div className="reels-head reels-head--centered">
          <h2 className="reels-title">Stay Chhatak</h2>
        </div>

        <div className="reels-scroller">
          <button type="button" className="reels-arrow reels-arrow--prev" onClick={() => scroll(-1)} aria-label="Previous reels">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </button>

          <div className="reels-track" ref={trackRef}>
            {reels.map((r) => (
              <article className="reel-card" key={r.id}>
                <div
                  className="reel-frame"
                  style={{
                    position: 'relative',
                    display: 'block',
                    width: '100%',
                    height: 0,
                    paddingBottom: '125%',
                    overflow: 'hidden',
                    borderRadius: 4,
                    background: '#000',
                  }}
                >
                  <video
                    className="reel-video"
                    src={r.video_url}
                    poster={r.poster_url || undefined}
                    controls
                    playsInline
                    preload="metadata"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      background: '#000',
                    }}
                  />
                </div>
                {r.caption && <p className="reel-caption" style={{ marginTop: 10, textAlign: 'center' }}>{r.caption}</p>}
              </article>
            ))}
          </div>

          <button type="button" className="reels-arrow reels-arrow--next" onClick={() => scroll(1)} aria-label="Next reels">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>

        <div className="reels-footer">
          <a href="https://instagram.com/chhatak.co" target="_blank" rel="noopener" className="reels-handle">@chhatak.co</a>
          <a href="https://instagram.com/chhatak.co" target="_blank" rel="noopener" className="reels-ig-btn">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
            <span>Follow us on Instagram</span>
          </a>
        </div>
      </div>
    </section>
  );
}
