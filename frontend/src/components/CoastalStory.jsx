/* eslint-disable react/no-unknown-property */
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const SCENES = [
  {
    src: '/images/scene 1.png',
    kicker: 'Before dawn',
    title: 'The fleet leaves Diu harbour.',
    body: 'A tradition older than the port itself — engines cough to life while the town still sleeps.',
  },
  {
    src: '/images/scene 2.png',
    kicker: 'The catch',
    title: 'Nets full of Bombil.',
    body: 'Silver, slick, and straight from the Arabian Sea. Twenty minutes of pull for a season of taste.',
  },
  {
    src: '/images/scene 3.png',
    kicker: 'A good day',
    title: 'A full net is never taken for granted.',
    body: 'When the haul is heavy, the deck erupts. Some traditions have nothing to do with fishing.',
  },
  {
    src: '/images/scene 4.png',
    kicker: 'Sun and salt',
    title: 'First dry, out at sea.',
    body: 'Bamboo racks, coastal sun, brine on the breeze. The first cure begins before the boat turns home.',
  },
  {
    src: '/images/scene 5.png',
    kicker: 'Coming home',
    title: 'The boat returns to Diu.',
    body: 'Laden with the morning’s catch. Gulls know the sound of the engine before the port does.',
  },
  {
    src: '/images/scene 6.png',
    kicker: 'First hands',
    title: 'The women of the shore sort every fish.',
    body: 'Every Bombil is weighed by eye, graded by hand. Only the best travel further.',
  },
  {
    src: '/images/scene 7.png',
    kicker: 'The kitchen',
    title: 'Every Bombil, hand-cleaned.',
    body: 'No conveyor belts, no shortcuts. This is the part machines have never learned to do.',
  },
  {
    src: '/images/scene 8.png',
    kicker: 'The craft',
    title: 'Hand-fried, hand-spiced.',
    body: 'Seven spices, one family recipe. Roasted in small batches until the crunch is just right.',
  },
  {
    src: '/images/scene 9.png',
    kicker: 'Sealed',
    title: 'Into every pouch, a piece of the coast.',
    body: 'Nitrogen-flushed and locked in — sun, salt, spice, and the sea that made it all.',
  },
];

const AUTOPLAY_MS = 6500;

function BoatModel() {
  const { scene } = useGLTF('/models/boat.glb');
  const groupRef = useRef();

  const normalized = useMemo(() => {
    const cloned = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const s = 3 / Math.max(size.x, size.y, size.z);
    cloned.scale.setScalar(s);
    const center = new THREE.Vector3();
    new THREE.Box3().setFromObject(cloned).getCenter(center);
    cloned.position.sub(center);
    return cloned;
  }, [scene]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.12 + Math.cos(t * 1.8) * 0.05;
    groupRef.current.rotation.z = Math.sin(t * 0.9) * 0.055;
    groupRef.current.rotation.x = Math.sin(t * 0.7) * 0.03;
  });

  return (
    <group ref={groupRef} rotation={[0, -Math.PI, 0]}>
      <primitive object={normalized} />
    </group>
  );
}


