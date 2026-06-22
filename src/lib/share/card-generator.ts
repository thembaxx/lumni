export type CardType = "quiz" | "exam" | "flashcard";

export interface ShareCardParams {
  score: number;
  total: number;
  percentage: number;
  title: string;
  subtitle: string;
  type: CardType;
}

const GRADIENTS: Record<CardType, [string, string]> = {
  quiz: ["#4f46e5", "#7c3aed"],
  exam: ["#059669", "#10b981"],
  flashcard: ["#d97706", "#f59e0b"],
};

const WIDTH = 600;
const HEIGHT = 315;
const CONTENT_TOP = 70;

function hexToRgb(hex: string): [number, number, number] {
  const val = Number.parseInt(hex.replace("#", ""), 16);
  return [(val >> 16) & 255, (val >> 8) & 255, val & 255];
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawGradientBackground(ctx: CanvasRenderingContext2D, type: CardType) {
  const [c1, c2] = GRADIENTS[type];
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, c1);
  gradient.addColorStop(1, c2);
  ctx.fillStyle = gradient;
  drawRoundedRect(ctx, 0, 0, WIDTH, HEIGHT, 24);
  ctx.fill();
}

function drawGlow(ctx: CanvasRenderingContext2D, type: CardType) {
  const [, c2] = GRADIENTS[type];
  const [r, g, b] = hexToRgb(c2);
  const glow = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 10, WIDTH / 2, HEIGHT / 2, 200);
  glow.addColorStop(0, `rgba(${r},${g},${b},0.15)`);
  glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawHeader(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "500 10px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("LUMNI", WIDTH / 2, 35);
}

function drawPercentage(ctx: CanvasRenderingContext2D, pct: number) {
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 56px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${pct}%`, WIDTH / 2, CONTENT_TOP + 40);
}

function drawDetail(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "400 16px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, WIDTH / 2, CONTENT_TOP + 90);
}

function drawDivider(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo((WIDTH - 120) / 2, CONTENT_TOP + 120);
  ctx.lineTo((WIDTH + 120) / 2, CONTENT_TOP + 120);
  ctx.stroke();
}

function drawTitle(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 18px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, WIDTH / 2, CONTENT_TOP + 160);
}

function drawSubtitle(ctx: CanvasRenderingContext2D, text: string) {
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "400 13px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, WIDTH / 2, CONTENT_TOP + 195);
}

export function generateShareCard(params: ShareCardParams): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  drawGradientBackground(ctx, params.type);
  drawGlow(ctx, params.type);
  drawHeader(ctx);
  drawPercentage(ctx, params.percentage);
  drawDetail(ctx, `${params.score} / ${params.total} Correct`);
  drawDivider(ctx);
  drawTitle(ctx, params.title);
  drawSubtitle(ctx, params.subtitle);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}
