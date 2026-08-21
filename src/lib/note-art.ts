import type { CashDenom } from "@/lib/cash";
import type { DisplayCurrency } from "@/lib/fx";

export const NOTE_INK: Record<
  DisplayCurrency,
  Record<CashDenom, { paper: string; ink: string; inkSoft: string; cream: string; band: string }>
> = {
  USD: {
    100: { paper: "#1a4f38", ink: "#d7ecdc", inkSoft: "#8fbf9c", cream: "#e6dcc8", band: "#c4a24a" },
    50: { paper: "#5c3a4c", ink: "#f0dde6", inkSoft: "#c49aac", cream: "#e6dcc8", band: "#c4a24a" },
    20: { paper: "#355c40", ink: "#dceadd", inkSoft: "#8fb896", cream: "#e6dcc8", band: "#c4a24a" },
    10: { paper: "#7a6028", ink: "#f3ead0", inkSoft: "#c4b07a", cream: "#e6dcc8", band: "#c4a24a" },
    5: { paper: "#43485c", ink: "#e4e7f0", inkSoft: "#9aa3b8", cream: "#e6dcc8", band: "#c4a24a" },
    1: { paper: "#456352", ink: "#e4eee6", inkSoft: "#9ab8a4", cream: "#e6dcc8", band: "#c4a24a" },
  },
  CNY: {
    100: { paper: "#8a1c2c", ink: "#f4e2c0", inkSoft: "#e0b47a", cream: "#f0e4d0", band: "#e8d090" },
    50: { paper: "#1a5f42", ink: "#e2f2e8", inkSoft: "#8fc9a8", cream: "#f0e4d0", band: "#e8d090" },
    20: { paper: "#734626", ink: "#f2e4d0", inkSoft: "#d2b090", cream: "#f0e4d0", band: "#e8d090" },
    10: { paper: "#1a4874", ink: "#d8e6f4", inkSoft: "#8ab0d4", cream: "#f0e4d0", band: "#e8d090" },
    5: { paper: "#533862", ink: "#ece0f2", inkSoft: "#c4a4d0", cream: "#f0e4d0", band: "#e8d090" },
    1: { paper: "#64542e", ink: "#f0e8d4", inkSoft: "#c8bc90", cream: "#f0e4d0", band: "#e8d090" },
  },
};

const USD_WORDS: Record<CashDenom, string> = {
  1: "ONE",
  5: "FIVE",
  10: "TEN",
  20: "TWENTY",
  50: "FIFTY",
  100: "ONE HUNDRED",
};

const CNY_WORDS: Record<CashDenom, string> = {
  1: "壹圆",
  5: "伍圆",
  10: "拾圆",
  20: "贰拾圆",
  50: "伍拾圆",
  100: "壹佰圆",
};

export function paintNoteFace(
  ctx: CanvasRenderingContext2D,
  currency: DisplayCurrency,
  denom: CashDenom,
  side: "front" | "back",
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const ink = NOTE_INK[currency][denom];
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = ink.paper;
  roundRect(ctx, 0, 0, w, h, h * 0.08);
  ctx.fill();
  if (currency === "USD") paintUsd(ctx, w, h, denom, side, ink);
  else paintCny(ctx, w, h, denom, side, ink);
}

function paintUsd(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  denom: CashDenom,
  side: "front" | "back",
  ink: (typeof NOTE_INK)["USD"][CashDenom],
) {
  frame(ctx, w, h, ink.ink, 14, h * 0.055);
  microLineFrame(ctx, w, h, ink.inkSoft, 22);
  guilloche(ctx, w / 2, h / 2, Math.min(w, h) * 0.42, ink.inkSoft, 0.22, 7);

  const ovalW = w * 0.22;
  const ovalH = h * 0.58;
  ctx.save();
  ctx.strokeStyle = ink.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, ovalW, ovalH, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, ovalW * 0.86, ovalH * 0.86, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  guilloche(ctx, w / 2, h / 2, ovalH * 0.72, ink.ink, 0.35, 11);

  ctx.fillStyle = ink.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${h * 0.07}px "Times New Roman", "Noto Serif", serif`;
  ctx.fillText(side === "front" ? "US DOLLAR" : "UNITED STATES", w / 2, h * 0.11);
  ctx.font = `700 ${h * 0.28}px "Times New Roman", "Noto Serif", serif`;
  ctx.fillText(`$${denom}`, w / 2, h * 0.48);
  ctx.font = `600 ${h * 0.075}px "Times New Roman", "Noto Serif", serif`;
  ctx.fillText(USD_WORDS[denom], w / 2, h * 0.72);
  ctx.font = `500 ${h * 0.045}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(side === "front" ? "OPENINVEST BOOK" : "DELAYED CLOSE SNAPSHOT", w / 2, h * 0.86);

  cornerDenom(ctx, w, h, `$${denom}`, ink.ink, "serif");
  serial(ctx, w, h, ink.ink, `OI ${String(denom).padStart(4, "0")} 0819`);

  if (side === "front") {
    ctx.save();
    ctx.strokeStyle = ink.inkSoft;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(w * 0.18, h * 0.12);
    ctx.lineTo(w * 0.18, h * 0.88);
    ctx.stroke();
    ctx.restore();
  }
}