export default function CoastalStory() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);
  const total = SCENES.length;

  const goto = useCallback((next, userInitiated = true) => {
    setActive((prev) => {
      if (typeof next === 'function') return next(prev);
      return ((next % total) + total) % total;
    });
    if (userInitiated) setPaused(true);
  }, [total]);

  const next = useCallback((userInitiated = true) => {
    goto((i) => (i + 1) % total, userInitiated);
  }, [goto, total]);
  const prev = useCallback(() => goto((i) => (i - 1 + total) % total, true), [goto, total]);

  // Autoplay
  useEffect(() => {
    if (paused || !inView) return undefined;
    const t = window.setTimeout(() => next(false), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [active, paused, inView, next]);

  // Enter/leave viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Keyboard nav (only while section is in view)
  useEffect(() => {
    if (!inView) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inView, next, prev]);

  // Preload the next image so the upcoming cross-fade is instant
  useEffect(() => {
    const nextIdx = (active + 1) % total;
    const img = new Image();
    img.src = SCENES[nextIdx].src;
  }, [active, total]);

  const scene = SCENES[active];
  const indexLabel = useMemo(
    () => `${String(active + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
    [active, total]
  );

  return (
    <section className="coastal-story" ref={sectionRef} aria-label="The Chhatak journey">
      <div className="story-header">
        <p className="kicker center">&mdash; The Journey</p>
        <h2 className="display sm center">
          From <em>coast</em> to crunch.
        </h2>
        <p className="story-lead">
          Nine scenes. From the boat leaving harbour to the pouch on your shelf.
        </p>
      </div>

      <div className="story-stage" onMouseEnter={() => setPaused(true)}>
        <div className="story-frame">
          {SCENES.map((s, i) => (
            <div
              key={s.src}
              className={`story-scene ${i === active ? 'is-active' : ''}`}
              aria-hidden={i !== active}
            >
              <img
                src={s.src}
                alt={s.title}
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </div>
          ))}
          <div className="story-vignette" aria-hidden="true" />

          <div className="story-caption">
            <p className="story-index">
              <span className="story-index-num">{String(active + 1).padStart(2, '0')}</span>
              <span className="story-index-sep">/</span>
              <span className="story-index-total">{String(total).padStart(2, '0')}</span>
              <span className="story-index-label">— {scene.kicker}</span>
            </p>
            <h3 className="story-title" key={`t-${active}`}>{scene.title}</h3>
            <p className="story-body" key={`b-${active}`}>{scene.body}</p>
          </div>

          <button
            type="button"
            className="story-arrow story-arrow--prev"
            onClick={prev}
            aria-label="Previous scene"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="story-arrow story-arrow--next"
            onClick={() => next(true)}
            aria-label="Next scene"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="story-progress" aria-hidden="true">
            <div
              className={`story-progress-fill ${paused || !inView ? 'is-paused' : ''}`}
              key={`p-${active}-${paused}-${inView}`}
              style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
            />
          </div>
        </div>

        <div className="story-track">
          <svg
            className="track-line"
            viewBox="0 0 1200 24"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 12 Q 150 4 300 12 T 600 12 T 900 12 T 1200 12"
              fill="none"
              stroke="rgba(245, 239, 227, 0.18)"
              strokeWidth="1.5"
              strokeDasharray="5 8"
              strokeLinecap="round"
            />
            <path
              className="track-line-traveled"
              d="M0 12 Q 150 4 300 12 T 600 12 T 900 12 T 1200 12"
              fill="none"
              stroke="#E89148"
              strokeWidth="2"
              strokeLinecap="round"
              pathLength="1000"
              strokeDasharray="1000"
              strokeDashoffset={1000 - ((active + 0.5) / SCENES.length) * 1000}
            />
          </svg>

          <div
            className="track-boat"
            style={{ left: `${((active + 0.5) / SCENES.length) * 100}%` }}
            aria-hidden="true"
          >
            <Canvas
              camera={{ position: [0, 1, 5], fov: 32 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
              style={{ background: 'transparent' }}
            >
              <ambientLight intensity={0.7} />
              <directionalLight position={[3, 5, 3]} intensity={1.2} color="#F5D5A0" />
              <directionalLight position={[-2, 3, -2]} intensity={0.35} color="#6B8EC4" />
              <Suspense fallback={null}>
                <BoatModel />
              </Suspense>
            </Canvas>
          </div>

          <div className="track-ports" role="tablist" aria-label="Story scenes">
            {SCENES.map((s, i) => (
              <button
                key={s.src}
                type="button"
                role="tab"
                aria-selected={i === active}
                className={`track-port ${i === active ? 'is-active' : ''} ${i < active ? 'is-past' : ''}`}
                onClick={() => goto(i, true)}
              >
                <span className="track-port-marker" />
                <span className="track-port-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="track-port-label">{s.kicker}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="story-hint" aria-hidden="true">
          <span>{indexLabel}</span>
          <span className="story-hint-sep">·</span>
          <span>Use <kbd>←</kbd> <kbd>→</kbd> to move between scenes</span>
        </p>
      </div>
    </section>
  );
}
