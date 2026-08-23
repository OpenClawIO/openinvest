"use client";

import { assetPath } from "@/lib/asset";
import { GOLD_COLOR, JADE_COLOR } from "@/lib/key-geometry";
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";

const STUDIO = "#000814";
const LOOK_AT: [number, number, number] = [0.05, 0.04, 0];
const KEY_URL = assetPath("/models/key.glb?v=3");

const jadeMaterial = new THREE.MeshPhysicalMaterial({
  color: JADE_COLOR,
  roughness: 0.22,
  metalness: 0,
  transmission: 0.08,
  thickness: 0.4,
  ior: 1.61,
  clearcoat: 0.45,
  clearcoatRoughness: 0.2,
  sheen: 0.25,
  sheenColor: "#fff6e4",
});

const goldMaterial = new THREE.MeshStandardMaterial({
  color: GOLD_COLOR,
  metalness: 0.72,
  roughness: 0.3,
  envMapIntensity: 1.8,
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
      const verts = mesh.geometry.getAttribute("position")?.count ?? 0;
      mesh.material = name.includes("jade") || verts > 400 ? jadeMaterial : goldMaterial;
    });
    return next;
  }, [scene]);
  return <primitive object={model} />;
}

function Studio() {
  return (
    <>
      <Environment resolution={256}>
        <Lightformer intensity={3.2} position={[-2.4, 2.6, 2.2]} scale={[6, 4, 1]} color="#fff3dc" />
        <Lightformer intensity={0.75} position={[3.1, 1.1, -1.8]} scale={[4, 3, 1]} color="#9eb4d4" />
      </Environment>
      <directionalLight
        position={[2.2, 4.0, 2.0]}
        intensity={1.55}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-1.6, 1.8, 3.2]} intensity={0.85} color="#fff1d2" />
      <hemisphereLight args={["#fff4dc", "#1a2233", 0.55]} />
      <ambientLight intensity={0.28} />
      <HeavenEarthKey />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color={STUDIO} roughness={1} metalness={0} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.52} scale={8} blur={2.2} far={2.8} />
      <OrbitControls
        makeDefault
        target={LOOK_AT}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.6}
        maxDistance={5.2}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.46}
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
      camera={{ position: [0.28, 1.42, 2.05], fov: 30, near: 0.1, far: 40 }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(...LOOK_AT);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.06;
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
