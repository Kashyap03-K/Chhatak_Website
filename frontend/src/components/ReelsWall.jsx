import { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';

const FALLBACK_REELS = [
  { shortcode: 'DZkcT1HsRaC', caption: 'Straight from the feed.' },
  { shortcode: 'DZmcmILCUx3', caption: 'The coastal crunch, tried and tasted.' },
  { shortcode: 'DZfC1SgIiyb', caption: 'Real reels, real reactions.' },
  { shortcode: 'DaQKQp_NKkn', caption: 'Fresh from the sea, made for you.' },
];

export default function ReelsWall() {
  const trackRef = useRef(null);
  const [reels, setReels] = useState(FALLBACK_REELS);

  useEffect(() => {
    api.get('/reels/')
      .then(({ data }) => { if (Array.isArray(data) && data.length) setReels(data); })
      .catch(() => {});
  }, []);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.reel-card');
    const step = card ? card.getBoundingClientRect().width + 24 : 360;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section id="reels" className="section reels-wall">
      <div className="container">
        <div className="reels-head">
          <div>
            <p className="kicker">— Reels</p>
            <h2 className="display sm">Straight from the <em>feed</em>.</h2>
          </div>
          <p className="muted-text">People trying Chhatak on Instagram. Real reels, real reactions.</p>
        </div>

        <div className="reels-scroller">
          <button type="button" className="reels-arrow reels-arrow--prev" onClick={() => scroll(-1)} aria-label="Previous reels">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </button>

          <div className="reels-track" ref={trackRef}>
            {reels.map((r) => (
              <article className="reel-card" key={r.shortcode}>
                <a
                  className="reel-frame"
                  href={`https://www.instagram.com/reel/${r.shortcode}/`}
                  target="_blank"
                  rel="noopener"
                  aria-label={`Open reel: ${r.caption}`}
                >
                  <iframe
                    className="reel-video"
                    src={`https://www.instagram.com/reel/${r.shortcode}/embed/?cr=1&hidecaption=true`}
                    title={r.caption}
                    loading="lazy"
                    allow="encrypted-media; picture-in-picture"
                    scrolling="no"
                    tabIndex={-1}
                  />
                </a>
                <div className="reel-meta">
                  <p className="reel-caption">{r.caption}</p>
                </div>
              </article>
            ))}
          </div>

          <button type="button" className="reels-arrow reels-arrow--next" onClick={() => scroll(1)} aria-label="Next reels">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>

        <p className="reels-cta">
          Tag <a href="https://instagram.com/chhatak.co" target="_blank" rel="noopener">@chhatak.co</a> in your reel — we repost the best ones.
        </p>
      </div>
    </section>
  );
}
