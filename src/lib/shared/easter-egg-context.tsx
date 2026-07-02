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

type EasterEgg = "konami" | "rainbow" | "zen" | "retro";

interface EasterEggState {
  activeEgg: EasterEgg | null;
  trigger: (egg: EasterEgg) => void;
  dismiss: () => void;
  isRainbow: boolean;
  isRetro: boolean;
  isZen: boolean;
}

const EasterEggContext = createContext<EasterEggState>({
  activeEgg: null,
  trigger: () => {},
  dismiss: () => {},
  isRainbow: false,
  isRetro: false,
  isZen: false,
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
    }),
    [activeEgg, trigger, dismiss],
  );

  return (
    <EasterEggContext value={ctxValue}>
      {activeEgg === "konami" && <KonamiOverlay />}
      {activeEgg === "rainbow" && <RainbowOverlay />}
      {activeEgg === "zen" && <ZenOverlay />}
      {activeEgg === "retro" && <RetroOverlay />}
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
  const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7", "#ec4899"];
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
            "linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0077ff, #8b00ff)",
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
