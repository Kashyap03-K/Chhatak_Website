import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import {
  LighthouseIllustration,
  CompassRose,
  SeagullFlock,
  WaveDivider,
  WaveDividerLine,
} from '../components/CoastalIllustrations.jsx';

// Reusable wave divider that lives at the bottom of a section and
// visually flows into the next section's background.
function SectionWave({ color = '#E4CFA6' }) {
  return (
    <WaveDivider className="v2-section-wave" style={{ color }} />
  );
}

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
  const mainImg = imgs[0];
  const bowlImg = imgs[1];
  return (
    <section className="v2-hero v2-hero--coast">
      {/* Background editorial layers — seagulls on the left */}
      <SeagullFlock className="v2-hero-birds" />

      <div className="v2-container">
        <div className="v2-hero-grid">
          <div className="v2-hero-copy">
            <p className="v2-hero-eyebrow">
              <span>EST · 1961</span>
              <span className="v2-hero-eyebrow-dot" />
              <span>DIU · ARABIAN SEA</span>
            </p>
            <h1 className="v2-hero-title">
              FROM COAST
              <br />
              TO <em>CRUNCH</em>
            </h1>
            <WaveDividerLine className="v2-hero-wave-line" />
            <p className="v2-hero-lede">
              Premium dried Bombil fish snack made with
              <br />
              coastal tradition and bold Indian flavours.
            </p>
            <div className="v2-hero-ctas">
              <Link to="/products" className="v2-btn v2-btn--primary">SHOP THE RANGE</Link>
              <Link to="/our-story" className="v2-btn v2-btn--outline">Read Our Story</Link>
            </div>
          </div>

          <div className="v2-hero-photo-wrap">
            <figure className="v2-hero-photo">
              {mainImg?.image_url ? (
                <img src={mainImg.image_url} alt={mainImg.title || ''} />
              ) : (
                <div className="v2-hero-slot-empty">Main photo</div>
              )}
            </figure>
          </div>
        </div>
      </div>

      {/* Tall-ship sketch — anchored on the left, alongside the seagulls */}
      <img className="v2-hero-fleet" src="/images/tall-ship.png" alt="" aria-hidden="true" />

      {/* Editorial wave divider transitioning into the next section */}
      <WaveDivider className="v2-hero-wave-bottom" />
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
      <SectionWave color="#FBF3E1" />
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
    const t = setInterval(() => setActive((i) => (i + 1) % images.length), 3000);
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
                  controls playsInline preload="auto"
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
            <Link to="/our-story" className="v2-btn v2-btn--dark">READ OUR STORY</Link>
          </div>
          <BoatDoodle className="v2-story-boat" />
        </div>
      </div>
      <SectionWave color="#FBF3E1" />
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
      <SectionWave color="#E4CFA6" />
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
    img: imgs[i]?.image_url || '/images/bowl.JPG',
  }));
  return (
    <section className="v2-perfect">
      <div className="v2-container">
        <p className="v2-kicker accent v2-perfect-kicker">PERFECT WITH</p>
        <h2 className="v2-perfect-title">Built For Every Kind Of Craving</h2>
        <div className="v2-perfect-grid">
          {tiles.map((u, i) => (
            <figure key={i} className="v2-perfect-card">
              <img src={u.img} alt="" loading="lazy" />
            </figure>
          ))}
        </div>
      </div>
      <SectionWave color="#14213D" />
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
      <SectionWave color="#FBF3E1" />
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
    <section className="v2-gallery v2-gallery--journey" id="journey">
      <div className="v2-container">
        <p className="v2-kicker accent">FOLLOW OUR JOURNEY</p>
        <p className="v2-handle">
          <a href="https://instagram.com/chhatak.co" target="_blank" rel="noopener">@chhatak.crunch</a>
        </p>
      </div>
      <JourneyStrip items={items} />
      <SectionWave color="#14213D" />
    </section>
  );
}

