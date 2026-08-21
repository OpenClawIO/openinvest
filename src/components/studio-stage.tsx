"use client";

import { CASH_DENOMS, type CashDenom, type CashKind, type CashPiece } from "@/lib/cash";
import type { DisplayCurrency } from "@/lib/fx";
import {
  createNoteGeometry,
  createNoteTexture,
  NOTE_SIZE,
  notePalette,
  thicknessFor,
} from "@/lib/note-geometry";
import type { CashStack } from "@/lib/studio";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const STUDIO = "#000814";
const LOOK_AT: [number, number, number] = [0, 0.04, 0];
const GROUP_GAP = 2.35;

type LaidPiece = {
  piece: CashPiece;
  x: number;
  z: number;
  rotY: number;
};

function hash(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function layoutPieces(pieces: CashPiece[], currency: DisplayCurrency): LaidPiece[] {
  const { width } = NOTE_SIZE[currency];
  const straps = pieces.filter((piece) => piece.kind !== "note");
  const notes = pieces.filter((piece) => piece.kind === "note");
  const laid: LaidPiece[] = [];

  const strapStep = width * 0.52;
  const strapSpan = Math.max(0, (straps.length - 1) * strapStep);
  straps.forEach((piece, index) => {
    laid.push({
      piece,
      x: index * strapStep - strapSpan / 2,
      z: -0.28,
      rotY: (hash(index + 3) - 0.5) * 0.08,
    });
  });

  const noteStep = width * 0.46;
  const noteSpan = Math.max(0, (notes.length - 1) * noteStep);
  const noteZ = straps.length ? 0.34 : 0;
  notes.forEach((piece, index) => {
    laid.push({
      piece,
      x: index * noteStep - noteSpan / 2,
      z: noteZ + (hash(index + 17) - 0.5) * 0.04,
      rotY: (hash(index + 9) - 0.5) * 0.18,
    });
  });

  return laid;
}

function NoteMesh({
  piece,
  x,
  z,
  rotY,
  currency,
  geometry,
  texture,
  active,
  dimmed,
}: {
  piece: CashPiece;
  x: number;
  z: number;
  rotY: number;
  currency: DisplayCurrency;
  geometry: THREE.ExtrudeGeometry;
  texture: THREE.CanvasTexture;
  active: boolean;
  dimmed: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const paper = useRef<THREE.MeshPhysicalMaterial>(null);
  const face = useRef<THREE.MeshPhysicalMaterial>(null);
  const colors = notePalette(currency, piece.denom);
  const paperColor = useMemo(() => new THREE.Color(colors.paper), [colors.paper]);
  const dimColor = useMemo(() => new THREE.Color(colors.paper).lerp(new THREE.Color(STUDIO), 0.45), [colors.paper]);
  const display = useRef(paperColor.clone());
  const lift = useRef(0);
  const size = NOTE_SIZE[currency];
  const thickness = thicknessFor(piece.kind);

  useFrame((_, delta) => {
    lift.current = THREE.MathUtils.damp(lift.current, active ? 0.03 : 0, 8, delta);
    if (group.current) group.current.position.y = lift.current;
    display.current.lerp(dimmed ? dimColor : paperColor, 1 - Math.exp(-10 * delta));
    if (paper.current) paper.current.color.copy(display.current);
    if (face.current) {
      face.current.color.copy(dimmed ? dimColor : new THREE.Color("#ffffff"));
      face.current.roughness = THREE.MathUtils.damp(face.current.roughness, dimmed ? 0.55 : 0.32, 8, delta);
    }
  });

  return (
    <group ref={group} position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={paper}
          color={colors.paper}
          roughness={0.62}
          metalness={0.04}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, thickness + 0.0008, 0]} renderOrder={1}>
        <planeGeometry args={[size.width * 0.92, size.height * 0.88]} />
        <meshPhysicalMaterial
          ref={face}
          map={texture}
          roughness={0.32}
          metalness={0.06}
        />
      </mesh>
      {piece.kind !== "note" ? (
        <mesh position={[0, thickness * 0.55, 0]}>
          <boxGeometry args={[size.width * 1.04, thickness * 0.16, size.height * 0.2]} />
          <meshStandardMaterial color={colors.band} roughness={0.7} />
        </mesh>
      ) : null}
    </group>
  );
}

