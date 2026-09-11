import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

// Full-page gallery of the story slideshow images.
// Reads /landing/sections and pulls out the `story` section's uploaded images.
export default function OurStoryPage() {
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    document.title = 'Our Story — Chhatak';
    window.scrollTo(0, 0);
    api.get('/landing/sections').then(({ data }) => {
      const story = (data || []).find((s) => s.key === 'story');
      const imgs = story?.images?.length
        ? story.images
        : [{ image_url: '/images/scene 1.png', title: 'Fishermen at dawn in Diu', media_type: 'image' }];
      setImages(imgs);
    }).catch(() => {
      setImages([{ image_url: '/images/scene 1.png', title: 'Fishermen at dawn in Diu', media_type: 'image' }]);
    }).finally(() => setLoading(false));
  }, []);

  // Auto-advance the hero slideshow every 4.2s.
  useEffect(() => {
    if (images.length < 2) return undefined;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % images.length), 4200);
    return () => clearInterval(timerRef.current);
  }, [images.length]);

  const go = (dir) => setIndex((i) => (i + dir + images.length) % images.length);
  const active = images[index];

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
        ) : (
          <>
            {/* Hero slideshow — cross-fades the same images from the landing story banner. */}
            <div className="our-story-hero">
              {images.map((img, i) => (
                img.media_type === 'video' ? (
                  <video
                    key={img.id ?? i}
                    src={img.image_url}
                    className={`our-story-hero__slide${i === index ? ' is-active' : ''}`}
                    muted playsInline autoPlay loop
                  />
                ) : (
                  <img
                    key={img.id ?? i}
                    src={img.image_url}
                    alt={img.title || `Chhatak story frame ${i + 1}`}
                    className={`our-story-hero__slide${i === index ? ' is-active' : ''}`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                )
              ))}

              {images.length > 1 && (
                <>
                  <button type="button" className="our-story-hero__arrow our-story-hero__arrow--prev" onClick={() => go(-1)} aria-label="Previous">‹</button>
                  <button type="button" className="our-story-hero__arrow our-story-hero__arrow--next" onClick={() => go(1)} aria-label="Next">›</button>
                  <div className="our-story-hero__dots" role="tablist">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`our-story-hero__dot${i === index ? ' is-active' : ''}`}
                        onClick={() => setIndex(i)}
                        aria-label={`Go to image ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {active?.title && (
              <p className="our-story-caption">{active.title}</p>
            )}

            {/* Also expose every frame as a static gallery so viewers can scroll through them. */}
            {images.length > 1 && (
              <div className="our-story-grid">
                {images.map((img, i) => (
                  <button
                    type="button"
                    key={img.id ?? `grid-${i}`}
                    className={`our-story-grid__tile${i === index ? ' is-active' : ''}`}
                    onClick={() => setIndex(i)}
                    aria-label={`Focus image ${i + 1}`}
                  >
                    {img.media_type === 'video' ? (
                      <video src={img.image_url} muted playsInline preload="metadata" />
                    ) : (
                      <img src={img.image_url} alt={img.title || ''} loading="lazy" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div className="our-story-cta">
          <Link to="/products" className="v2-btn v2-btn--primary">SHOP THE RANGE</Link>
          <Link to="/" className="v2-btn v2-btn--outline">BACK HOME</Link>
        </div>
      </div>
    </div>
  );
}
