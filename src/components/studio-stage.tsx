"use client";

import { COIN_PITCH, COIN_RADIUS, COIN_THICKNESS, createCoinGeometry } from "@/lib/coin-geometry";
import { GOLD, GOLD_DEEP } from "@/lib/palette";
import type { CoinStack } from "@/lib/studio";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const STUDIO = "#000814";
const GOLD_COLOR = new THREE.Color(GOLD);
const GOLD_DIM = new THREE.Color(GOLD_DEEP);
const LOOK_AT: [number, number, number] = [0, 0.32, 0];
const STACK_GAP = 0.62;

type StackProps = {
  stack: CoinStack;
  position: [number, number, number];
  active: boolean;
  dimmed: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

function hash(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function CoinStackMesh({ stack, position, active, dimmed, onHover, onSelect }: StackProps) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const lift = useRef(0);
  const display = useRef(GOLD_COLOR.clone());
  const geometry = useMemo(() => createCoinGeometry(), []);
  const count = stack.coins + (stack.remainder > 0.05 ? 1 : 0);

  const matrices = useMemo(() => {
    const dummy = new THREE.Object3D();
    const list: THREE.Matrix4[] = [];
    for (let i = 0; i < count; i += 1) {
      const partial = i === stack.coins;
      const scaleY = partial ? Math.max(stack.remainder, 0.12) : 1;
      dummy.position.set(
        (hash(i + 11) - 0.5) * 0.012,
        i * COIN_PITCH + (partial ? (COIN_THICKNESS * scaleY) / 2 : COIN_THICKNESS / 2),
        (hash(i + 29) - 0.5) * 0.012,
      );
      dummy.rotation.set(
        (hash(i + 3) - 0.5) * 0.04,
        hash(i + 7) * Math.PI * 2,
        (hash(i + 13) - 0.5) * 0.03,
      );
      dummy.scale.set(1, scaleY, 1);
      dummy.updateMatrix();
      list.push(dummy.matrix.clone());
    }
    return list;
  }, [count, stack.coins, stack.remainder]);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    matrices.forEach((matrix, index) => mesh.current!.setMatrixAt(index, matrix));
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  useFrame((_, delta) => {
    lift.current = THREE.MathUtils.damp(lift.current, active ? 0.05 : 0, 8, delta);
    if (group.current) {
      group.current.position.set(position[0], lift.current, position[2]);
    }
    if (material.current) {
      display.current.lerp(dimmed ? GOLD_DIM : GOLD_COLOR, 1 - Math.exp(-10 * delta));
      material.current.color.copy(display.current);
      material.current.roughness = THREE.MathUtils.damp(
        material.current.roughness,
        active ? 0.14 : dimmed ? 0.38 : 0.2,
        8,
        delta,
      );
      material.current.emissiveIntensity = THREE.MathUtils.damp(
        material.current.emissiveIntensity,
        active ? 0.12 : 0.04,
        8,
        delta,
      );
    }
  });

  const hitHeight = Math.max(count * COIN_PITCH, COIN_THICKNESS) + 0.04;

  return (
    <group ref={group} position={position}>
      <instancedMesh ref={mesh} args={[geometry, undefined, Math.max(count, 1)]} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={material}
          color={GOLD}
          metalness={1}
          roughness={0.2}
          clearcoat={0.28}
          clearcoatRoughness={0.22}
          emissive={GOLD}
          emissiveIntensity={0.04}
        />
      </instancedMesh>
      <mesh
        position={[0, hitHeight / 2, 0]}
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
        <cylinderGeometry args={[COIN_RADIUS * 1.12, COIN_RADIUS * 1.12, hitHeight, 16]} />
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
  const layout = useMemo(() => {
    const span = (stacks.length - 1) * STACK_GAP;
    return stacks.map((stack, index) => ({
      stack,
      position: [index * STACK_GAP - span / 2, 0, 0] as [number, number, number],
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
      <ambientLight intensity={0.16} color="#3d2c14" />
      <directionalLight
        position={[2.1, 3.6, 2.4]}
        intensity={2.05}
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
      <ContactShadows position={[0, 0.001, 0]} opacity={0.62} scale={8} blur={2.2} far={3.2} />
      <OrbitControls
        makeDefault
        target={LOOK_AT}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.7}
        maxDistance={5.2}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.48}
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
      camera={{ position: [1.55, 0.92, 2.55], fov: 28, near: 0.1, far: 40 }}
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
