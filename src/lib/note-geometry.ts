import type { CashDenom, CashKind } from "@/lib/cash";
import type { DisplayCurrency } from "@/lib/fx";
import * as THREE from "three";

export const NOTE_SIZE = {
  USD: { width: 1.18, height: 0.5 },
  CNY: { width: 1.12, height: 0.56 },
} as const;

export const NOTE_THICK = 0.012;
export const STRAP10_THICK = 0.12;
export const STRAP100_THICK = 0.54;

const PALETTE: Record<
  DisplayCurrency,
  Record<CashDenom, { paper: string; ink: string; edge: string; band: string }>
> = {
  USD: {
    100: { paper: "#1c5c3c", ink: "#e7f4ea", edge: "#0d2f1e", band: "#c4a24a" },
    50: { paper: "#6a3d52", ink: "#f4e4ea", edge: "#351c28", band: "#c4a24a" },
    20: { paper: "#3a6844", ink: "#e4f0e6", edge: "#1b3322", band: "#c4a24a" },
    10: { paper: "#8a6b2a", ink: "#f6edd4", edge: "#433310", band: "#c4a24a" },
    5: { paper: "#4a5164", ink: "#e8ebf2", edge: "#262a36", band: "#c4a24a" },
    1: { paper: "#4c6a58", ink: "#e8f0ea", edge: "#24362c", band: "#c4a24a" },
  },
  CNY: {
    100: { paper: "#8d1f2f", ink: "#f6e6c8", edge: "#430e16", band: "#e8d090" },
    50: { paper: "#1c6a48", ink: "#e4f4ea", edge: "#0c3324", band: "#e8d090" },
    20: { paper: "#7a4c28", ink: "#f4e8d6", edge: "#3c2412", band: "#e8d090" },
    10: { paper: "#1c4c7a", ink: "#dce8f6", edge: "#0c2440", band: "#e8d090" },
    5: { paper: "#5a3d6a", ink: "#eee2f4", edge: "#2c1e36", band: "#e8d090" },
    1: { paper: "#6a5a32", ink: "#f2ead8", edge: "#362e18", band: "#e8d090" },
  },
};

export function notePalette(currency: DisplayCurrency, denom: CashDenom) {
  return PALETTE[currency][denom];
}

export function thicknessFor(kind: CashKind) {
  if (kind === "strap100") return STRAP100_THICK;
  if (kind === "strap10") return STRAP10_THICK;
  return NOTE_THICK;
}

export function createNoteGeometry(width: number, height: number, thickness: number) {
  const radius = Math.min(width, height) * 0.08;
  const shape = roundedRect(width, height, radius);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: Math.min(0.003, thickness * 0.18),
    bevelSize: Math.min(0.004, radius * 0.18),
    bevelSegments: 2,
    curveSegments: 8,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, thickness / 2, 0);
  geometry.computeVertexNormals();
  return geometry;
}

export function createNoteTexture(currency: DisplayCurrency, denom: CashDenom): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable for note stamp");
  const colors = PALETTE[currency][denom];

  ctx.fillStyle = colors.paper;
  roundFill(ctx, 0, 0, width, height, 36);

  ctx.strokeStyle = colors.ink;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 10;
  roundStroke(ctx, 28, 24, width - 56, height - 48, 28);
  ctx.lineWidth = 3;
  roundStroke(ctx, 48, 42, width - 96, height - 84, 22);
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i += 1) {
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, 210 + i * 28, 92 + i * 14, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = colors.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${height * 0.09}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(currency === "CNY" ? "人民币" : "USD", width / 2, height * 0.2);

  ctx.font = `700 ${height * 0.38}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(currency === "CNY" ? `${denom}` : `$${denom}`, width / 2, height * 0.52);

  ctx.font = `600 ${height * 0.1}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(currency === "CNY" ? "元" : "DOLLARS", width / 2, height * 0.78);

  ctx.font = `700 ${height * 0.12}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(String(denom), 72, 86);
  ctx.textAlign = "right";
  ctx.fillText(String(denom), width - 72, height - 78);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
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

function roundFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function roundStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
}
