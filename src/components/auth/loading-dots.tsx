import * as m from "motion/react-m";

export function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1" role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <m.span
          key={i}
          className="size-2 rounded-full bg-system-accent"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: i * 0.15,
          }}
        />
      ))}
    </span>
  );
}
