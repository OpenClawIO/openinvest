"use client";

import { assetPath } from "@/lib/asset";
import { GOLD_COLOR, JADE_COLOR } from "@/lib/key-geometry";
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";

const STUDIO = "#000814";
const LOOK_AT: [number, number, number] = [0.12, 0.86, 0];
const KEY_URL = assetPath("/models/key.glb?v=16");

const jadeMaterial = new THREE.MeshPhysicalMaterial({
  color: JADE_COLOR,
  roughness: 0.28,
  metalness: 0,
  transmission: 0.1,
  thickness: 0.22,
  ior: 1.61,
  clearcoat: 0.42,
  clearcoatRoughness: 0.2,
  attenuationColor: "#9fb89a",
  attenuationDistance: 0.36,
  sheen: 0.28,
  sheenColor: "#e4eedc",
});

const goldMaterial = new THREE.MeshStandardMaterial({
  color: GOLD_COLOR,
  metalness: 0.92,
  roughness: 0.15,
  envMapIntensity: 1.75,
});

function HeavenEarthKey() {
  const { scene } = useGLTF(KEY_URL);
  const model = useMemo(() => {
    const next = scene.clone(true);
    next.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const name = `${mesh.name} ${mesh.parent?.name ?? ""}`.toLowerCase();
      mesh.material = name.includes("jade") ? jadeMaterial : goldMaterial;
    });
    return next;
  }, [scene]);
  return <primitive object={model} rotation={[0, Math.PI * 0.11, 0]} />;
}

function Studio() {
  return (
    <>
      <Environment resolution={256}>
        <Lightformer intensity={2.8} position={[-2.2, 2.8, 2.4]} scale={[6, 4, 1]} color="#fff3dc" />
        <Lightformer intensity={0.7} position={[3.0, 1.4, -1.6]} scale={[4, 3, 1]} color="#9eb4d4" />
      </Environment>
      <directionalLight
        position={[2.0, 3.6, 2.4]}
        intensity={1.45}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-1.8, 1.6, 2.8]} intensity={0.72} color="#fff1d2" />
      <hemisphereLight args={["#fff4dc", "#1a2233", 0.46]} />
      <ambientLight intensity={0.22} />
      <HeavenEarthKey />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color={STUDIO} roughness={1} metalness={0} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.5} scale={8} blur={2.2} far={3.2} />
      <OrbitControls
        makeDefault
        target={LOOK_AT}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={2.1}
        maxDistance={5.8}
        minPolarAngle={Math.PI * 0.34}
        maxPolarAngle={Math.PI * 0.52}
        enableZoom={false}
      />
    </>
  );
}

export function KeyStage() {
  return (
    <Canvas
      className="studio-canvas"
      shadows
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [1.05, 0.88, 3.9], fov: 28, near: 0.1, far: 40 }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(...LOOK_AT);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.02;
        gl.shadowMap.type = THREE.PCFShadowMap;
      }}
    >
      <color attach="background" args={[STUDIO]} />
      <Suspense fallback={null}>
        <Studio />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(KEY_URL);
