"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DynamicCursorProps {
  variant?: "dot" | "aura";
}

export function DynamicCursor({ variant = "dot" }: DynamicCursorProps) {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setPos({ x: e.clientX, y: e.clientY });
      });
      if (!visible) setVisible(true);
    };
    const onMouseLeave = () => setVisible(false);
    const onMouseEnter = () => setVisible(true);

    const addHover = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, [role=button], input, textarea, select, .cursor-pointer")) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mouseover", addHover);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mouseover", addHover);
      cancelAnimationFrame(rafRef.current);
    };
  }, [visible]);

  if (variant === "aura") {
    return (
      <div
        className={cn(
          "pointer-events-none fixed z-(--z-easter-egg) transition-opacity duration-300",
          !visible && "opacity-0",
        )}
        style={{
          left: pos.x - 100,
          top: pos.y - 100,
          width: 200,
          height: 200,
          background: "radial-gradient(circle, var(--system-accent-alpha-10) 0%, transparent 70%)",
          transform: hovered ? "scale(1.5)" : "scale(1)",
          transition: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-(--z-easter-egg) transition-opacity duration-300",
        !visible && "opacity-0",
      )}
      aria-hidden
    >
      <div
        className="rounded-full bg-(--system-accent) transition-[scale,opacity] duration-200"
        style={{
          width: 8,
          height: 8,
          left: pos.x - 4,
          top: pos.y - 4,
          scale: hovered ? 4 : 1,
          opacity: hovered ? 0.15 : 0.4,
          mixBlendMode: "multiply",
          position: "fixed",
        }}
      />
      <div
        className="rounded-full border border-(--system-accent) transition-[scale,opacity] duration-200"
        style={{
          width: 20,
          height: 20,
          left: pos.x - 10,
          top: pos.y - 10,
          scale: hovered ? 2 : 1,
          opacity: hovered ? 0.6 : 0.3,
          position: "fixed",
        }}
      />
    </div>
  );
}
