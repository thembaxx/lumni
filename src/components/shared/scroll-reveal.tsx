"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "scale" | "none";
  distance?: number;
  duration?: number;
  delay?: number;
  once?: boolean;
  threshold?: number;
  as?: "div" | "section" | "article" | "span";
}

let globalObserver: IntersectionObserver | null = null;
const listeners = new Map<Element, () => void>();

function getGlobalObserver(threshold: number): IntersectionObserver {
  if (!globalObserver) {
    globalObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const cb = listeners.get(entry.target);
          if (cb) cb();
        }
      },
      { threshold },
    );
  }
  return globalObserver;
}

export function ScrollReveal({
  children,
  className,
  direction = "up",
  distance = 24,
  duration = 0.4,
  delay = 0,
  once = true,
  threshold = 0.1,
  as: Tag = "div",
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion) return;

    const observer = getGlobalObserver(threshold);
    const handler = () => {
      setIsVisible(true);
      if (once) {
        listeners.delete(el);
        observer.unobserve(el);
      }
    };
    listeners.set(el, handler);
    observer.observe(el);

    return () => {
      listeners.delete(el);
      observer.unobserve(el);
    };
  }, [once, threshold, prefersReducedMotion]);

  const getTransform = () => {
    if (prefersReducedMotion || direction === "none") return "none";
    switch (direction) {
      case "up":
        return `translateY(${distance}px)`;
      case "down":
        return `translateY(${-distance}px)`;
      case "left":
        return `translateX(${distance}px)`;
      case "right":
        return `translateX(${-distance}px)`;
      case "scale":
        return "scale(0.95)";
      default:
        return "none";
    }
  };

  return (
    <Tag
      ref={ref}
      className={cn(className)}
      style={{
        opacity: isVisible || prefersReducedMotion ? 1 : 0,
        transform: isVisible || prefersReducedMotion ? "none" : getTransform(),
        transition: `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1)`,
        transitionDelay: `${delay}s`,
      }}
    >
      {children}
    </Tag>
  );
}