function JourneyVideoTile({ src }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const play = () => {
    const v = ref.current;
    if (!v) return;
    // Preserve whatever mute state the viewer chose; browsers allow autoplay
    // only for muted media, so the very first hover always starts muted.
    v.muted = muted;
    const p = v.play();
    if (p && p.catch) p.catch(() => {
      // If unmuted playback was blocked, fall back to muted so at least the
      // frame moves.
      if (!v.muted) { v.muted = true; setMuted(true); v.play().catch(() => {}); }
    });
    setPlaying(true);
  };
  const pause = () => {
    const v = ref.current;
    if (!v) return;
    v.pause();
    try { v.currentTime = 0; } catch {} // rewind for a clean thumbnail
    setPlaying(false);
  };
  const toggleSound = (e) => {
    // Sound toggle sits inside the Instagram <a> — stop the link from firing.
    e.preventDefault();
    e.stopPropagation();
    const v = ref.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
    // A user gesture just fired; unmuting is now safe. Start playing if
    // the pointer already left the tile — the viewer clearly wants audio.
    if (!next) {
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <div
      className="v2-journey-video"
      onMouseEnter={play}
      onMouseLeave={pause}
      onFocus={play}
      onBlur={pause}
    >
      <video ref={ref} src={src} muted={muted} playsInline loop preload="metadata" />
      {!playing && (
        <span className="v2-journey-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        </span>
      )}
      <button
        type="button"
        className="v2-journey-sound"
        onClick={toggleSound}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        title={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
        )}
      </button>
    </div>
  );
}

function JourneyStrip({ items }) {
  const trackRef = useRef(null);
  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.v2-journey-tile');
    const step = card ? card.getBoundingClientRect().width + 16 : 300;
    el.scrollBy({ left: dir * step * 2 });
  };
  return (
    <div className="v2-journey-strip-wrap">
      <button type="button" className="v2-journey-arrow v2-journey-arrow--prev" onClick={() => scroll(-1)} aria-label="Scroll previous">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <div className="v2-journey-strip" ref={trackRef}>
        {items.map((it, i) => (
          <a key={i} href="https://instagram.com/chhatak.co" target="_blank" rel="noopener" className="v2-journey-tile">
            {it.media_type === 'video' ? (
              <JourneyVideoTile src={it.src} />
            ) : (
              <img src={it.src} alt="" loading="lazy" />
            )}
          </a>
        ))}
      </div>
      <button type="button" className="v2-journey-arrow v2-journey-arrow--next" onClick={() => scroll(1)} aria-label="Scroll next">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>
  );
}

