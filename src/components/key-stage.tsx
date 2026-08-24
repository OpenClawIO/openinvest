"use client";

import { assetPath } from "@/lib/asset";
import { GOLD_COLOR, JADE_COLOR } from "@/lib/key-geometry";
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";

const STUDIO = "#000814";
const LOOK_AT: [number, number, number] = [0.1, 0.33, 0];
const KEY_URL = assetPath("/models/key.glb?v=19");

const jadeMaterial = new THREE.MeshPhysicalMaterial({
  color: JADE_COLOR,
  roughness: 0.32,
  metalness: 0,
  transmission: 0.12,
  thickness: 0.42,
  ior: 1.62,
  clearcoat: 0.28,
  clearcoatRoughness: 0.28,
  attenuationColor: "#b7c8a8",
  attenuationDistance: 0.22,
  sheen: 0.55,
  sheenColor: "#f4f0de",
  sheenRoughness: 0.38,
});

const goldMaterial = new THREE.MeshPhysicalMaterial({
  color: GOLD_COLOR,
  metalness: 1,
  roughness: 0.12,
  envMapIntensity: 2.1,
  clearcoat: 0.35,
  clearcoatRoughness: 0.08,
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
  return <primitive object={model} rotation={[0, Math.PI * 0.16, 0]} />;
}

function Studio() {
  return (
    <>
      <Environment resolution={512}>
        <Lightformer intensity={3.2} position={[0.2, 3.4, 2.2]} scale={[8, 3.2, 1]} color="#fff6e4" />
        <Lightformer intensity={1.7} position={[3.6, 1.4, 1.1]} scale={[2.4, 5, 1]} color="#ffe7b8" />
        <Lightformer intensity={0.7} position={[-3.4, 1.8, 0.6]} scale={[3.2, 3.2, 1]} color="#c9d6e8" />
        <Lightformer intensity={1.2} position={[0.6, 0.35, 3.8]} scale={[7, 1.4, 1]} color="#fff1d0" />
      </Environment>
      <directionalLight
        position={[2.4, 3.2, 2.8]}
        intensity={1.35}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-2.2, 1.4, 2.2]} intensity={0.55} color="#dce6f4" />
      <hemisphereLight args={["#fff4dc", "#121820", 0.38]} />
      <ambientLight intensity={0.16} />
      <HeavenEarthKey />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color={STUDIO} roughness={1} metalness={0} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.55} scale={10} blur={2.4} far={4} />
      <OrbitControls
        makeDefault
        target={LOOK_AT}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.6}
        maxDistance={4.8}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.5}
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
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0.95, 0.92, 2.2], fov: 32, near: 0.1, far: 40 }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(...LOOK_AT);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
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
