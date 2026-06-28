/* eslint-disable react/no-unknown-property */
import { useEffect, useRef, useState, Suspense, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

const WAYPOINTS = [
  {
    id: 'panikotha',
    x: 92, y: 22,
    label: 'Pani Kotha',
    img: '/images/fort.png',
    text: 'The sea fortress of Pani Kotha — standing guard off the coast of Diu since the Portuguese era.',
  },
  {
    id: 'fort',
    x: 96, y: 28,
    label: 'Diu Fort',
    img: '/images/fort.png',
    text: 'Built in 1535, the Portuguese fortress commands the eastern tip of Diu — where the island meets the open sea.',
  },
  {
    id: 'caves',
    x: 48, y: 40,
    label: 'Naida Caves',
    img: '/images/net-casting.png',
    text: 'Ancient rock-cut caves where light filters through stone — a hidden gem at the heart of the island.',
  },
  {
    id: 'memorial',
    x: 48, y: 58,
    label: 'INS Khukri',
    img: '/images/coast-aerial.png',
    text: 'The INS Khukri Memorial honours the brave — standing at the southern coast where the Arabian Sea breaks.',
  },
];

const SNAP_DISTANCE = 13;

function BoatModel() {
  const { scene } = useGLTF('/models/boat.glb');
  const groupRef = useRef();
  const normalized = useMemo(() => {
    const cloned = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const s = 4 / Math.max(size.x, size.y, size.z);
    cloned.scale.setScalar(s);
    const center = new THREE.Vector3();
    new THREE.Box3().setFromObject(cloned).getCenter(center);
    cloned.position.sub(center);
    return cloned;
  }, [scene]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 0.9) * 0.08 + Math.cos(t * 1.4) * 0.04;
    groupRef.current.rotation.z = Math.sin(t * 0.7) * 0.04;
    groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.025;
  });

  return (
    <group ref={groupRef} rotation={[0, Math.PI, 0]}>
      <primitive object={normalized} />
    </group>
  );
}

export default function CoastalJourney() {
  const mapRef = useRef(null);
  const [boatPos, setBoatPos] = useState({ x: 72, y: 72 });
  const [dragging, setDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [nearestWP, setNearestWP] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const toPercent = useCallback((clientX, clientY) => {
    const rect = mapRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const findNearest = useCallback((pos) => {
    let closest = null;
    let minDist = Infinity;
    WAYPOINTS.forEach((wp, i) => {
      const d = Math.hypot(wp.x - pos.x, wp.y - pos.y);
      if (d < minDist) { minDist = d; closest = i; }
    });
    return minDist < SNAP_DISTANCE ? closest : null;
  }, []);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    setHasDragged(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = mapRef.current.getBoundingClientRect();
    const boatPx = {
      x: (boatPos.x / 100) * rect.width + rect.left,
      y: (boatPos.y / 100) * rect.height + rect.top,
    };
    dragOffset.current = { x: clientX - boatPx.x, y: clientY - boatPx.y };
  }, [boatPos]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const pos = toPercent(clientX - dragOffset.current.x, clientY - dragOffset.current.y);
      pos.x = Math.max(2, Math.min(98, pos.x));
      pos.y = Math.max(2, Math.min(98, pos.y));
      setBoatPos(pos);
      setNearestWP(findNearest(pos));
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, toPercent, findNearest]);

  useEffect(() => {
    if (!dragging) setNearestWP(findNearest(boatPos));
  }, [dragging, boatPos, findNearest]);

  return (
    <section className="coastal-journey">
      <div className="journey-header">
        <p className="kicker center">— The Journey</p>
        <h2 className="display sm center">From <em>coast</em> to crunch.</h2>
        <p className="muted-text" style={{ textAlign: 'center', maxWidth: 480, margin: '16px auto 0' }}>
          Drag the boat across the map to explore the island of Diu.
        </p>
      </div>

      <div className="voyage-map">
        <div className="voyage-parchment">
          <div className="voyage-map-inner" ref={mapRef}>

            {/* waypoints (invisible pins, tooltip on proximity) */}
            {WAYPOINTS.map((wp, i) => (
              <div
                key={wp.id}
                className={`voyage-point ${nearestWP === i ? 'active' : ''}`}
                style={{ left: `${wp.x}%`, top: `${wp.y}%` }}
              >
                {nearestWP === i && (
                  <div className="voyage-tooltip">
                    <div className="voyage-tooltip-img">
                      <img src={wp.img} alt={wp.label} draggable={false} />
                    </div>
                    <h3>{wp.label}</h3>
                    <p>{wp.text}</p>
                  </div>
                )}
              </div>
            ))}

            {/* draggable boat */}
            <div
              className={`voyage-boat ${dragging ? 'grabbing' : ''}`}
              style={{ left: `${boatPos.x}%`, top: `${boatPos.y}%` }}
              onMouseDown={onPointerDown}
              onTouchStart={onPointerDown}
            >
              {!hasDragged && <span className="voyage-move-label">Drag me!</span>}
              <Canvas
                camera={{ position: [0, 1.5, 6], fov: 35 }}
                dpr={[1, 1.5]}
                gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
                style={{ background: 'transparent' }}
              >
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 8, 5]} intensity={1.3} color="#F5D5A0" />
                <directionalLight position={[-3, 4, -2]} intensity={0.3} color="#6B8EC4" />
                <Suspense fallback={null}>
                  <BoatModel />
                  <Environment preset="sunset" />
                </Suspense>
              </Canvas>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

useGLTF.preload('/models/boat.glb');