function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | ok | error
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus('sending');
    setMessage('');
    try {
      await api.post('/newsletter/subscribe', { email: trimmed });
      setStatus('ok');
      setMessage('Thanks — you\'re on the list.');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || 'Could not subscribe. Please try again.');
    }
  };

  // Customer review submission — lands in /admin/reviews as inactive until approved.
  const [rvName, setRvName] = useState('');
  const [rvLoc, setRvLoc] = useState('');
  const [rvRating, setRvRating] = useState(5);
  const [rvQuote, setRvQuote] = useState('');
  const [rvStatus, setRvStatus] = useState('idle');
  const [rvMsg, setRvMsg] = useState('');

  const submitReview = async (e) => {
    e.preventDefault();
    const name = rvName.trim();
    const quote = rvQuote.trim();
    if (!name || quote.length < 4) return;
    setRvStatus('sending');
    setRvMsg('');
    try {
      await api.post('/reviews/submit', {
        author: name,
        location: rvLoc.trim() || null,
        rating: rvRating,
        quote,
      });
      setRvStatus('ok');
      setRvMsg('Thanks — your review is with our team for a quick check before it goes live.');
      setRvName(''); setRvLoc(''); setRvQuote(''); setRvRating(5);
    } catch (err) {
      setRvStatus('error');
      const detail = err.response?.data?.detail;
      setRvMsg(Array.isArray(detail) ? detail[0]?.msg : (detail || 'Could not submit. Please try again.'));
    }
  };

  return (
    <footer className="v2-footer">
      <div className="v2-container">
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
            <a href="https://facebook.com/chhatak.co" target="_blank" rel="noopener" aria-label="Facebook">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M13.5 21v-7h2.4l.4-3h-2.8V9c0-.87.24-1.46 1.5-1.46H16.5V4.9c-.26-.03-1.15-.11-2.19-.11-2.17 0-3.66 1.32-3.66 3.75V11H8v3h2.65v7h2.85z" />
              </svg>
            </a>
            <a href="https://youtube.com/@chhatak.co" target="_blank" rel="noopener" aria-label="YouTube">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                <path d="M21.6 7.2a2.5 2.5 0 0 0-1.75-1.77C18.28 5 12 5 12 5s-6.28 0-7.85.43A2.5 2.5 0 0 0 2.4 7.2 26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.75 1.77C5.72 19 12 19 12 19s6.28 0 7.85-.43a2.5 2.5 0 0 0 1.75-1.77A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.4-4.8zM10 15V9l5.2 3z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="v2-footer-grid">
          <div>
            <p className="v2-footer-h">SHOP</p>
            <Link to="/products">All Products</Link>
            <Link to="/wholesale">Wholesale</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/wishlist">Wishlist</Link>
            <Link to="/orders">My Orders</Link>
          </div>
          <div>
            <p className="v2-footer-h">EXPLORE</p>
            <Link to="/#story">About</Link>
            <Link to="/#reviews">Reviews</Link>
            <Link to="/#journey">Journey</Link>
          </div>
          <div>
            <p className="v2-footer-h">STAY IN THE LOOP</p>
            <p className="v2-footer-note">Get updates on new flavours & coastal stories.</p>
            <form className="v2-newsletter" onSubmit={submit}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={status === 'sending'}
              />
              <button type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? '…' : 'SUBSCRIBE'}
              </button>
            </form>
            {message && (
              <p className={`v2-newsletter-msg ${status === 'ok' ? 'ok' : status === 'error' ? 'err' : ''}`}>
                {message}
              </p>
            )}
          </div>

          <div>
            <p className="v2-footer-h">SHARE YOUR REVIEW</p>
            <p className="v2-footer-note">Tell us what you loved — it may show up on our reviews wall.</p>
            <form className="v2-footer-review" onSubmit={submitReview}>
              <div className="v2-footer-review-row">
                <input
                  type="text"
                  required
                  value={rvName}
                  onChange={(e) => setRvName(e.target.value)}
                  placeholder="Your name"
                  maxLength={120}
                  disabled={rvStatus === 'sending'}
                />
                <input
                  type="text"
                  value={rvLoc}
                  onChange={(e) => setRvLoc(e.target.value)}
                  placeholder="City (optional)"
                  maxLength={120}
                  disabled={rvStatus === 'sending'}
                />
              </div>
              <div className="v2-footer-review-rating" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={`v2-star${n <= rvRating ? ' is-on' : ''}`}
                    onClick={() => setRvRating(n)}
                    aria-checked={n === rvRating}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                    role="radio"
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                required
                rows={3}
                value={rvQuote}
                onChange={(e) => setRvQuote(e.target.value)}
                placeholder="What did you think?"
                maxLength={1000}
                minLength={4}
                disabled={rvStatus === 'sending'}
              />
              <button type="submit" disabled={rvStatus === 'sending'} className="v2-footer-review-submit">
                {rvStatus === 'sending' ? 'SENDING…' : 'SUBMIT REVIEW'}
              </button>
            </form>
            {rvMsg && (
              <p className={`v2-newsletter-msg ${rvStatus === 'ok' ? 'ok' : rvStatus === 'error' ? 'err' : ''}`}>
                {rvMsg}
              </p>
            )}
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
        preload="auto"
        controlsList="nodownload"
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

