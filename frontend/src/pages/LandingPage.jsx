import { lazy, Suspense } from 'react';
import ModelViewer from '../ModelViewer.jsx';
import LazySection from '../components/LazySection.jsx';

const CoastalJourney = lazy(() => import('../CoastalJourney.jsx'));
const FlavorShowcase = lazy(() => import('../components/FlavorShowcase.jsx'));

const PRODUCT_MODEL_URL = '/models/chhatak.glb';


export default function LandingPage() {
  return (
    <>
      {/* HERO */}
      <section id="home" className="hero">
        <div className="ocean-glow"></div>

        <div className="hero-inner">
          <div className="eyebrow-row">
            <span className="kicker">— Coastal India · Est. 2024</span>
            <span className="kicker right">Bombil Crunch · 100g</span>
          </div>

          <h1 className="display">
            Fresh from the <em>sea</em>.<br/>
            Made for <em>you</em>.
          </h1>

          <div className="model-stage">
            <div className="model-wrap">
              <ModelViewer
                url={PRODUCT_MODEL_URL}
                width="100%"
                height={620}
                defaultRotationX={0}
                defaultRotationY={0}
                defaultZoom={2}
                minZoomDistance={1}
                maxZoomDistance={6}
                ambientIntensity={0.45}
                keyLightIntensity={1.3}
                fillLightIntensity={0.5}
                rimLightIntensity={1.1}
                environmentPreset="night"
                autoRotate
                autoRotateSpeed={0.35}
                autoFrame
                fadeIn
                enableMouseParallax
                enableHoverRotation
                showScreenshotButton={false}
              />
            </div>
          </div>

          <div className="hero-meta">
            <div>
              <p className="meta-label">The product</p>
              <p className="meta-value">Bombil Crunch — Indian Classic. A century-old coastal recipe, hauled in at dawn and refined for the modern palate.</p>
            </div>
            <div className="hero-cta">
              <a className="btn-solid" href="/products">Order — ₹199</a>
              <a className="btn-link" href="#story">Our story →</a>
            </div>
          </div>
        </div>

        <div className="hero-waves" aria-hidden="true">
          <svg viewBox="0 0 1440 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path className="wave-a" d="M0 70 Q 180 30, 360 70 T 720 70 T 1080 70 T 1440 70 L 1440 140 L 0 140 Z"/>
            <path className="wave-b" d="M0 90 Q 200 50, 400 90 T 800 90 T 1200 90 T 1600 90 L 1600 140 L 0 140 Z"/>
          </svg>
        </div>
      </section>

      {/* MARQUEE STRIP */}
      <div className="marquee">
        <div className="marquee-track">
          <span>Crispy</span><span className="dot">⌁</span>
          <span>Spicy</span><span className="dot">⌁</span>
          <span>Addictive</span><span className="dot">⌁</span>
          <span>Coastal</span><span className="dot">⌁</span>
          <span>Crispy</span><span className="dot">⌁</span>
          <span>Spicy</span><span className="dot">⌁</span>
          <span>Addictive</span><span className="dot">⌁</span>
          <span>Coastal</span><span className="dot">⌁</span>
          <span>Crispy</span><span className="dot">⌁</span>
          <span>Spicy</span><span className="dot">⌁</span>
          <span>Addictive</span><span className="dot">⌁</span>
          <span>Coastal</span><span className="dot">⌁</span>
        </div>
      </div>

      {/* COASTAL JOURNEY — scroll-driven route */}
      <LazySection rootMargin="300px" style={{ minHeight: 500 }}>
        <Suspense fallback={null}>
          <CoastalJourney />
        </Suspense>
      </LazySection>

      {/* STORY */}
      <section id="story" className="story section">
        <div className="container">
          <div className="story-grid">
            <div className="story-left">
              <p className="kicker">— Our story</p>
              <h2 className="display sm">
                The taste of the <em>Konkan coast</em>, sealed in a pouch.
              </h2>
              <img src="/images/bowl-annotated.JPG" alt="Bombil Crunch — Crispy, Spicy, Addictive" className="story-image" loading="lazy" />
            </div>
            <div className="story-right">
              <p>Chhatak was born on the windswept shores of western India, where fishermen bring in the day's catch at dawn and grandmothers turn Bombil — Bombay duck — into something legendary.</p>
              <p>We took that century-old craft, kept the soul intact, and made it ready for the modern shelf. Every pouch is a piece of the coast: sun, salt, spice, and a crunch that lingers.</p>
              <a className="btn-link" href="#product">Discover the process →</a>
              <img src="/images/packaging-real.JPG" alt="Chhatak Bombil Crunch packaging" className="story-image-pack" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* SPECS / NUMBERS */}
      <section id="product" className="specs section">
        <div className="container">
          <p className="kicker center">— By the numbers</p>
          <h2 className="display sm center">Crafted, not <em>manufactured</em>.</h2>

          <div className="specs-grid">
            <div className="spec spec--has-img">
              <img src="/images/bowl.JPG" alt="Bombil Crunch in bowl" className="spec-bg-img" loading="lazy" />
              <div className="spec-content">
                <p className="spec-num">01</p>
                <h3>Sourced at dawn</h3>
                <p>From local fishermen on the Konkan coast, hand-graded the same morning.</p>
              </div>
            </div>
            <div className="spec">
              <p className="spec-num">02</p>
              <h3>Sun-dried, slow</h3>
              <p>72 hours under coastal sun. No shortcuts, no ovens, no compromise.</p>
            </div>
            <div className="spec">
              <p className="spec-num">03</p>
              <h3>Hand-blended masala</h3>
              <p>Seven spices, one family recipe. Roasted in small batches.</p>
            </div>
            <div className="spec spec--has-img">
              <img src="/images/packaging-real.JPG" alt="Chhatak packaging" className="spec-bg-img" loading="lazy" />
              <div className="spec-content">
                <p className="spec-num">04</p>
                <h3>Sealed fresh</h3>
                <p>Nitrogen-flushed pouches lock in crunch for six full months.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="quote section">
        <div className="container">
          <blockquote>
            <p>"A snack that tastes like the <em>sea remembered it</em>."</p>
            <cite>— Vogue India, Coastal Edit</cite>
          </blockquote>
        </div>
      </section>

      {/* FLAVORS */}
      <Suspense fallback={null}>
        <FlavorShowcase />
      </Suspense>

      {/* BUY */}
      <section id="buy" className="buy section">
        <div className="container buy-grid">
          <div>
            <p className="kicker accent">— Available now</p>
            <h2 className="display sm">One pouch is <em>never</em> enough.</h2>
            <p className="lead-dark">Available on our store and select coastal shops. Complimentary shipping on orders above ₹499.</p>
            <div className="buy-actions">
              <a className="btn-solid accent" href="/products">Shop now →</a>
              <a className="btn-link" href="#">Find a stockist</a>
            </div>
          </div>

          <div className="buy-card">
            <img src="/images/packaging-front-back.png" alt="Chhatak packaging front and back" className="buy-card-img" loading="lazy" />
            <p className="kicker">— Combo</p>
            <h3 className="combo-title">Pack of three</h3>
            <p className="combo-sub">100g each · Indian Classic</p>
            <div className="combo-price">
              <span className="price-now">₹549</span>
              <span className="price-was">₹699</span>
            </div>
            <ul className="combo-list">
              <li>Complimentary shipping</li>
              <li>100% authentic Chhatak</li>
              <li>Easy returns within 7 days</li>
            </ul>
            <a className="btn-solid accent full" href="/products">Grab the combo</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div>
              <a href="/" className="brand big">Chhatak<sup>™</sup></a>
              <p className="footer-tag">The coastal crunch. Fresh from sea, made for you.</p>
            </div>
            <div className="footer-cols">
              <div>
                <p className="footer-h">Shop</p>
                <a href="/products">Indian Classic</a>
                <a href="/products">Peri Peri Blaze</a>
                <a href="/products">Combo packs</a>
              </div>
              <div>
                <p className="footer-h">Company</p>
                <a href="#story">Story</a>
                <a href="#">Sustainability</a>
                <a href="#">Press</a>
              </div>
              <div>
                <p className="footer-h">Connect</p>
                <a href="https://instagram.com/chhatak.co" target="_blank" rel="noopener">Instagram</a>
                <a href="#">Newsletter</a>
                <a href="#">Contact</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Chhatak Foods Pvt. Ltd. — The Coastal Crunch™</p>
            <div className="footer-legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
