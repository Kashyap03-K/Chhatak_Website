import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

const ReelsWall = lazy(() => import('../components/ReelsWall.jsx'));
const ReviewsWall = lazy(() => import('../components/ReviewsWall.jsx'));

// ==== Inline SVG doodles (hand-drawn feel, original) ====
const WaveDoodle = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 220 40" fill="none" aria-hidden="true">
    <path d="M2 22 Q 25 6, 48 22 T 96 22 T 144 22 T 192 22 T 218 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M8 32 Q 32 20, 56 32 T 108 32 T 160 32 T 210 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
  </svg>
);
const SunDoodle = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <circle cx="30" cy="30" r="10" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
      const rad = (a * Math.PI) / 180;
      return (
        <line key={a}
          x1={30 + Math.cos(rad) * 16} y1={30 + Math.sin(rad) * 16}
          x2={30 + Math.cos(rad) * 24} y2={30 + Math.sin(rad) * 24}
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      );
    })}
  </svg>
);
const PalmDoodle = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 80 90" fill="none" aria-hidden="true">
    <path d="M40 88 Q 42 60 40 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M40 30 Q 20 20 6 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M40 30 Q 60 20 74 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M40 30 Q 30 12 18 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M40 30 Q 50 12 62 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M40 30 Q 40 10 40 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
);
const BoatDoodle = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 120 90" fill="none" aria-hidden="true">
    <path d="M10 62 L 110 62 L 96 78 L 24 78 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    <path d="M60 62 L 60 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M60 22 L 60 55 L 100 55 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    <path d="M0 84 Q 15 78 30 84 T 60 84 T 90 84 T 120 84" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
  </svg>
);
const SparkDoodle = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path d="M20 4 L 20 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M4 20 L 14 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M26 20 L 36 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M20 26 L 20 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M8 8 L 14 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M26 26 L 32 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);
const BrushArrowDoodle = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 80 30" fill="none" aria-hidden="true">
    <path d="M4 15 Q 30 4, 60 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M50 8 L 62 15 L 50 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);
const StarburstDoodle = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 60 60" fill="none" aria-hidden="true">
    {[0, 30, 60, 90, 120, 150].map((a) => {
      const rad = (a * Math.PI) / 180;
      return (
        <line key={a}
          x1={30 - Math.cos(rad) * 8} y1={30 - Math.sin(rad) * 8}
          x2={30 + Math.cos(rad) * 26} y2={30 + Math.sin(rad) * 26}
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      );
    })}
  </svg>
);
const SwirlDoodle = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <path d="M30 8 Q 46 12, 46 30 Q 46 46, 30 46 Q 18 46, 18 34 Q 18 24, 28 24 Q 34 24, 34 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
);
const DotClusterDoodle = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="8" cy="12" r="2" fill="currentColor"/>
    <circle cx="18" cy="6" r="2" fill="currentColor"/>
    <circle cx="26" cy="16" r="2" fill="currentColor"/>
    <circle cx="14" cy="22" r="2" fill="currentColor"/>
    <circle cx="30" cy="28" r="2" fill="currentColor"/>
    <circle cx="8" cy="30" r="2" fill="currentColor"/>
  </svg>
);