// Reusable slideshow for a list of media (images + videos) with next/prev arrows.
// One item → renders it plain (no arrows). 2+ items → slideshow.
function MediaSlideshow({ items, aspect = 'auto', className = '', renderCaption, autoAdvanceMs = 3000 }) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef(null);

  // Mobile browsers (iOS Safari especially) don't always honor the autoplay
  // attribute even with muted+playsInline — nudge them by calling .play()
  // once the element is mounted and again whenever the active slide changes.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }, [index, muted]);

  // Auto-advance every autoAdvanceMs (default 3s). Pauses on hover / while the
  // user is interacting via arrows or dots.
  useEffect(() => {
    if (!items || items.length < 2 || paused || !autoAdvanceMs) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), autoAdvanceMs);
    return () => clearInterval(t);
  }, [items, paused, autoAdvanceMs]);

  if (!items?.length) return null;
  const count = items.length;
  const clamp = (n) => (n + count) % count;
  const go = (dir) => setIndex((i) => clamp(i + dir));
  const current = items[index];

  const frameClass =
    aspect === 'reel' ? 'v2-slide-frame v2-slide-frame--reel'
    : aspect === 'post' ? 'v2-slide-frame v2-slide-frame--post'
    : 'v2-slide-frame';

  const toggleMute = () => {
    const v = videoRef.current;
    const next = !muted;
    if (v) {
      v.muted = next;
      if (!next) v.play().catch(() => {});
    }
    setMuted(next);
  };

  const renderMedia = (it) =>
    it.media_type === 'video' ? (
      <>
        <video ref={videoRef} src={it.src} autoPlay muted={muted} loop playsInline preload="auto" />
        <button
          type="button"
          className="v2-slide-mute"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
          )}
        </button>
      </>
    ) : (
      <img src={it.src} alt={it.alt || ''} loading="lazy" />
    );

  if (count === 1) {
    return (
      <div className={`v2-slideshow v2-slideshow--single ${className}`}>
        <div className={frameClass}>{renderMedia(current)}</div>
        {renderCaption?.(current)}
      </div>
    );
  }

  return (
    <div
      className={`v2-slideshow ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button type="button" className="v2-slide-arrow v2-slide-arrow--prev" onClick={() => go(-1)} aria-label="Previous">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <div className={frameClass} key={index}>{renderMedia(current)}</div>
      <button type="button" className="v2-slide-arrow v2-slide-arrow--next" onClick={() => go(1)} aria-label="Next">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </button>
      <div className="v2-slide-dots" role="tablist" aria-label="Slide indicators">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-label={`Go to slide ${i + 1}`}
            aria-selected={i === index}
            className={`v2-slide-dot${i === index ? ' is-active' : ''}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
      {renderCaption?.(current)}
    </div>
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

  const items = section.images.map((img) => ({
    src: img.image_url,
    media_type: img.media_type || 'image',
    alt: img.title || section.title || '',
    title: img.title,
    body: img.body,
  }));
  const anyVideo = items.some((it) => it.media_type === 'video');
  const aspect = anyVideo ? 'reel' : 'post';

  return (
    <section className="v2-custom-gallery" id={`gallery-${section.id}`}>
      <div className="v2-container">
        {section.title && <p className="v2-kicker accent">{section.title.toUpperCase()}</p>}
        {section.subtitle && <h2 className="v2-section-title">{section.subtitle}</h2>}
        <MediaSlideshow
          items={items}
          aspect={aspect}
          className="v2-custom-slideshow"
          renderCaption={(it) => (
            (it.title || it.body) ? (
              <figcaption className="v2-slide-caption">
                {it.title && <strong>{it.title}</strong>}
                {it.body && <p>{it.body}</p>}
              </figcaption>
            ) : null
          )}
        />
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

const DEFAULT_ORDER = ['hero', 'features', 'story', 'flavours', 'perfect-with', 'why', 'reviews', 'gallery', 'footer'];

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
  const list = (() => {
    const base =
      sections && sections.length > 0
        ? sections.filter((s) => s.kind === 'gallery' || RENDERERS[s.key])
        : DEFAULT_ORDER.map((key, i) => ({ id: `d-${i}`, key, kind: 'builtin', is_active: true, images: [] }));
    // Custom gallery sections open the page; footer stays last; everything else keeps its order.
    const galleries = base.filter((s) => s.kind === 'gallery');
    const footers = base.filter((s) => s.key === 'footer' && s.kind !== 'gallery');
    const middle = base.filter((s) => s.kind !== 'gallery' && s.key !== 'footer');
    return [...galleries, ...middle, ...footers];
  })();

  const ctx = { products };

  return (
    <div className="v2">
      {list.map((s) => renderSection(s, ctx))}
    </div>
  );
}
