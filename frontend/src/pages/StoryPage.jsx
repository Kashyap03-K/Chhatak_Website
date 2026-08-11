import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const TOTAL_PAGES = 40;
const pad = (n) => String(n).padStart(2, '0');
const pageSrc = (n) => `/images/story/page-${pad(n)}.webp`;
const pages = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);

export default function StoryPage() {
  useEffect(() => {
    document.title = 'Our Story — Chhatak';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="story-page">
      <div className="story-page__stack">
        {pages.map((n) => (
          <img
            key={n}
            src={pageSrc(n)}
            alt={`Chhatak catalog page ${n}`}
            className="story-page__page"
            loading={n <= 2 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
          />
        ))}
      </div>
      <div className="story-page__cta">
        <Link to="/products" className="story-page__btn story-page__btn--primary">SHOP THE RANGE</Link>
        <Link to="/" className="story-page__btn story-page__btn--outline">BACK HOME</Link>
      </div>
    </div>
  );
}