function CashGroup({
  stack,
  position,
  currency,
  geometries,
  textures,
  active,
  dimmed,
  onHover,
  onSelect,
}: {
  stack: CashStack;
  position: [number, number, number];
  currency: DisplayCurrency;
  geometries: Record<CashKind, THREE.ExtrudeGeometry>;
  textures: Record<CashDenom, THREE.CanvasTexture>;
  active: boolean;
  dimmed: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const laid = useMemo(() => layoutPieces(stack.pieces, currency), [stack.pieces, currency]);
  const size = NOTE_SIZE[currency];
  const hit = useMemo(() => {
    if (laid.length === 0) return { w: 0.8, d: 0.6 };
    const xs = laid.map((item) => item.x);
    const zs = laid.map((item) => item.z);
    return {
      w: Math.max(...xs) - Math.min(...xs) + size.width + 0.1,
      d: Math.max(...zs) - Math.min(...zs) + size.height + 0.1,
    };
  }, [laid, size.height, size.width]);

  return (
    <group position={position}>
      {laid.map((item, index) => (
        <NoteMesh
          key={`${stack.id}-${item.piece.denom}-${item.piece.kind}-${index}`}
          piece={item.piece}
          x={item.x}
          z={item.z}
          rotY={item.rotY}
          currency={currency}
          geometry={geometries[item.piece.kind]}
          texture={textures[item.piece.denom]}
          active={active}
          dimmed={dimmed}
        />
      ))}
      <mesh
        position={[0, 0.08, 0]}
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
        <boxGeometry args={[hit.w, 0.16, hit.d]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function StillLife({
  stacks,
  currency,
  activeId,
  onHover,
  onSelect,
}: {
  stacks: CashStack[];
  currency: DisplayCurrency;
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const size = NOTE_SIZE[currency];
  const geometries = useMemo(() => {
    const kinds: CashKind[] = ["note", "strap10", "strap100"];
    const map = {} as Record<CashKind, THREE.ExtrudeGeometry>;
    for (const kind of kinds) {
      map[kind] = createNoteGeometry(size.width, size.height, thicknessFor(kind));
    }
    return map;
  }, [size.height, size.width]);

  const textures = useMemo(() => {
    const map = {} as Record<CashDenom, THREE.CanvasTexture>;
    for (const denom of CASH_DENOMS) {
      map[denom] = createNoteTexture(currency, denom);
    }
    return map;
  }, [currency]);

  useLayoutEffect(() => {
    return () => {
      for (const geometry of Object.values(geometries)) geometry.dispose();
      for (const texture of Object.values(textures)) texture.dispose();
    };
  }, [geometries, textures]);

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
        <CashGroup
          key={item.stack.id}
          stack={item.stack}
          position={item.position}
          currency={currency}
          geometries={geometries}
          textures={textures}
          active={activeId === item.stack.id}
          dimmed={activeId != null && activeId !== item.stack.id}
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
      <hemisphereLight args={["#f0e6d4", "#120e0a", 0.42]} />
      <ambientLight intensity={0.28} color="#2a241c" />
      <directionalLight
        position={[1.4, 4.4, 2.2]}
        intensity={2.05}
        color="#fff6ea"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-2.2, 1.8, 1.2]} intensity={0.4} color="#9eb0c8" />
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
  currency,
  activeId,
  onHover,
  onSelect,
}: {
  stacks: CashStack[];
  currency: DisplayCurrency;
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <Environment resolution={256}>
        <Lightformer intensity={2.8} position={[-3, 2.6, 3]} scale={[6, 4, 1]} color="#fff4e4" />
        <Lightformer intensity={0.9} position={[3.2, 1.4, -2]} scale={[4, 3, 1]} color="#9eb4d4" />
      </Environment>
      <Lights />
      <StillLife
        stacks={stacks}
        currency={currency}
        activeId={activeId}
        onHover={onHover}
        onSelect={onSelect}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color={STUDIO} roughness={1} metalness={0} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.58} scale={10} blur={2.4} far={3.2} />
      <OrbitControls
        makeDefault
        target={LOOK_AT}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.8}
        maxDistance={6.2}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.44}
        enableZoom={false}
      />
    </>
  );
}

export function StudioStage({
  stacks,
  currency,
  activeId,
  onHover,
  onSelect,
}: {
  stacks: CashStack[];
  currency: DisplayCurrency;
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
      camera={{ position: [0.45, 1.7, 2.45], fov: 32, near: 0.1, far: 40 }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(...LOOK_AT);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        gl.shadowMap.type = THREE.PCFShadowMap;
      }}
      onPointerMissed={() => onHover(null)}
    >
      <color attach="background" args={[STUDIO]} />
      <AimCamera />
      <Suspense fallback={null}>
        <StudioScene
          stacks={stacks}
          currency={currency}
          activeId={activeId}
          onHover={onHover}
          onSelect={onSelect}
        />
      </Suspense>
    </Canvas>
  );
}
