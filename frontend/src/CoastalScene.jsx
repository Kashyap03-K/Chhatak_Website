/* eslint-disable react/no-unknown-property */
import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';

function normalizeModel(scene, targetSize) {
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? targetSize / maxDim : 1;
  scene.scale.setScalar(scale);
  const center = new THREE.Vector3();
  new THREE.Box3().setFromObject(scene).getCenter(center);
  scene.position.sub(center);
  return scene;
}

function Ocean() {
  const geo = useMemo(() => new THREE.PlaneGeometry(200, 200, 80, 80), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(
        i,
        Math.sin(x * 0.08 + t * 0.8) * 0.3 +
        Math.sin(y * 0.06 + t * 0.6) * 0.25 +
        Math.sin((x + y) * 0.05 + t * 1.2) * 0.15
      );
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <meshPhysicalMaterial
        color="#0a3d62"
        roughness={0.2}
        metalness={0.1}
        transparent
        opacity={0.85}
        envMapIntensity={0.8}
      />
    </mesh>
  );
}

function Lighthouse() {
  const { scene } = useGLTF('/models/lighthouse.glb');
  const normalized = useMemo(() => normalizeModel(scene.clone(true), 8), [scene]);
  const beamRef = useRef();

  useFrame(({ clock }) => {
    if (beamRef.current) beamRef.current.rotation.y = clock.getElapsedTime() * 0.5;
  });

  return (
    <group position={[0, -2, 0]}>
      <primitive object={normalized} />
      <group ref={beamRef} position={[0, 6, 0]}>
        <spotLight color="#E89148" intensity={3} distance={50} angle={0.3} penumbra={0.5} />
      </group>
    </group>
  );
}

function Boat() {
  const { scene } = useGLTF('/models/boat.glb');
  const normalized = useMemo(() => normalizeModel(scene.clone(true), 4), [scene]);
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() * 0.3;
    const radius = 10;
    groupRef.current.position.x = Math.sin(t) * radius;
    groupRef.current.position.z = Math.cos(t) * radius;
    groupRef.current.position.y = -1.5 + Math.sin(clock.getElapsedTime() * 1.2) * 0.12;
    groupRef.current.rotation.y = t + Math.PI / 2;
    groupRef.current.rotation.z = Math.sin(clock.getElapsedTime()) * 0.03;
  });

  return (
    <group ref={groupRef}>
      <primitive object={normalized} />
    </group>
  );
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ color: '#E89148', fontFamily: 'Inter, sans-serif', fontSize: '14px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {Math.round(progress)}%
      </div>
    </Html>
  );
}

export default function CoastalScene() {
  return (
    <div className="coastal-hero-canvas">
      <Canvas
        camera={{ position: [12, 6, 12], fov: 45, near: 0.1, far: 200 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#050D1A']} />
        <fog attach="fog" args={['#050D1A', 25, 80]} />
        <ambientLight intensity={0.3} color="#4a6fa5" />
        <directionalLight position={[20, 15, -20]} intensity={1} color="#F5D5A0" />
        <directionalLight position={[-10, 8, 10]} intensity={0.4} color="#6B8EC4" />
        <Suspense fallback={<Loader />}>
          <Ocean />
          <Lighthouse />
          <Boat />
          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/boat.glb');
useGLTF.preload('/models/lighthouse.glb');
