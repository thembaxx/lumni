"use client";

import { useEffect, useRef, useState } from "react";

interface Dot {
  id: number;
  x: number;
  y: number;
  size: number;
  dur: number;
  delay: number;
  baseX: number;
  baseY: number;
}

export function ParticleField() {
  const [dots, setDots] = useState<Dot[]>([]);
  const [ok, setOk] = useState(false);
  const mouse = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const d: Dot[] = [];
      for (let i = 0; i < 30; i++) {
        d.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2.5 + 1,
          dur: Math.random() * 12 + 18,
          delay: Math.random() * -20,
          baseX: Math.random() * 100,
          baseY: Math.random() * 100,
        });
      }
      setDots(d);
      setOk(true);
    }

    const onMouse = (e: MouseEvent) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMouse);
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  if (!ok || dots.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes dot-drift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(12px, -18px); }
          50% { transform: translate(-8px, -8px); }
          75% { transform: translate(15px, -24px); }
        }
      `}</style>
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        {dots.map((d) => (
          <div
            key={d.id}
            className="absolute rounded-full"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.size,
              height: d.size,
              opacity: 0.08,
              backgroundColor: "var(--system-accent)",
              animation: `dot-drift ${d.dur}s ${d.delay}s infinite ease-in-out`,
              willChange: "transform",
            }}
          />
        ))}
      </div>
    </>
  );
}