function paintCny(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  denom: CashDenom,
  side: "front" | "back",
  ink: (typeof NOTE_INK)["CNY"][CashDenom],
) {
  frame(ctx, w, h, ink.ink, 16, h * 0.07);
  keyFret(ctx, 28, 24, w - 56, h - 48, ink.inkSoft);
  peony(ctx, w * 0.5, h * 0.5, h * 0.28, ink.inkSoft);

  ctx.strokeStyle = ink.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.5, h * 0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.5, h * 0.24, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = ink.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${h * 0.09}px "Songti SC", "Noto Serif SC", serif`;
  ctx.fillText(side === "front" ? "人民币" : "中国货币", w / 2, h * 0.14);
  ctx.font = `700 ${h * 0.26}px "Songti SC", "Noto Serif SC", serif`;
  ctx.fillText(String(denom), w / 2, h * 0.46);
  ctx.font = `600 ${h * 0.08}px "Songti SC", "Noto Serif SC", serif`;
  ctx.fillText(CNY_WORDS[denom], w / 2, h * 0.7);
  ctx.font = `500 ${h * 0.045}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(side === "front" ? "OPENINVEST 账本" : "日终快照", w / 2, h * 0.86);

  cornerDenom(ctx, w, h, String(denom), ink.ink, "cjk");
  serial(ctx, w, h, ink.ink, `OI ${String(denom).padStart(4, "0")} 0819`);

  ctx.save();
  ctx.fillStyle = ink.ink;
  ctx.globalAlpha = 0.9;
  ctx.font = `700 ${h * 0.16}px "Songti SC", "Noto Serif SC", serif`;
  ctx.textAlign = "left";
  ctx.fillText("¥", w * 0.08, h * 0.5);
  ctx.textAlign = "right";
  ctx.fillText("¥", w * 0.92, h * 0.5);
  ctx.restore();
}

function frame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  inset: number,
  radius: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  roundStroke(ctx, inset, inset * 0.85, w - inset * 2, h - inset * 1.7, radius);
  ctx.lineWidth = 2;
  roundStroke(ctx, inset + 14, inset * 0.85 + 12, w - inset * 2 - 28, h - inset * 1.7 - 24, radius * 0.82);
}

function microLineFrame(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, inset: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    const p = inset + i * 3;
    ctx.strokeRect(p, p * 0.7, w - p * 2, h - p * 1.4);
  }
  ctx.restore();
}

function guilloche(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  alpha: number,
  petals: number,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1.1;
  const R = radius;
  const r = radius / (petals / 2.2);
  const d = radius * 0.42;
  ctx.beginPath();
  const steps = 720;
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * Math.PI * 2 * 6;
    const x = cx + (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const y = cy + (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i <= 240; i += 1) {
    const t = (i / 240) * Math.PI * 2;
    const x = cx + Math.cos(t) * radius * 0.34 * Math.cos(petals * t);
    const y = cy + Math.sin(t) * radius * 0.34;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function peony(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.4;
  for (let ring = 0; ring < 4; ring += 1) {
    const petals = 8 + ring * 2;
    const r = radius * (0.35 + ring * 0.16);
    ctx.beginPath();
    for (let i = 0; i <= petals * 16; i += 1) {
      const t = (i / (petals * 16)) * Math.PI * 2;
      const wave = 0.72 + 0.28 * Math.cos(petals * t);
      const x = cx + Math.cos(t) * r * wave;
      const y = cy + Math.sin(t) * r * wave;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function keyFret(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 2;
  const step = 18;
  for (let px = x; px < x + w; px += step) {
    ctx.strokeRect(px, y, step * 0.7, 8);
    ctx.strokeRect(px, y + h - 8, step * 0.7, 8);
  }
  for (let py = y; py < y + h; py += step) {
    ctx.strokeRect(x, py, 8, step * 0.7);
    ctx.strokeRect(x + w - 8, py, 8, step * 0.7);
  }
  ctx.restore();
}

function cornerDenom(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  label: string,
  color: string,
  kind: "serif" | "cjk",
) {
  ctx.fillStyle = color;
  ctx.font = `700 ${h * 0.11}px ${kind === "cjk" ? '"Songti SC", "Noto Serif SC", serif' : '"Times New Roman", serif'}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(label, w * 0.055, h * 0.16);
  ctx.fillText(label, w * 0.055, h * 0.84);
  ctx.textAlign = "right";
  ctx.fillText(label, w * 0.945, h * 0.16);
  ctx.fillText(label, w * 0.945, h * 0.84);
}

function serial(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, text: string) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.font = `500 ${h * 0.04}px ui-monospace, SFMono-Regular, monospace`;
  ctx.textAlign = "left";
  ctx.fillText(text, w * 0.2, h * 0.2);
  ctx.textAlign = "right";
  ctx.fillText(text, w * 0.8, h * 0.8);
  ctx.globalAlpha = 1;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
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
