"use client";

import {
  coinRadius,
  coinThickness,
  createCoinGeometry,
  createStampTexture,
} from "@/lib/coin-geometry";
import { COIN_DENOMS, type CoinDenom, type CoinPiece } from "@/lib/gold";
import { GOLD, GOLD_DEEP } from "@/lib/palette";
import type { CoinStack } from "@/lib/studio";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const STUDIO = "#000814";
const GOLD_COLOR = new THREE.Color(GOLD);
const GOLD_DIM = new THREE.Color(GOLD_DEEP);
const LOOK_AT: [number, number, number] = [0, 0.02, 0];
const GROUP_GAP = 2.15;
const OVERLAP = 0.78;

type StackProps = {
  stack: CoinStack;
  position: [number, number, number];
  active: boolean;
  dimmed: boolean;
  geometries: Record<CoinDenom, THREE.LatheGeometry>;
  stamps: Record<CoinDenom, THREE.CanvasTexture>;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

function layoutPieces(pieces: CoinPiece[]) {
  const radii = pieces.map((piece) => coinRadius(piece.denom));
  const xs = [0];
  for (let index = 1; index < pieces.length; index += 1) {
    xs.push(xs[index - 1] + OVERLAP * (radii[index - 1] + radii[index]));
  }
  const left = (xs[0] ?? 0) - (radii[0] ?? 0);
  const right = (xs.at(-1) ?? 0) + (radii.at(-1) ?? 0);
  const shift = (left + right) / 2;
  return pieces.map((piece, index) => ({
    piece,
    x: xs[index] - shift,
    radius: radii[index],
    thickness: coinThickness(piece.denom) * Math.max(piece.fill, 0.22),
  }));
}

function Coin({
  piece,
  x,
  thickness,
  active,
  dimmed,
  geometry,
  stamp,
}: {
  piece: CoinPiece;
  x: number;
  thickness: number;
  active: boolean;
  dimmed: boolean;
  geometry: THREE.LatheGeometry;
  stamp: THREE.CanvasTexture;
}) {
  const group = useRef<THREE.Group>(null);
  const goldMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const faceMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const display = useRef(GOLD_COLOR.clone());
  const radius = coinRadius(piece.denom);
  const lift = useRef(0);

  useFrame((_, delta) => {
    lift.current = THREE.MathUtils.damp(lift.current, active ? 0.028 : 0, 8, delta);
    if (group.current) {
      group.current.position.y = lift.current;
    }
    display.current.lerp(dimmed ? GOLD_DIM : GOLD_COLOR, 1 - Math.exp(-10 * delta));
    const roughness = THREE.MathUtils.damp(
      goldMat.current?.roughness ?? 0.2,
      active ? 0.14 : dimmed ? 0.38 : 0.2,
      8,
      delta,
    );
    const glow = THREE.MathUtils.damp(
      goldMat.current?.emissiveIntensity ?? 0.04,
      active ? 0.12 : 0.04,
      8,
      delta,
    );
    for (const material of [goldMat.current, faceMat.current]) {
      if (!material) continue;
      material.color.copy(display.current);
      material.roughness = roughness;
      material.emissiveIntensity = glow;
    }
  });

  return (
    <group ref={group} position={[x, 0, 0]}>
      <mesh geometry={geometry} scale={[1, thickness / coinThickness(piece.denom), 1]} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={goldMat}
          color={GOLD}
          metalness={1}
          roughness={0.2}
          clearcoat={0.28}
          clearcoatRoughness={0.22}
          emissive={GOLD}
          emissiveIntensity={0.04}
        />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, thickness / 2 + 0.0012, 0]}
        renderOrder={1}
      >
        <circleGeometry args={[radius * 0.62, 64]} />
        <meshPhysicalMaterial
          ref={faceMat}
          map={stamp}
          color={GOLD}
          metalness={0.85}
          roughness={0.22}
          emissive={GOLD}
          emissiveIntensity={0.04}
        />
      </mesh>
    </group>
  );
}

