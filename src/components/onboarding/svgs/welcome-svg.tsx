"use client";

import * as m from "motion/react-m";

export function WelcomeSVG() {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>Welcome</title>
      <m.g
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <circle cx="120" cy="120" r="100" className="fill-[--system-accent]/5" />
        <circle cx="120" cy="120" r="70" className="fill-[--system-accent]/8" />
      </m.g>

      <m.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        {[
          [60, 50],
          [180, 40],
          [40, 170],
          [195, 180],
          [50, 110],
          [190, 110],
        ].map(([cx, cy], i) => (
          <circle
            key={`dot-${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={3 + (i % 2) * 2}
            className="fill-[--system-accent]"
            opacity={0.3 + i * 0.08}
          >
            <animate
              attributeName="opacity"
              values={`${0.3 + i * 0.08};${0.6 + i * 0.05};${0.3 + i * 0.08}`}
              dur={`${2 + i * 0.5}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </m.g>

      <m.g
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <path
          d="M120 60 L140 95 L120 88 L100 95 Z"
          className="fill-[--system-accent]"
          opacity={0.8}
        />
        <path
          d="M95 100 L120 90 L145 100 L140 130 L120 140 L100 130 Z"
          className="fill-[--system-accent]"
          opacity={0.6}
        />
        <rect
          x="108"
          y="130"
          width="24"
          height="30"
          rx="3"
          className="fill-[--system-accent]"
          opacity={0.4}
        />
        <rect x="112" y="135" width="16" height="6" rx="1" className="fill-white" />
      </m.g>
    </svg>
  );
}
