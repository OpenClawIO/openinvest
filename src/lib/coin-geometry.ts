import * as THREE from "three";
import type { CoinDenom } from "@/lib/gold";

const UNIT_RADIUS = 0.148;

export function coinRadius(denom: CoinDenom) {
  return UNIT_RADIUS * Math.sqrt(denom);
}

export function coinThickness(denom: CoinDenom) {
  return 0.034 * denom ** 0.22;
}

export function createCoinGeometry(radius: number, thickness: number): THREE.LatheGeometry {
  const h = thickness / 2;
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
  ].map(([x, y]) => new THREE.Vector2(x * radius, y * h));

  const geometry = new THREE.LatheGeometry(profile, 96);
  reedEdge(geometry, radius, h);
  geometry.computeVertexNormals();
  return geometry;
}

export function createStampTexture(grams: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D unavailable for coin stamp");
  }

  const field = ctx.createRadialGradient(size * 0.42, size * 0.38, size * 0.04, size / 2, size / 2, size * 0.5);
  field.addColorStop(0, "#f6e4a8");
  field.addColorStop(0.42, "#e0b75a");
  field.addColorStop(1, "#8a6418");
  ctx.fillStyle = field;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(72, 46, 10, 0.42)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 232, 170, 0.28)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.4 - 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${size * 0.36}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255, 236, 180, 0.28)";
  ctx.fillText(String(grams), size / 2 - 3, size / 2 - size * 0.05);
  ctx.fillStyle = "rgba(62, 38, 8, 0.88)";
  ctx.fillText(String(grams), size / 2, size / 2 - size * 0.04);

  ctx.font = `600 ${size * 0.11}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(62, 38, 8, 0.78)";
  ctx.fillText("g", size / 2, size / 2 + size * 0.2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function reedEdge(geometry: THREE.BufferGeometry, radius: number, half: number) {
  const pos = geometry.getAttribute("position");
  const vertex = new THREE.Vector3();
  const reeds = 112;
  const depth = 0.014;

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
