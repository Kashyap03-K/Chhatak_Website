import { useState, useRef, useEffect } from 'react';
import ModelViewer from '../ModelViewer.jsx';

const MODEL_URL = '/models/chhatak.glb';

const FLAVORS = [
  {
    id: 'indian-classic',
    num: '01',
    name: 'Indian Classic',
    tagline: 'The original. Crispy, spicy, unmistakably coastal.',
    price: '₹199',
    tone: 'warm',
    available: true,
  },
  {
    id: 'peri-peri',
    num: '02',
    name: 'Peri Peri Blaze',
    tagline: 'African heat meets Indian coast. For the brave.',
    price: '₹219',
    tone: 'fire',
    available: true,
  },
  {
    id: 'mint-lime',
    num: '03',
    name: 'Mint & Lime',
    tagline: 'Cool, tangy, refreshingly different.',
    price: 'Coming soon',
    tone: 'cool',
    available: false,
  },
];

const TONE_COLORS = {
  warm: '#E89148',
  fire: '#C95437',
  cool: '#4A8FA8',
};

export default function FlavorShowcase() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);
  const lastScroll = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '200px' }
    );
    observer.observe(section);

    const handleWheel = (e) => {
      const now = Date.now();
      if (now - lastScroll.current < 600) return;
      if (Math.abs(e.deltaY) > 30) {
        lastScroll.current = now;
        setActive((prev) => {
          if (e.deltaY > 0) return Math.min(prev + 1, FLAVORS.length - 1);
          return Math.max(prev - 1, 0);
        });
      }
    };

    section.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      section.removeEventListener('wheel', handleWheel);
      observer.disconnect();
    };
  }, []);

  const activeFlavor = FLAVORS[active];
  const toneColor = TONE_COLORS[activeFlavor.tone];

  return (
    <section id="flavors" className="flavor-showcase" ref={sectionRef}>
      <div className="flavor-showcase__glow" style={{ background: `radial-gradient(ellipse at center, ${toneColor}18 0%, transparent 70%)` }} />

      <div className="container">
        <div className="flavors-head">
          <div>
            <p className="kicker">— The range</p>
            <h2 className="display sm">Three flavors. <em>One coast.</em></h2>
          </div>
          <p className="muted-text">A small, considered range. We'd rather make a few things well than many things average.</p>
        </div>

        <div className="flavor-showcase__layout">
          {/* Left labels */}
          <div className="flavor-showcase__labels flavor-showcase__labels--left">
            {FLAVORS.filter((_, i) => i < active).map((f, i) => (
              <button
                key={f.id}
                className="flavor-showcase__label"
                onClick={() => setActive(FLAVORS.indexOf(f))}
                style={{ '--tone': TONE_COLORS[f.tone] }}
              >
                <span className="flavor-showcase__label-num">{f.num}</span>
                <span className="flavor-showcase__label-name">{f.name}</span>
              </button>
            ))}
          </div>

          {/* Center 3D model — always mounted */}
          <div className="flavor-showcase__center">
            <div className="flavor-showcase__model-glow" style={{ boxShadow: `0 0 120px 60px ${toneColor}25` }} />
            {visible && (
              <ModelViewer
                url={MODEL_URL}
                width="100%"
                height={600}
                defaultRotationX={0}
                defaultRotationY={0}
                defaultZoom={1.4}
                minZoomDistance={1.4}
                maxZoomDistance={1.4}
                ambientIntensity={0.5}
                keyLightIntensity={1.4}
                fillLightIntensity={0.6}
                rimLightIntensity={1.2}
                environmentPreset="night"
                autoRotate={false}
                autoFrame
                enableMouseParallax={false}
                enableHoverRotation
                enableManualZoom={false}
                showScreenshotButton={false}
              />
            )}
          </div>

          {/* Right labels */}
          <div className="flavor-showcase__labels flavor-showcase__labels--right">
            {FLAVORS.filter((_, i) => i > active).map((f) => (
              <button
                key={f.id}
                className="flavor-showcase__label"
                onClick={() => setActive(FLAVORS.indexOf(f))}
                style={{ '--tone': TONE_COLORS[f.tone] }}
              >
                <span className="flavor-showcase__label-num">{f.num}</span>
                <span className="flavor-showcase__label-name">{f.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active flavor info */}
        <div className="flavor-showcase__info" key={activeFlavor.id}>
          <span className="flavor-showcase__num">{activeFlavor.num}</span>
          <h3 className="flavor-showcase__name" style={{ color: toneColor }}>{activeFlavor.name}</h3>
          <p className="flavor-showcase__tagline">{activeFlavor.tagline}</p>
          <div className="flavor-showcase__bottom">
            <span className="flavor-showcase__price">{activeFlavor.price}</span>
            {activeFlavor.available ? (
              <a href="/products" className="btn-link">Add to bag →</a>
            ) : (
              <a href="#" className="btn-link muted">Notify me →</a>
            )}
          </div>
        </div>

        {/* Dots */}
        <div className="flavor-showcase__dots">
          {FLAVORS.map((f, i) => (
            <button
              key={f.id}
              className={`flavor-showcase__dot ${i === active ? 'is-active' : ''}`}
              onClick={() => setActive(i)}
              style={{ '--dot-color': TONE_COLORS[f.tone] }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