// ==== Feature strip icons ====
const IconFish = () => (
  <svg viewBox="0 0 40 40" fill="none" width="34" height="34">
    <path d="M4 20 Q 12 8, 26 20 Q 12 32, 4 20 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <path d="M26 20 L 36 12 L 34 20 L 36 28 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <circle cx="10" cy="19" r="1.2" fill="currentColor"/>
  </svg>
);
const IconProtein = () => (
  <svg viewBox="0 0 40 40" fill="none" width="34" height="34">
    <path d="M20 4 L 20 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 12 L 28 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 28 L 28 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="6" y="15" width="6" height="10" rx="1.5" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="28" y="15" width="6" height="10" rx="1.5" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);
const IconFlame = () => (
  <svg viewBox="0 0 40 40" fill="none" width="34" height="34">
    <path d="M20 4 Q 12 14 14 24 Q 15 32 20 36 Q 25 32 26 24 Q 28 14 20 4 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <path d="M20 18 Q 17 22 18 27 Q 19 30 20 32 Q 21 30 22 27 Q 23 22 20 18 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
  </svg>
);
const IconLeaf = () => (
  <svg viewBox="0 0 40 40" fill="none" width="34" height="34">
    <path d="M8 32 Q 8 12 32 8 Q 30 28 12 32 Q 16 22 26 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);
const IconPin = () => (
  <svg viewBox="0 0 40 40" fill="none" width="34" height="34">
    <path d="M20 4 Q 30 4 30 15 Q 30 24 20 36 Q 10 24 10 15 Q 10 4 20 4 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <circle cx="20" cy="15" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);
const IconWaves = () => (
  <svg viewBox="0 0 40 40" fill="none" width="34" height="34">
    <path d="M4 14 Q 10 8 16 14 T 28 14 T 40 14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M4 22 Q 10 16 16 22 T 28 22 T 40 22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M4 30 Q 10 24 16 30 T 28 30 T 40 30" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
);
const IconFlask = () => (
  <svg viewBox="0 0 40 40" fill="none" width="34" height="34">
    <path d="M15 4 L 25 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M17 4 L 17 16 L 8 32 Q 6 36 12 36 L 28 36 Q 34 36 32 32 L 23 16 L 23 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <circle cx="18" cy="28" r="1.5" fill="currentColor"/>
    <circle cx="23" cy="30" r="1.5" fill="currentColor"/>
  </svg>
);

const FEATURES = [
  { icon: <IconFish />,    title: 'WILD CAUGHT',    body: "From the clean waters of India's coast" },
  { icon: <IconProtein />, title: 'HIGH PROTEIN',   body: '48g+ protein per 100g' },
  { icon: <IconFlame />,   title: 'READY TO EAT',   body: 'Open & enjoy anytime, anywhere' },
  { icon: <IconLeaf />,    title: 'NO PRESERVATIVES', body: 'Real ingredients. Nothing artificial.' },
  { icon: <IconPin />,     title: 'MADE IN DIU',    body: 'Proudly crafted on the shores of Diu' },
];

const USE_CASE_DEFAULTS = [
  { title: 'With Drinks',   body: 'The ultimate bar companion.',   accent: '#123A5C' },
  { title: 'With Meals',    body: 'Add a crunchy coastal twist.',  accent: '#0E7C6E' },
  { title: 'During Travel', body: 'Light, tasty & easy to carry.', accent: '#E9A93B' },
  { title: 'Movie Nights',  body: 'Crunch that steals the show.',  accent: '#E5763A' },
];

const WHY = [
  { icon: <IconProtein />, top: 'High Protein', bot: 'Power Snack' },
  { icon: <IconWaves />,   top: 'Crispy Texture', bot: 'Non-Greasy' },
  { icon: <IconLeaf />,    top: 'Real Ingredients', bot: 'Real Taste' },
  { icon: <IconFlask />,   top: 'No Artificial Colours', bot: 'No Preservatives' },
];

// ==== Section components ====

function Hero({ section }) {
  const imgs = section?.images || [];
  const packUrl = imgs[0]?.image_url || '/images/packaging-real.JPG';
  const bowlUrl = imgs[1]?.image_url || '/images/bowl.JPG';
  const coastUrl = imgs[2]?.image_url || '/images/scene 1.png';
  const packAlt = imgs[0]?.title || 'Indian Classic';
  return (
    <section className="v2-hero">
      <div className="v2-container">
        <div className="v2-hero-grid">
          <div className="v2-hero-copy">
            <h1 className="v2-hero-title">
              FROM COAST
              <br />
              TO <span className="accent">CRUNCH!</span>
            </h1>
            <p className="v2-hero-lede">
              Premium dried Bombil fish snack made with coastal tradition and bold Indian flavours.
            </p>
            <div className="v2-hero-ctas">
              <Link to="/#products" className="v2-btn v2-btn--primary">SHOP NOW</Link>
              <Link to="/#products" className="v2-btn v2-btn--ghost">EXPLORE FLAVOURS</Link>
            </div>
            <WaveDoodle className="v2-hero-waves" />
          </div>
          <div className="v2-hero-visual">
            <div className="v2-hero-blob" aria-hidden="true" />
            <StarburstDoodle className="v2-doodle v2-doodle--burst" />
            <SunDoodle className="v2-doodle v2-doodle--sun" />
            <PalmDoodle className="v2-doodle v2-doodle--palm" />
            <SwirlDoodle className="v2-doodle v2-doodle--swirl" />
            <SparkDoodle className="v2-doodle v2-doodle--spark1" />
            <SparkDoodle className="v2-doodle v2-doodle--spark2" />
            <DotClusterDoodle className="v2-doodle v2-doodle--dots" />
            <BoatDoodle className="v2-doodle v2-doodle--boat" />

            {/* Story stickers — small photo peeks behind the pouch */}
            <div className="v2-hero-sticker v2-hero-sticker--coast" aria-hidden="true">
              <img src={coastUrl} alt="" loading="lazy" />
            </div>
            <div className="v2-hero-sticker v2-hero-sticker--bowl" aria-hidden="true">
              <img src={bowlUrl} alt="" loading="lazy" />
            </div>

            {/* Hero pack — the star */}
            <img src={packUrl} alt={packAlt} className="v2-hero-pack" />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureStrip() {
  return (
    <section className="v2-feature-strip">
      <div className="v2-container">
        <div className="v2-feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="v2-feature-item">
              <div className="v2-feature-icon">{f.icon}</div>
              <div>
                <p className="v2-feature-title">{f.title}</p>
                <p className="v2-feature-body">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StoryBanner({ section }) {
  const images = section?.images?.length
    ? section.images
    : [{ image_url: '/images/scene 1.png', title: 'Fishermen at dawn in Diu', media_type: 'image' }];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2) return undefined;
    const t = setInterval(() => setActive((i) => (i + 1) % images.length), 4200);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <section id="story" className="v2-story">
      <div className="v2-container">
        <div className="v2-story-card">
          <div className="v2-story-media">
            {images.map((img, i) => {
              const isVideo = img.media_type === 'video';
              return isVideo ? (
                <video
                  key={img.id ?? i}
                  src={img.image_url}
                  className={`v2-story-slide${i === active ? ' is-active' : ''}`}
                  controls playsInline preload="metadata"
                />
              ) : (
                <img
                  key={img.id ?? i}
                  src={img.image_url}
                  alt={img.title || 'Chhatak story'}
                  className={`v2-story-slide${i === active ? ' is-active' : ''}`}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              );
            })}
            {images.length > 1 && (
              <div className="v2-story-dots" role="tablist" aria-label="Story images">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`v2-story-dot${i === active ? ' is-active' : ''}`}
                    aria-label={`Show image ${i + 1}`}
                    aria-selected={i === active}
                    onClick={() => setActive(i)}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="v2-story-copy">
            <p className="v2-story-kicker">OUR STORY</p>
            <h2 className="v2-story-title">
              Born on the coast.
              <br />
              Made for everyone.
            </h2>
            <p className="v2-story-body">
              From the fishermen's daily catch to your hands, Chhatak brings you the authentic
              taste of Bombil with a crunchy twist. A snack that fits every mood, every meal
              and every moment.
            </p>
            <Link to="/#story" className="v2-btn v2-btn--dark">READ OUR STORY</Link>
          </div>
          <BoatDoodle className="v2-story-boat" />
        </div>
      </div>
    </section>
  );
}

function Flavours({ products }) {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState(null);
  const trackRef = useRef(null);
  const isSlider = products.length > 4;

  const handleAdd = async (id) => {
    if (!isAuthenticated) { window.location.href = '/login'; return; }
    setAddingId(id);
    try { await addToCart(id); }
    catch (err) { alert(err.response?.data?.detail || 'Failed to add to cart'); }
    finally { setAddingId(null); }
  };

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.v2-flavour-card');
    const step = card ? card.getBoundingClientRect().width + 24 : 320;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section id="products" className="v2-flavours">
      <div className="v2-container">
        <div className="v2-section-head">
          <div>
            <p className="v2-kicker accent">OUR FLAVOURS</p>
            <h2 className="v2-section-title">Bold flavours. <span className="ink">Coastal soul.</span></h2>
          </div>
          <Link to="/products" className="v2-view-all">
            VIEW ALL PRODUCTS
            <BrushArrowDoodle className="v2-arrow" />
          </Link>
        </div>

        {isSlider ? (
          <div className="v2-flavour-slider">
            <button type="button" className="v2-flavour-arrow prev" onClick={() => scroll(-1)} aria-label="Previous products">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <div className="v2-flavour-track" ref={trackRef}>
              {products.map((p) => (
                <FlavourCard key={p.id} p={p} addingId={addingId} onAdd={handleAdd} />
              ))}
            </div>
            <button type="button" className="v2-flavour-arrow next" onClick={() => scroll(1)} aria-label="Next products">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
        ) : (
          <div className="v2-flavour-grid">
            {products.slice(0, 4).map((p) => (
              <FlavourCard key={p.id} p={p} addingId={addingId} onAdd={handleAdd} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FlavourCard({ p, addingId, onAdd }) {
  return (
    <article className="v2-flavour-card">
      <Link to={`/products/${p.slug}`} className="v2-flavour-image" aria-label={`View ${p.name}`}>
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} />
        ) : (
          <span className="v2-flavour-badge">{p.flavor || p.name}</span>
        )}
      </Link>
      <Link to={`/products/${p.slug}`} className="v2-flavour-name-link">
        <h3 className="v2-flavour-name">{p.name}</h3>
      </Link>
      <div className="v2-flavour-price">₹{p.price}</div>
      <button
        type="button"
        className="v2-add-btn"
        onClick={() => onAdd(p.id)}
        disabled={addingId === p.id || p.stock === 0}
      >
        {p.stock === 0 ? 'Out of stock' : addingId === p.id ? 'Adding…' : 'Add to cart'}
      </button>
    </article>
  );
}

function PerfectWith({ section }) {
  const imgs = section?.images || [];
  const tiles = USE_CASE_DEFAULTS.map((defaults, i) => ({
    ...defaults,
    title: imgs[i]?.title || defaults.title,
    body:  imgs[i]?.body  || defaults.body,
    img:   imgs[i]?.image_url || '/images/bowl.JPG',
  }));
  return (
    <section className="v2-perfect">
      <div className="v2-container">
        <p className="v2-kicker accent v2-perfect-kicker">PERFECT WITH</p>
        <h2 className="v2-perfect-title">Built For Every Kind Of Craving</h2>
        <div className="v2-perfect-list">
          {tiles.map((u) => (
            <div key={u.title} className="v2-perfect-row">
              <div className="v2-perfect-media">
                <img src={u.img} alt="" />
              </div>
              <div className="v2-perfect-body">
                <h3>{u.title}</h3>
                <p>{u.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChhatak() {
  return (
    <section className="v2-why">
      <div className="v2-container">
        <div className="v2-why-bar">
          <div className="v2-why-headline">
            <p className="v2-kicker sun">WHY CHHATAK?</p>
            <h2>Not just a snack.<br/>It's a coastal experience.</h2>
            <SunDoodle className="v2-why-sun" />
          </div>
          <div className="v2-why-list">
            {WHY.map((w) => (
              <div key={w.top} className="v2-why-item">
                <div className="v2-why-icon">{w.icon}</div>
                <p className="v2-why-top">{w.top}</p>
                <p className="v2-why-bot">{w.bot}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Gallery({ section }) {
  const fallback = [
    '/images/scene 5.png', '/images/bowl.JPG', '/images/scene 3.png',
    '/images/scene 8.png', '/images/scene 4.png', '/images/fort.png',
    '/images/packaging-real.JPG',
  ];
  const items = section?.images?.length
    ? section.images.map((img) => ({ src: img.image_url, media_type: img.media_type || 'image' }))
    : fallback.map((src) => ({ src, media_type: 'image' }));
  return (
    <section className="v2-gallery">
      <div className="v2-container">
        <p className="v2-kicker accent">FOLLOW OUR JOURNEY</p>
        <p className="v2-handle">@chhatak.crunch</p>
        <div className="v2-gallery-strip">
          {items.map((it, i) => (
            <a key={i} href="https://instagram.com/chhatak.co" target="_blank" rel="noopener" className="v2-gallery-tile">
              {it.media_type === 'video' ? (
                <video src={it.src} controls playsInline preload="metadata" />
              ) : (
                <img src={it.src} alt="" loading="lazy" />
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="v2-footer">
      <div className="v2-container">
        <div className="v2-footer-grid">
          <div className="v2-footer-brand">
            <img src="/images/chhatak-logo.png" alt="Chhatak" className="v2-footer-logo" />
            <p>Premium dried Bombil fish snack made in Diu, for the world.</p>
            <div className="v2-footer-social">
              <a href="https://instagram.com/chhatak.co" target="_blank" rel="noopener" aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="#" aria-label="Facebook">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 21v-7h2.4l.4-3h-2.8V9c0-.87.24-1.46 1.5-1.46H16.5V4.9c-.26-.03-1.15-.11-2.19-.11-2.17 0-3.66 1.32-3.66 3.75V11H8v3h2.65v7h2.85z" />
                </svg>
              </a>
              <a href="#" aria-label="YouTube">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                  <path d="M21.6 7.2a2.5 2.5 0 0 0-1.75-1.77C18.28 5 12 5 12 5s-6.28 0-7.85.43A2.5 2.5 0 0 0 2.4 7.2 26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.75 1.77C5.72 19 12 19 12 19s6.28 0 7.85-.43a2.5 2.5 0 0 0 1.75-1.77A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.4-4.8zM10 15V9l5.2 3z" />
                </svg>
              </a>
              <a href="#" aria-label="X">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M17.3 3H20l-6.3 7.2L21.5 21h-6.4l-4.5-6-5.2 6H2.7l6.7-7.7L2.2 3h6.6l4.1 5.5L17.3 3zm-1.1 16h1.7L7.9 5H6.1l10.1 14z" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                  <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21h-4z" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <p className="v2-footer-h">SHOP</p>
            <Link to="/#products">All Products</Link>
            <Link to="/#products">Indian Classic</Link>
            <Link to="/#products">Garlic Lemon</Link>
            <Link to="/#products">Magic Masala</Link>
            <Link to="/#products">Peri Peri Tomato</Link>
          </div>
          <div>
            <p className="v2-footer-h">COMPANY</p>
            <Link to="/#story">About Us</Link>
            <Link to="/#story">Our Story</Link>
            <a href="#">Blog</a>
            <a href="#">Contact Us</a>
            <a href="#">FAQ</a>
          </div>
          <div>
            <p className="v2-footer-h">HELP</p>
            <a href="#">Shipping & Delivery</a>
            <a href="#">Returns & Refunds</a>
            <a href="#">Terms & Conditions</a>
            <a href="#">Privacy Policy</a>
          </div>
          <div>
            <p className="v2-footer-h">STAY IN THE LOOP</p>
            <p className="v2-footer-note">Get updates on new flavours, offers & coastal stories.</p>
            <form className="v2-newsletter" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" />
              <button type="submit">SUBSCRIBE</button>
            </form>
          </div>
        </div>
        <div className="v2-footer-bar">
          <p>© {new Date().getFullYear()} Chhatak | The Coastal Crunch. All Rights Reserved.</p>
          <p>Made with ♥ in Diu</p>
        </div>
      </div>
    </footer>
  );
}

function HeroVideo({ src, defaultSoundOn = false }) {
  const ref = useRef(null);
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    if (!defaultSoundOn) return;
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    v.play().then(() => setMuted(false)).catch(() => {
      v.muted = true;
      setMuted(true);
    });
  }, [defaultSoundOn, src]);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) v.play().catch(() => {});
  };
  return (
    <>
      <video
        ref={ref}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        controlsList="nodownload noplaybackrate nofullscreen"
      />
      <button
        type="button"
        className="v2-hero-mute"
        onClick={toggle}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
      >
        {muted ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
        )}
      </button>
    </>
  );
}

// Custom gallery block for admin-created gallery sections.
// One image → full-bleed hero banner. Many images → responsive grid.
function CustomGallery({ section }) {
  if (!section.images?.length) return null;
  const single = section.images.length === 1;

  if (single) {
    const img = section.images[0];
    return (
      <section className={`v2-custom-hero${section.full_viewport ? ' is-fullscreen' : ''}${img.media_type === 'video' ? ' is-video' : ''}`} id={`gallery-${section.id}`}>
        {img.media_type === 'video' ? (
          <HeroVideo src={img.image_url} defaultSoundOn={!!img.sound_on} />
        ) : (
          <img src={img.image_url} alt={img.title || section.title || ''} loading="lazy" />
        )}
        {(section.title || section.subtitle || img.title || img.body) && (
          <div className="v2-custom-hero-overlay">
            <div className="v2-container">
              {section.title && <p className="v2-kicker accent">{section.title.toUpperCase()}</p>}
              {section.subtitle && <h2 className="v2-custom-hero-title">{section.subtitle}</h2>}
              {img.body && <p className="v2-custom-hero-body">{img.body}</p>}
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="v2-custom-gallery" id={`gallery-${section.id}`}>
      <div className="v2-container">
        {section.title && <p className="v2-kicker accent">{section.title.toUpperCase()}</p>}
        {section.subtitle && <h2 className="v2-section-title">{section.subtitle}</h2>}
        <div className="v2-custom-gallery-grid">
          {section.images.map((img) => (
            <figure key={img.id} className="v2-custom-gallery-tile">
              {img.media_type === 'video' ? (
                <video src={img.image_url} controls playsInline preload="metadata" />
              ) : (
                <img src={img.image_url} alt={img.title || section.title || ''} loading="lazy" />
              )}
              {(img.title || img.body) && (
                <figcaption>
                  {img.title && <strong>{img.title}</strong>}
                  {img.body && <p>{img.body}</p>}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==== Section registry ====
const RENDERERS = {
  hero:           (s, ctx) => <Hero key={s.id} section={s} />,
  features:       (s)      => <FeatureStrip key={s.id} />,
  story:          (s)      => <StoryBanner key={s.id} section={s} />,
  flavours:       (s, ctx) => <Flavours key={s.id} products={ctx.products} />,
  'perfect-with': (s)      => <PerfectWith key={s.id} section={s} />,
  why:            (s)      => <WhyChhatak key={s.id} />,
  reels:          (s)      => (
    <Suspense key={s.id} fallback={null}>
      <div id="reels" className="v2-reels-wrap"><ReelsWall /></div>
    </Suspense>
  ),
  reviews:        (s)      => (
    <Suspense key={s.id} fallback={null}>
      <div id="reviews" className="v2-reviews-wrap"><ReviewsWall /></div>
    </Suspense>
  ),
  gallery:        (s)      => <Gallery key={s.id} section={s} />,
  footer:         (s)      => <Footer key={s.id} />,
};

function renderSection(section, ctx) {
  // Admin-created gallery sections (kind === "gallery", keys like "gallery-1")
  if (section.kind === 'gallery') return <CustomGallery key={section.id} section={section} />;
  const r = RENDERERS[section.key];
  return r ? r(section, ctx) : null;
}

const DEFAULT_ORDER = ['hero', 'features', 'story', 'flavours', 'perfect-with', 'why', 'reels', 'reviews', 'gallery', 'footer'];

export default function LandingPage() {
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState(null);
  const location = useLocation();

  useEffect(() => {
    Promise.all([
      api.get('/products/').then((r) => r.data).catch(() => []),
      api.get('/landing/sections').then((r) => r.data).catch(() => []),
    ]).then(([prods, secs]) => {
      setProducts(prods.filter((p) => p.is_active));
      setSections(secs);
    });
  }, []);

  // Scroll to hash target when landing page opens or the hash changes.
  useEffect(() => {
    if (!location.hash || sections === null) return;
    const id = location.hash.slice(1);
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => clearTimeout(t);
  }, [location.hash, sections]);

  // Build ordered render list — respecting admin order + visibility.
  // Include: built-in sections we know how to render, PLUS any custom gallery.
  const list =
    sections && sections.length > 0
      ? sections.filter((s) => s.kind === 'gallery' || RENDERERS[s.key])
      : DEFAULT_ORDER.map((key, i) => ({ id: `d-${i}`, key, kind: 'builtin', is_active: true, images: [] }));

  const ctx = { products };

  return (
    <div className="v2">
      {list.map((s) => renderSection(s, ctx))}
    </div>
  );
}
