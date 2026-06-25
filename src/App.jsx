import ModelViewer from './ModelViewer.jsx';
import SplashCursor from './SplashCursor.jsx';

const PRODUCT_MODEL_URL = '/chhatak.glb';

// Hand-drawn coastal boat SVG (sits behind the pouch in the hero)
function BoatSketch() {
  return (
    <svg className="boat-sketch" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* horizon line */}
      <path d="M 0 240 Q 200 232, 400 240 T 800 240" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      {/* boat hull */}
      <path d="M 280 250 L 540 250 L 510 295 L 310 295 Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      {/* deck */}
      <path d="M 280 250 L 540 250" stroke="currentColor" strokeWidth="1.8"/>
      {/* mast */}
      <path d="M 410 250 L 410 130" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      {/* flag */}
      <path d="M 410 130 L 450 142 L 410 155" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
      {/* figures on boat */}
      <circle cx="350" cy="240" r="4" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M 348 244 L 348 258 M 352 244 L 352 258" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="470" cy="238" r="4" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M 468 242 L 468 258 M 472 242 L 472 258" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="500" cy="234" r="4" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M 498 238 L 498 256 M 502 238 L 502 256" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      {/* water ripples beneath */}
      <path d="M 240 320 Q 280 314, 320 320 T 400 320 T 480 320 T 560 320 T 640 320" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.55"/>
      <path d="M 200 340 Q 250 334, 300 340 T 400 340 T 500 340 T 600 340 T 700 340" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
      {/* seagulls */}
      <path d="M 120 100 Q 132 92, 144 100 Q 156 92, 168 100" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 640 130 Q 652 122, 664 130 Q 676 122, 688 130" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 700 80 Q 708 74, 716 80 Q 724 74, 732 80" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      {/* sun */}
      <circle cx="600" cy="160" r="38" stroke="currentColor" strokeWidth="1.4" fill="none" opacity="0.7"/>
    </svg>
  );
}

function WaveDivider({ flip = false }) {
  return (
    <div className={`wave-divider ${flip ? 'flip' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 40 Q 180 10, 360 40 T 720 40 T 1080 40 T 1440 40 L 1440 80 L 0 80 Z" fill="currentColor"/>
      </svg>
    </div>
  );
}

export default function App() {
  return (
    <>
      <SplashCursor
        SPLAT_RADIUS={0.18}
        SPLAT_FORCE={5500}
        DENSITY_DISSIPATION={3.2}
        VELOCITY_DISSIPATION={1.8}
        CURL={3}
        RAINBOW_MODE={true}
        COLOR_UPDATE_SPEED={8}
      />

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="#home" className="brand">Chhatak<sup>™</sup></a>
          <ul className="nav-links">
            <li><a href="#story">Story</a></li>
            <li><a href="#product">Product</a></li>
            <li><a href="#flavors">Range</a></li>
            <li><a href="#buy">Shop</a></li>
          </ul>
          <a className="btn-outline" href="#buy">Buy now</a>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" className="hero">
        {/* ambient ocean glow */}
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
            <BoatSketch />
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
              <a className="btn-solid" href="#buy">Order — ₹199</a>
              <a className="btn-link" href="#story">Our story →</a>
            </div>
          </div>
        </div>

        {/* animated wave bottom */}
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

      {/* STORY */}
      <section id="story" className="story section">
        <div className="container">
          <div className="story-grid">
            <div className="story-left">
              <p className="kicker">— Our story</p>
              <h2 className="display sm">
                The taste of the <em>Konkan coast</em>, sealed in a pouch.
              </h2>
            </div>
            <div className="story-right">
              <p>Chhatak was born on the windswept shores of western India, where fishermen bring in the day's catch at dawn and grandmothers turn Bombil — Bombay duck — into something legendary.</p>
              <p>We took that century-old craft, kept the soul intact, and made it ready for the modern shelf. Every pouch is a piece of the coast: sun, salt, spice, and a crunch that lingers.</p>
              <a className="btn-link" href="#product">Discover the process →</a>
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
            <div className="spec">
              <p className="spec-num">01</p>
              <h3>Sourced at dawn</h3>
              <p>From local fishermen on the Konkan coast, hand-graded the same morning.</p>
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
            <div className="spec">
              <p className="spec-num">04</p>
              <h3>Sealed fresh</h3>
              <p>Nitrogen-flushed pouches lock in crunch for six full months.</p>
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
      <section id="flavors" className="flavors section">
        <div className="container">
          <div className="flavors-head">
            <div>
              <p className="kicker">— The range</p>
              <h2 className="display sm">Three flavors. <em>One coast.</em></h2>
            </div>
            <p className="muted-text">A small, considered range. We'd rather make a few things well than many things average.</p>
          </div>

          <div className="flavor-grid">
            <article className="flavor-card">
              <div className="flavor-thumb tone-warm">
                <span className="flavor-label">01 / Indian Classic</span>
              </div>
              <div className="flavor-body">
                <h3>Indian Classic</h3>
                <p>The original. Crispy, spicy, unmistakably coastal.</p>
                <div className="flavor-meta">
                  <span>₹199</span>
                  <a href="#buy" className="btn-link">Add to bag →</a>
                </div>
              </div>
            </article>

            <article className="flavor-card">
              <div className="flavor-thumb tone-fire">
                <span className="flavor-label">02 / Peri Peri Blaze</span>
              </div>
              <div className="flavor-body">
                <h3>Peri Peri Blaze</h3>
                <p>African heat meets Indian coast. For the brave.</p>
                <div className="flavor-meta">
                  <span>₹219</span>
                  <a href="#buy" className="btn-link">Add to bag →</a>
                </div>
              </div>
            </article>

            <article className="flavor-card">
              <div className="flavor-thumb tone-cool">
                <span className="flavor-label">03 / Mint &amp; Lime</span>
              </div>
              <div className="flavor-body">
                <h3>Mint &amp; Lime</h3>
                <p>Cool, tangy, refreshingly different.</p>
                <div className="flavor-meta">
                  <span>Coming soon</span>
                  <a href="#" className="btn-link muted">Notify me →</a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* BUY */}
      <section id="buy" className="buy section">
        <div className="container buy-grid">
          <div>
            <p className="kicker accent">— Available now</p>
            <h2 className="display sm">One pouch is <em>never</em> enough.</h2>
            <p className="lead-dark">Available on Amazon India and select coastal stores. Complimentary shipping on orders above ₹499.</p>
            <div className="buy-actions">
              <a className="btn-solid accent" href="https://www.amazon.in/gp/product/B0GZVZRC1Z" target="_blank" rel="noopener">Buy on Amazon →</a>
              <a className="btn-link" href="#">Find a stockist</a>
            </div>
          </div>

          <div className="buy-card">
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
            <a className="btn-solid accent full" href="https://www.amazon.in/gp/product/B0GZVZRC1Z" target="_blank" rel="noopener">Grab the combo</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div>
              <a href="#home" className="brand big">Chhatak<sup>™</sup></a>
              <p className="footer-tag">The coastal crunch. Fresh from sea, made for you.</p>
            </div>
            <div className="footer-cols">
              <div>
                <p className="footer-h">Shop</p>
                <a href="#flavors">Indian Classic</a>
                <a href="#flavors">Peri Peri Blaze</a>
                <a href="#buy">Combo packs</a>
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
