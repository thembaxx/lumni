"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface KineticHeadingProps {
  children: string;
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
  delay?: number;
  staggerMs?: number;
  once?: boolean;
}

export function KineticHeading({
  children,
  as: Tag = "h2",
  className,
  delay = 0,
  staggerMs = 30,
  once = true,
}: KineticHeadingProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLHeadingElement>(null);
  const letters = children.split("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  // If reduced motion, just render the text normally
  if (prefersReducedMotion) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag ref={ref} className={cn("inline-flex flex-wrap", className)} aria-label={children}>
      {letters.map((letter, i) => (
        <span
          key={i}
          className="animate-letter-reveal"
          style={{
            animationDelay: `${delay + i * staggerMs}ms`,
            animationPlayState: isVisible ? "running" : "paused",
          }}
        >
          {letter === " " ? "\u00A0" : letter}
        </span>
      ))}
    </Tag>
  );
}