function CoinStackMesh({
  stack,
  position,
  active,
  dimmed,
  geometries,
  stamps,
  onHover,
  onSelect,
}: StackProps) {
  const laid = useMemo(() => layoutPieces(stack.pieces), [stack.pieces]);
  const hitWidth = useMemo(() => {
    if (laid.length === 0) return 0.4;
    const left = laid[0].x - laid[0].radius;
    const right = laid[laid.length - 1].x + laid[laid.length - 1].radius;
    return right - left + 0.08;
  }, [laid]);
  const hitDepth = useMemo(
    () => Math.max(...laid.map((item) => item.radius * 2), 0.3) + 0.08,
    [laid],
  );

  return (
    <group position={position}>
      {laid.map((item, index) => (
        <Coin
          key={`${stack.id}-${item.piece.denom}-${index}`}
          piece={item.piece}
          x={item.x}
          thickness={item.thickness}
          active={active}
          dimmed={dimmed}
          geometry={geometries[item.piece.denom]}
          stamp={stamps[item.piece.denom]}
        />
      ))}
      <mesh
        position={[0, 0.04, 0]}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(stack.id);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(stack.id);
        }}
      >
        <boxGeometry args={[hitWidth, 0.08, hitDepth]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function StillLife({
  stacks,
  activeId,
  onHover,
  onSelect,
}: {
  stacks: CoinStack[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const geometries = useMemo(() => {
    const map = {} as Record<CoinDenom, THREE.LatheGeometry>;
    for (const denom of COIN_DENOMS) {
      map[denom] = createCoinGeometry(coinRadius(denom), coinThickness(denom));
    }
    return map;
  }, []);

  const stamps = useMemo(() => {
    const map = {} as Record<CoinDenom, THREE.CanvasTexture>;
    for (const denom of COIN_DENOMS) {
      map[denom] = createStampTexture(denom);
    }
    return map;
  }, []);

  useLayoutEffect(() => {
    return () => {
      for (const geometry of Object.values(geometries)) geometry.dispose();
      for (const stamp of Object.values(stamps)) stamp.dispose();
    };
  }, [geometries, stamps]);

  const layout = useMemo(() => {
    const span = (stacks.length - 1) * GROUP_GAP;
    return stacks.map((stack, index) => ({
      stack,
      position: [index * GROUP_GAP - span / 2, 0, 0] as [number, number, number],
    }));
  }, [stacks]);

  return (
    <group>
      {layout.map((item) => (
        <CoinStackMesh
          key={item.stack.id}
          stack={item.stack}
          position={item.position}
          active={activeId === item.stack.id}
          dimmed={activeId != null && activeId !== item.stack.id}
          geometries={geometries}
          stamps={stamps}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

function GoldEnvironment() {
  return (
    <Environment resolution={256}>
      <Lightformer intensity={3.6} position={[-3.2, 2.4, 3]} scale={[6, 4, 1]} color="#fff6e4" />
      <Lightformer intensity={1.15} position={[3.4, 1.4, -2.2]} scale={[4, 3, 1]} color="#9eb4d4" />
      <Lightformer intensity={0.8} position={[0, 3.2, 0]} scale={[8, 2, 1]} color="#ffd27a" />
    </Environment>
  );
}

function Lights() {
  return (
    <>
      <hemisphereLight args={["#ffe9b8", "#120e0a", 0.42]} />
      <ambientLight intensity={0.22} color="#3d2c14" />
      <directionalLight
        position={[1.6, 4.2, 2.1]}
        intensity={2.15}
        color="#fff6e4"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-2.4, 1.6, 1.1]} intensity={0.42} color="#c9d4e6" />
      <directionalLight position={[0.4, 2.4, -2.2]} intensity={0.55} color="#ffd27a" />
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
  stacks,
  activeId,
  onHover,
  onSelect,
}: {
  stacks: CoinStack[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <GoldEnvironment />
      <Lights />
      <StillLife stacks={stacks} activeId={activeId} onHover={onHover} onSelect={onSelect} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color={STUDIO} roughness={1} metalness={0} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.62} scale={10} blur={2.2} far={3.2} />
      <OrbitControls
        makeDefault
        target={LOOK_AT}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.8}
        maxDistance={6}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.44}
        enableZoom={false}
      />
    </>
  );
}

export function StudioStage({
  stacks,
  activeId,
  onHover,
  onSelect,
}: {
  stacks: CoinStack[];
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
      camera={{ position: [0.35, 1.55, 2.35], fov: 32, near: 0.1, far: 40 }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(...LOOK_AT);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
        gl.shadowMap.type = THREE.PCFShadowMap;
      }}
      onPointerMissed={() => onHover(null)}
    >
      <color attach="background" args={[STUDIO]} />
      <AimCamera />
      <Suspense fallback={null}>
        <StudioScene stacks={stacks} activeId={activeId} onHover={onHover} onSelect={onSelect} />
      </Suspense>
    </Canvas>
  );
}
