"use client";

import { useEffect, useRef } from "react";

type ParticleShape = "circle" | "square" | "star" | "spark";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: ParticleShape;
  rotation: number;
  angularVel: number;
  opacity: number;
  decay: number;
  gravity: number;
}

const COLORS = [
  "oklch(64.8% 0.173 142°)",
  "oklch(78.6% 0.156 80°)",
  "oklch(69.6% 0.196 49°)",
  "oklch(62.2% 0.195 348°)",
  "oklch(57.7% 0.184 264°)",
  "oklch(53.5% 0.182 286°)",
  "oklch(66.4% 0.125 186°)",
  "oklch(58.1% 0.226 14°)",
];

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? size : size * 0.4;
    const angle = (Math.PI * i) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
    else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function CanvasConfetti({
  trigger,
  count = 50,
  duration = 2000,
  shapes = ["circle", "square", "star", "spark"],
}: {
  trigger: boolean;
  count?: number;
  duration?: number;
  shapes?: ParticleShape[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef(0);

  useEffect(() => {
    if (!trigger) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const decay = 1 / (duration / 16);
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 4 + Math.random() * 10;
      particles.push({
        x: w / 2 + (Math.random() - 0.5) * w * 0.4,
        y: h / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        size: 3 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        rotation: Math.random() * Math.PI * 2,
        angularVel: (Math.random() - 0.5) * 0.5,
        opacity: 1,
        decay: decay * (0.5 + Math.random() * 0.5),
        gravity: 0.15 + Math.random() * 0.1,
      });
    }
    particlesRef.current = particles;

    function frame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      let alive = false;
      for (const p of particles) {
        if (p.opacity <= 0) continue;
        alive = true;

        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.angularVel;
        p.vx *= 0.98;
        p.opacity -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        switch (p.shape) {
          case "circle": {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case "square": {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
            break;
          }
          case "star": {
            drawStar(ctx, p.x, p.y, p.size, p.rotation);
            break;
          }
          case "spark": {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.opacity) * 0.3;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.size * 3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.15, 0, Math.PI * 2);
            ctx.fillStyle = "oklch(100% 0 0)";
            ctx.fill();
            ctx.restore();
            break;
          }
        }

        ctx.restore();
      }

      if (alive) {
        animFrameRef.current = requestAnimationFrame(frame);
      }
    }

    animFrameRef.current = requestAnimationFrame(frame);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      particlesRef.current = [];
    };
  }, [trigger, count, duration, shapes]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-modal"
      aria-hidden="true"
    />
  );
}

export { CanvasConfetti as Confetti };
