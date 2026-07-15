import { lazy, Suspense } from 'react';

const CoastalStory = lazy(() => import('../components/CoastalStory.jsx'));
const ProductsShowcase = lazy(() => import('../components/ProductsShowcase.jsx'));
const ReelsWall = lazy(() => import('../components/ReelsWall.jsx'));
const ReviewsWall = lazy(() => import('../components/ReviewsWall.jsx'));


export default function LandingPage() {
  return (
    <>
      {/* COASTAL STORY — 9-scene interactive journey (opens the page, fullscreen) */}
      <Suspense fallback={null}>
        <CoastalStory fullscreen />
      </Suspense>

      {/* PRODUCTS */}
      <Suspense fallback={null}>
        <ProductsShowcase />
      </Suspense>

      {/* REELS */}
      <Suspense fallback={null}>
        <ReelsWall />
      </Suspense>

      {/* REVIEWS */}
      <Suspense fallback={null}>
        <ReviewsWall />
      </Suspense>

      {/* STORY */}
      <section id="story" className="story section">
        <div className="container">
          <header className="story-header-block">
            <p className="kicker">— Our story</p>
            <h2 className="display sm">
              The taste of <em>Diu</em>, sealed in a pouch.
            </h2>
          </header>

          <div className="story-grid">
            <figure className="story-media">
              <img
                src="/images/bowl-annotated.JPG"
                alt="Bombil Crunch — Crispy, Spicy, Addictive"
                loading="lazy"
              />
            </figure>

            <div className="story-copy">
              <p className="story-lede">
                Chhatak was born on the windswept shores of western India, where fishermen
                bring in the day's catch at dawn and grandmothers turn Bombil — Bombay duck —
                into something legendary.
              </p>
              <p>
                We took that century-old craft, kept the soul intact, and made it ready for
                the modern shelf. Every pouch is a piece of the coast: sun, salt, spice, and
                a crunch that lingers.
              </p>

              <ul className="story-pillars">
                <li>
                  <span className="pillar-num">01</span>
                  <div>
                    <h4>Coastal origin</h4>
                    <p>Sourced from Diu, fished at dawn.</p>
                  </div>
                </li>
                <li>
                  <span className="pillar-num">02</span>
                  <div>
                    <h4>Slow craft</h4>
                    <p>Sun-dried 72 hours. No shortcuts.</p>
                  </div>
                </li>
                <li>
                  <span className="pillar-num">03</span>
                  <div>
                    <h4>One family recipe</h4>
                    <p>Seven spices, small-batch roasted.</p>
                  </div>
                </li>
              </ul>

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
            <div className="spec spec--has-img">
              <img src="/images/bowl.JPG" alt="Bombil Crunch in bowl" className="spec-bg-img" loading="lazy" />
              <div className="spec-content">
                <p className="spec-num">01</p>
                <h3>Sourced at dawn</h3>
                <p>From local fishermen off the Diu coast, hand-graded the same morning.</p>
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
