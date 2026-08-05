import { useEffect, useState, lazy, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/client.js';

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
            <SunDoodle className="v2-doodle v2-doodle--sun" />
            <PalmDoodle className="v2-doodle v2-doodle--palm" />
            <BoatDoodle className="v2-doodle v2-doodle--boat" />
            <SparkDoodle className="v2-doodle v2-doodle--spark1" />
            <SparkDoodle className="v2-doodle v2-doodle--spark2" />
            <img src={packUrl} alt={packAlt} className="v2-hero-pack" />
            <img src={bowlUrl} alt="" className="v2-hero-bowl" aria-hidden="true" />
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
                  muted playsInline preload="metadata"
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
  const list = products.slice(0, 4);
  const bg = ['#F7D65A', '#7FC96B', '#EF7C7C', '#F5A05A'];
  return (
    <section id="products" className="v2-flavours">
      <div className="v2-container">
        <div className="v2-section-head">
          <div>
            <p className="v2-kicker accent">OUR FLAVOURS</p>
            <h2 className="v2-section-title">Bold flavours. <span className="ink">Coastal soul.</span></h2>
          </div>
          <Link to="/#products" className="v2-view-all">
            VIEW ALL PRODUCTS
            <BrushArrowDoodle className="v2-arrow" />
          </Link>
        </div>

        <div className="v2-flavour-grid">
          {list.map((p, i) => (
            <article key={p.id} className="v2-flavour-card">
              <div className={`v2-flavour-image${p.image_url ? '' : ' v2-flavour-image--noimg'}`} style={{ '--flav-bg': bg[i % bg.length] }}>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} />
                ) : (
                  <span className="v2-flavour-badge">{p.flavor || p.name}</span>
                )}
              </div>
              <h3 className="v2-flavour-name">{p.name}</h3>
              <p className="v2-flavour-desc">{p.description?.slice(0, 60) || 'A timeless masala with the perfect coastal kick.'}</p>
              <Link to={`/products/${p.slug}`} className="v2-buy-btn" style={{ '--btn-bg': bg[i % bg.length] }}>
                BUY NOW
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
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
                <video src={it.src} muted playsInline preload="metadata" />
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
              <a href="https://instagram.com/chhatak.co" aria-label="Instagram">◎</a>
              <a href="#" aria-label="Facebook">ⓕ</a>
              <a href="#" aria-label="YouTube">▶</a>
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
          <video src={img.image_url} autoPlay muted loop playsInline preload="metadata" />
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
