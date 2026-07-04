"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface KineticTextProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
  className?: string;
  letterClassName?: string;
  staggerDelay?: number;
  mode?: "letter" | "word" | "line";
  threshold?: number;
}

export function KineticText({
  text,
  as: Tag = "h1",
  className,
  letterClassName,
  staggerDelay = 60,
  mode = "letter",
  threshold = 0.2,
}: KineticTextProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const items = mode === "word" ? text.split(" ") : mode === "line" ? text.split("\n") : [...text];

  return (
    <Tag ref={ref as never} className={cn("inline", className)}>
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className={cn(
            "inline-block",
            mode === "letter" && item === " " && "w-[0.25em]",
            letterClassName,
          )}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.9)",
            filter: visible ? "blur(0)" : "blur(4px)",
            transition: `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * staggerDelay}ms, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * staggerDelay}ms, filter 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * staggerDelay}ms`,
          }}
        >
          {mode === "word" ? `${item}\u00A0` : item}
        </span>
      ))}
    </Tag>
  );
}
