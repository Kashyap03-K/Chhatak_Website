import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

// A long-form "story chapters" view.
// Reads the `our-story` landing section from the CMS and renders each image
// (image_url) with its title + body as a paragraph beneath it. Falls back to
// the landing story-banner images if `our-story` hasn't been populated yet.
export default function OurStoryPage() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Our Story — Chhatak';
    window.scrollTo(0, 0);
    api.get('/landing/sections').then(({ data }) => {
      const sections = data || [];
      const ourStory = sections.find((s) => s.key === 'our-story');
      const fallback = sections.find((s) => s.key === 'story');
      const source = (ourStory?.images?.length ? ourStory : fallback);
      const imgs = source?.images || [];
      setChapters(imgs);
    }).catch(() => setChapters([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="our-story-page">
      <div className="v2-container our-story-container">
        <p className="v2-kicker accent">OUR STORY</p>
        <h1 className="our-story-title">Born on the coast.<br />Made for everyone.</h1>
        <p className="our-story-lede">
          From the fishermen's daily catch to your hands, Chhatak brings you the authentic
          taste of Bombil with a crunchy twist — a snack that fits every mood, every meal,
          every moment.
        </p>

        {loading ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 40 }}>Loading…</p>
        ) : chapters.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 40 }}>
            Story chapters haven't been added yet. Set them up in <em>Admin → UI/UX → Our Story chapters</em>.
          </p>
        ) : (
          <div className="our-story-chapters">
            {chapters.map((img, i) => (
              <article className="our-story-chapter" key={img.id ?? i}>
                <div className="our-story-chapter__media">
                  {img.media_type === 'video' ? (
                    <video src={img.image_url} muted playsInline autoPlay loop />
                  ) : (
                    <img
                      src={img.image_url}
                      alt={img.title || `Chhatak story chapter ${i + 1}`}
                      loading={i === 0 ? 'eager' : 'lazy'}
                    />
                  )}
                </div>
                {(img.title || img.body) && (
                  <div className="our-story-chapter__caption">
                    {img.title && <h2 className="our-story-chapter__title">{img.title}</h2>}
                    {img.body && <p className="our-story-chapter__body">{img.body}</p>}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="our-story-cta">
          <Link to="/products" className="v2-btn v2-btn--primary">SHOP THE RANGE</Link>
          <Link to="/" className="v2-btn v2-btn--outline">BACK HOME</Link>
        </div>
      </div>
    </div>
  );
}
