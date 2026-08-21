"use client";

import type { StudioVolume } from "@/lib/studio";
import { barWidth } from "@/lib/studio";
import { ContactShadows, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const LOOK_AT: [number, number, number] = [0, 0.28, 0];
const HEIGHT = 0.56;
const DEPTH = 0.72;
const SPAN = 2.55;
const GAP = 0.045;
const STUDIO = "#000814";

type BlockProps = {
  volume: StudioVolume;
  width: number;
  position: [number, number, number];
  active: boolean;
  dimmed: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

function Block({ volume, width, position, active, dimmed, onHover, onSelect }: BlockProps) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const lift = useRef(0);
  const base = useMemo(() => new THREE.Color(volume.color), [volume.color]);
  const faded = useMemo(
    () => new THREE.Color(volume.color).lerp(new THREE.Color(STUDIO), 0.42),
    [volume.color],
  );
  const display = useMemo(() => new THREE.Color(volume.color), [volume.color]);

  useFrame((_, delta) => {
    lift.current = THREE.MathUtils.damp(lift.current, active ? 0.04 : 0, 8, delta);
    if (group.current) {
      group.current.position.set(position[0], lift.current, position[2]);
    }
    if (material.current) {
      display.lerp(dimmed ? faded : base, 1 - Math.exp(-10 * delta));
      material.current.color.copy(display);
      material.current.roughness = THREE.MathUtils.damp(
        material.current.roughness,
        active ? 0.28 : dimmed ? 0.58 : 0.4,
        8,
        delta,
      );
      material.current.emissiveIntensity = THREE.MathUtils.damp(
        material.current.emissiveIntensity,
        active ? 0.08 : 0,
        8,
        delta,
      );
    }
  });

  return (
    <group
      ref={group}
      position={[position[0], 0, position[2]]}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(volume.id);
      }}
      onPointerOut={() => onHover(null)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(volume.id);
      }}
    >
      <RoundedBox
        args={[width, HEIGHT, DEPTH]}
        radius={0.022}
        smoothness={5}
        position={[0, HEIGHT / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          ref={material}
          color={volume.color}
          roughness={0.4}
          metalness={0.22}
          clearcoat={0.35}
          clearcoatRoughness={0.38}
          emissive={volume.color}
          emissiveIntensity={0}
        />
      </RoundedBox>
    </group>
  );
}

function StillLife({
  volumes,
  activeId,
  onHover,
  onSelect,
}: {
  volumes: StudioVolume[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const layout = useMemo(() => {
    const widths = volumes.map((volume) => barWidth(volume.weight, SPAN));
    const total = widths.reduce((sum, width) => sum + width, 0) + GAP * Math.max(volumes.length - 1, 0);
    return volumes.map((volume, index) => {
      const width = widths[index];
      const x =
        widths.slice(0, index).reduce((sum, item) => sum + item + GAP, 0) - total / 2 + width / 2;
      return {
        volume,
        width,
        position: [x, 0, 0] as [number, number, number],
      };
    });
  }, [volumes]);

  return (
    <group>
      {layout.map((item) => (
        <Block
          key={item.volume.id}
          volume={item.volume}
          width={item.width}
          position={item.position}
          active={activeId === item.volume.id}
          dimmed={activeId != null && activeId !== item.volume.id}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

function Lights() {
  return (
    <>
      <hemisphereLight args={["#4a5d7a", "#070b12", 0.7]} />
      <ambientLight intensity={0.28} color="#1a2740" />
      <directionalLight
        position={[2.2, 3.8, 2.6]}
        intensity={1.55}
        color="#e8f0ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00015}
      />
      <directionalLight position={[-2.8, 1.4, 1.4]} intensity={0.55} color="#1c6cff" />
      <directionalLight position={[0.2, 2.2, -2.4]} intensity={0.28} color="#3d4f6e" />
    </>
  );
}

function AimCamera() {
  const camera = useThree((state) => state.camera);
  useLayoutEffect(() => {
    camera.lookAt(...LOOK_AT);
  }, [camera]);
  return null;
}

function StudioScene({
  volumes,
  activeId,
  onHover,
  onSelect,
}: {
  volumes: StudioVolume[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <Lights />
      <StillLife volumes={volumes} activeId={activeId} onHover={onHover} onSelect={onSelect} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color={STUDIO} roughness={1} metalness={0} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.55} scale={8} blur={2.4} far={3.2} />
      <OrbitControls
        makeDefault
        target={LOOK_AT}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.8}
        maxDistance={5.4}
        minPolarAngle={Math.PI * 0.32}
        maxPolarAngle={Math.PI * 0.48}
        enableZoom={false}
      />
    </>
  );
}

export function StudioStage({
  volumes,
  activeId,
  onHover,
  onSelect,
}: {
  volumes: StudioVolume[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <Canvas
      className="studio-canvas"
      shadows
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [1.45, 0.78, 2.42], fov: 28, near: 0.1, far: 40 }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(...LOOK_AT);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.18;
        gl.shadowMap.type = THREE.PCFShadowMap;
      }}
      onPointerMissed={() => onHover(null)}
    >
      <color attach="background" args={[STUDIO]} />
      <AimCamera />
      <Suspense fallback={null}>
        <StudioScene volumes={volumes} activeId={activeId} onHover={onHover} onSelect={onSelect} />
      </Suspense>
    </Canvas>
  );
}
