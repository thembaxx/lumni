"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type EasterEgg = "konami" | "rainbow" | "zen" | "retro" | "galaxy" | "spiral";

interface EasterEggState {
  activeEgg: EasterEgg | null;
  trigger: (egg: EasterEgg) => void;
  dismiss: () => void;
  isRainbow: boolean;
  isRetro: boolean;
  isZen: boolean;
  isGalaxy: boolean;
  isSpiral: boolean;
}

const EasterEggContext = createContext<EasterEggState>({
  activeEgg: null,
  trigger: () => {},
  dismiss: () => {},
  isRainbow: false,
  isRetro: false,
  isZen: false,
  isGalaxy: false,
  isSpiral: false,
});

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function EasterEggProvider({ children }: { children: React.ReactNode }) {
  const [activeEgg, setActiveEgg] = useState<EasterEgg | null>(null);
  const konamiIndex = useRef(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === KONAMI[konamiIndex.current]) {
        konamiIndex.current++;
        if (konamiIndex.current === KONAMI.length) {
          setActiveEgg("konami");
          konamiIndex.current = 0;
          setTimeout(() => setActiveEgg(null), 4000);
        }
      } else {
        konamiIndex.current = 0;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const trigger = useCallback((egg: EasterEgg) => {
    setActiveEgg(egg);
    setTimeout(() => setActiveEgg(null), 4000);
  }, []);

  const dismiss = useCallback(() => setActiveEgg(null), []);

  const ctxValue = useMemo(
    () => ({
      activeEgg,
      trigger,
      dismiss,
      isRainbow: activeEgg === "rainbow",
      isRetro: activeEgg === "retro",
      isZen: activeEgg === "zen",
      isGalaxy: activeEgg === "galaxy",
      isSpiral: activeEgg === "spiral",
    }),
    [activeEgg, trigger, dismiss],
  );

  return (
    <EasterEggContext value={ctxValue}>
      {activeEgg === "konami" && <KonamiOverlay />}
      {activeEgg === "rainbow" && <RainbowOverlay />}
      {activeEgg === "zen" && <ZenOverlay />}
      {activeEgg === "retro" && <RetroOverlay />}
      {activeEgg === "galaxy" && <GalaxyOverlay />}
      {activeEgg === "spiral" && <SpiralOverlay />}
      {children}
    </EasterEggContext>
  );
}

export function useEasterEgg() {
  return useContext(EasterEggContext);
}

export function useLogoEasterEgg() {
  const { trigger } = useEasterEgg();
  const count = useRef(0);

  return useCallback(() => {
    count.current++;
    if (count.current === 7) {
      trigger("rainbow");
      count.current = 0;
    }
  }, [trigger]);
}

export function useMoonEasterEgg() {
  const { trigger } = useEasterEgg();
  const count = useRef(0);

  return useCallback(() => {
    count.current++;
    if (count.current === 5) {
      trigger("zen");
      count.current = 0;
    }
  }, [trigger]);
}

function ConfettiParticle({ index }: { index: number }) {
  const colors = [
    "oklch(62% 0.19 145)",
    "oklch(55% 0.22 260)",
    "oklch(72% 0.18 75)",
    "oklch(58% 0.24 25)",
    "oklch(59% 0.23 290)",
    "oklch(62% 0.25 350)",
  ];
  return (
    <div
      className="pointer-events-none fixed animate-float-down"
      style={{
        left: `${Math.random() * 100}vw`,
        top: `-10px`,
        width: `${6 + Math.random() * 6}px`,
        height: `${6 + Math.random() * 6}px`,
        backgroundColor: colors[index % colors.length],
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        animationDuration: `${2 + Math.random() * 3}s`,
        animationDelay: `${Math.random() * 0.5}s`,
        zIndex: 1000,
      }}
    />
  );
}

function KonamiOverlay() {
  const particles = Array.from({ length: 30 }, (_, i) => i);
  return (
    <div className="pointer-events-none fixed inset-0 z-(--z-easter-egg) flex items-center justify-center">
      {particles.map((i) => (
        <ConfettiParticle key={i} index={i} />
      ))}
      <div className="animate-fade-in-scale rounded-2xl bg-black/80 px-8 py-4 text-white text-xl font-bold shadow-2xl backdrop-blur-xl">
        +30 XP — Secret Mode Unlocked!
      </div>
    </div>
  );
}

function RainbowOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-(--z-easter-egg)">
      <div
        className="absolute inset-0 animate-rainbow-shift opacity-[0.08]"
        style={{
          background:
            "linear-gradient(90deg, oklch(50% 0.32 30), oklch(65% 0.24 55), oklch(90% 0.25 100), oklch(80% 0.30 140), oklch(50% 0.25 250), oklch(45% 0.30 295))",
          backgroundSize: "600% 100%",
        }}
      />
      <div className="absolute right-6 bottom-6 animate-fade-in-up rounded-2xl bg-black/70 px-5 py-3 text-white text-sm backdrop-blur-xl">
        Rainbow mode activated
      </div>
    </div>
  );
}

function ZenOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-(--z-easter-egg) flex items-center justify-center">
      <div className="animate-zen-ripple size-75 rounded-full border border-white/20" />
      <div className="animate-zen-ripple delay-300 absolute size-50 rounded-full border border-white/15" />
      <div className="animate-zen-ripple delay-600 absolute size-25 rounded-full border border-white/10" />
      <div className="absolute animate-fade-in-scale text-white/60 text-sm tracking-widest uppercase">
        Breathe
      </div>
    </div>
  );
}

function GalaxyOverlay() {
  const stars = Array.from({ length: 60 }, (_, i) => i);
  return (
    <div className="pointer-events-none fixed inset-0 z-(--z-easter-egg) flex items-center justify-center">
      {stars.map((i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-spiral"
          style={{
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
            opacity: 0.3 + Math.random() * 0.7,
          }}
        />
      ))}
      <div className="animate-fade-in-scale rounded-2xl bg-black/70 px-6 py-3 text-white text-sm font-medium backdrop-blur-xl">
        🌌 Galaxy mode — study among the stars
      </div>
    </div>
  );
}

function SpiralOverlay() {
  const dots = Array.from({ length: 40 }, (_, i) => i);
  return (
    <div className="pointer-events-none fixed inset-0 z-(--z-easter-egg) flex items-center justify-center">
      {dots.map((i) => {
        const angle = (i / dots.length) * 360;
        const radius = 40 + (i / dots.length) * 120;
        return (
          <div
            key={i}
            className="absolute rounded-full animate-float-bob"
            style={{
              width: 6,
              height: 6,
              background: `oklch(55% ${0.1 + (i / dots.length) * 0.2} ${140 + angle})`,
              left: `calc(50% + ${radius * Math.cos((angle * Math.PI) / 180)}px)`,
              top: `calc(50% + ${radius * Math.sin((angle * Math.PI) / 180)}px)`,
              animationDelay: `${(i / dots.length) * 2}s`,
              opacity: 0.6,
            }}
          />
        );
      })}
      <div className="animate-fade-in-scale absolute rounded-2xl bg-black/70 px-6 py-3 text-white text-sm font-medium backdrop-blur-xl">
        Focus mode — breathe & centre
      </div>
    </div>
  );
}

function RetroOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-(--z-easter-egg)">
      <div
        className="absolute inset-0 animate-retro-scan"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
          backgroundSize: "100% 4px",
        }}
      />
    </div>
  );
}
