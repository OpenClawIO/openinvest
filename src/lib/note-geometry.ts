import type { CashDenom, CashKind } from "@/lib/cash";
import type { DisplayCurrency } from "@/lib/fx";
import { NOTE_INK, paintNoteFace } from "@/lib/note-art";
import * as THREE from "three";

export const NOTE_SIZE = {
  USD: { width: 1.22, height: 0.52 },
  CNY: { width: 1.14, height: 0.58 },
} as const;

export const NOTE_THICK = 0.009;
export const STRAP10_THICK = 0.1;
export const STRAP100_THICK = 0.48;

export function notePalette(currency: DisplayCurrency, denom: CashDenom) {
  return NOTE_INK[currency][denom];
}

export function thicknessFor(kind: CashKind) {
  if (kind === "strap100") return STRAP100_THICK;
  if (kind === "strap10") return STRAP10_THICK;
  return NOTE_THICK;
}

export function createNoteBody(width: number, height: number, thickness: number, curl: boolean) {
  const radius = Math.min(width, height) * (width / height > 2 ? 0.055 : 0.08);
  const shape = roundedRect(width, height, radius);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: Math.min(0.0024, thickness * 0.22),
    bevelSize: Math.min(0.0032, radius * 0.2),
    bevelSegments: 3,
    curveSegments: 12,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, thickness / 2, 0);
  if (curl) bendPaper(geometry, width, height, thickness * 1.35);
  paintEdge(geometry, "#e4d8c2");
  geometry.computeVertexNormals();
  return geometry;
}

export function createPrintPlane(width: number, height: number, y: number, curl: boolean) {
  const geometry = new THREE.PlaneGeometry(width * 0.965, height * 0.94, 48, 22);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, y, 0);
  if (curl) bendPaper(geometry, width, height, NOTE_THICK * 1.35);
  return geometry;
}

export function createPrintPlaneBack(width: number, height: number, y: number, curl: boolean) {
  const geometry = new THREE.PlaneGeometry(width * 0.965, height * 0.94, 48, 22);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, y, 0);
  if (curl) bendPaper(geometry, width, height, NOTE_THICK * 1.35);
  return geometry;
}

export function createNoteTexture(
  currency: DisplayCurrency,
  denom: CashDenom,
  side: "front" | "back",
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable for note stamp");
  paintNoteFace(ctx, currency, denom, side);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

export function createStackEdgeTexture(currency: DisplayCurrency, denom: CashDenom) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable for stack edge");
  const ink = NOTE_INK[currency][denom];
  for (let y = 0; y < canvas.height; y += 1) {
    const band = y % 5;
    ctx.fillStyle = band === 0 ? ink.paper : ink.cream;
    ctx.fillRect(0, y, canvas.width, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function bendPaper(geometry: THREE.BufferGeometry, width: number, depth: number, amount: number) {
  const pos = geometry.getAttribute("position");
  const vertex = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    vertex.fromBufferAttribute(pos, i);
    const u = vertex.x / (width / 2 || 1);
    const v = vertex.z / (depth / 2 || 1);
    const arch = (1 - u * u) * amount * 0.55;
    const wave = Math.sin(u * Math.PI) * Math.cos(v * Math.PI * 0.5) * amount * 0.5;
    vertex.y += arch + wave;
    pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  pos.needsUpdate = true;
}

function paintEdge(geometry: THREE.BufferGeometry, cream: string) {
  geometry.computeVertexNormals();
  const normal = geometry.getAttribute("normal");
  const color = geometry.getAttribute("position");
  const colors = new Float32Array(color.count * 3);
  const edge = new THREE.Color(cream);
  for (let i = 0; i < color.count; i += 1) {
    const ny = normal.getY(i);
    const t = Math.abs(ny) > 0.62 ? 0 : 1;
    colors[i * 3] = edge.r * (0.35 + 0.65 * t) + (1 - t) * 0.12;
    colors[i * 3 + 1] = edge.g * (0.35 + 0.65 * t) + (1 - t) * 0.1;
    colors[i * 3 + 2] = edge.b * (0.35 + 0.65 * t) + (1 - t) * 0.08;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

function roundedRect(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const w = width;
  const h = height;
  const r = radius;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(x + w, y + h - r);
  shape.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  shape.lineTo(x + r, y + h);
  shape.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + r);
  shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}
