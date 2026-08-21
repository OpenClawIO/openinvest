import * as THREE from "three";

/** World size for a 1 g round: readable as a coin, slightly thicker than a real blank. */
export const COIN_RADIUS = 0.2;
export const COIN_THICKNESS = 0.046;
export const COIN_PITCH = COIN_THICKNESS * 0.9;

export function createCoinGeometry(): THREE.LatheGeometry {
  const r = COIN_RADIUS;
  const h = COIN_THICKNESS / 2;
  const profile = [
    [0, 0.78],
    [0.2, 0.74],
    [0.48, 0.68],
    [0.62, 0.66],
    [0.68, 0.42],
    [0.76, 0.98],
    [0.9, 1],
    [0.97, 0.72],
    [1, 0.4],
    [1, -0.4],
    [0.97, -0.72],
    [0.9, -1],
    [0.76, -0.98],
    [0.68, -0.42],
    [0.62, -0.66],
    [0.48, -0.68],
    [0.2, -0.74],
    [0, -0.78],
  ].map(([x, y]) => new THREE.Vector2(x * r, y * h));

  const geometry = new THREE.LatheGeometry(profile, 96);
  reedEdge(geometry, r, h);
  geometry.computeVertexNormals();
  return geometry;
}

function reedEdge(geometry: THREE.BufferGeometry, radius: number, half: number) {
  const pos = geometry.getAttribute("position");
  const vertex = new THREE.Vector3();
  const reeds = 112;
  const depth = 0.012;

  for (let i = 0; i < pos.count; i += 1) {
    vertex.fromBufferAttribute(pos, i);
    const radial = Math.hypot(vertex.x, vertex.z);
    if (radial < radius * 0.965 || Math.abs(vertex.y) > half * 0.55) continue;
    const angle = Math.atan2(vertex.z, vertex.x);
    const scale = 1 - depth * (0.5 + 0.5 * Math.cos(angle * reeds));
    pos.setXYZ(i, vertex.x * scale, vertex.y, vertex.z * scale);
  }
  pos.needsUpdate = true;
}
