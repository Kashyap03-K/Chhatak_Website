import { useEffect, useState } from 'react';
import api from '../api/client.js';

const FALLBACK_REVIEWS = [
  { id: 'f1', author: 'Aarti Kulkarni', location: 'Mumbai, MH',    rating: 5,
    quote: 'Tastes exactly like the bombil my nani used to make. Finished the pouch before dinner.' },
  { id: 'f2', author: 'Rohan Mehta',    location: 'Bengaluru, KA', rating: 5,
    quote: 'The crunch is unreal. Perfect with an evening chai — one pouch is genuinely never enough.' },
  { id: 'f3', author: 'Priya Nair',     location: 'Diu, DD',       rating: 5,
    quote: 'Grew up in Diu — this is the closest anything store-bought has come to the real thing.' },
];

function Stars({ rating = 5 }) {
  return (
    <div className="review-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="26" height="26" fill={i < rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (first + last).toUpperCase() || '·';
}

export default function ReviewsWall() {
  const [reviews, setReviews] = useState(FALLBACK_REVIEWS);

  useEffect(() => {
    api.get('/reviews/')
      .then(({ data }) => { if (Array.isArray(data) && data.length) setReviews(data); })
      .catch(() => {});
  }, []);

  return (
    <section id="reviews" className="section reviews-wall">
      <div className="container">
        <div className="reviews-head">
          <div>
            <p className="kicker">— Reviews</p>
            <h2 className="display sm">Words from the <em>coast</em>, and beyond.</h2>
          </div>
          <p className="muted-text">Unedited, unsponsored. What people say after their first pouch.</p>
        </div>

        <div className="review-grid">
          {reviews.map((r) => (
            <article className="review-card" key={r.id}>
              <Stars rating={r.rating} />
              <blockquote className="review-quote">"{r.quote}"</blockquote>
              <footer className="review-author">
                <div className="review-avatar" aria-hidden="true">{initials(r.author)}</div>
                <div>
                  <p className="review-name">{r.author}</p>
                  {r.location && <p className="review-loc">{r.location}</p>}
                </div>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
