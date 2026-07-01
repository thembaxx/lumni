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

/**
 * Scroll-triggered reveal animation using IntersectionObserver.
 * 2026 trend: scroll-driven animations with spring physics feel.
 */
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
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

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
