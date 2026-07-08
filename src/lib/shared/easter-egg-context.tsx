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

type EasterEgg = "konami" | "rainbow" | "zen" | "retro" | "galaxy" | "spiral" | "party" | "matrix";

interface EasterEggState {
  activeEgg: EasterEgg | null;
  trigger: (egg: EasterEgg) => void;
  dismiss: () => void;
  isRainbow: boolean;
  isRetro: boolean;
  isZen: boolean;
  isGalaxy: boolean;
  isSpiral: boolean;
  isParty: boolean;
  isMatrix: boolean;
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
  isParty: false,
  isMatrix: false,
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
  const typeBuffer = useRef("");

  const flashEgg = useCallback((egg: EasterEgg) => {
    setActiveEgg(egg);
    setTimeout(() => setActiveEgg((cur) => (cur === egg ? null : cur)), 4000);
  }, []);

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

      // Hidden typable triggers — ignored while typing into form fields.
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      typeBuffer.current = (typeBuffer.current + e.key.toLowerCase()).slice(-12);
      if (typeBuffer.current.includes("lumni")) {
        typeBuffer.current = "";
        flashEgg("party");
      } else if (typeBuffer.current.includes("matrix")) {
        typeBuffer.current = "";
        flashEgg("matrix");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flashEgg]);

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
      isParty: activeEgg === "party",
      isMatrix: activeEgg === "matrix",
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
      {activeEgg === "party" && <PartyOverlay />}
      {activeEgg === "matrix" && <MatrixOverlay />}
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

function PartyOverlay() {
  const hue = Math.floor(Math.random() * 360);
  return (
    <div className="pointer-events-none fixed inset-0 z-(--z-easter-egg) overflow-hidden">
      <div
        className="absolute inset-0 animate-rainbow-shift"
        style={{
          background:
            "conic-gradient(from 0deg, oklch(60% 0.28 0), oklch(70% 0.24 55), oklch(80% 0.25 120), oklch(70% 0.30 200), oklch(60% 0.28 280), oklch(60% 0.28 0))",
          backgroundSize: "200% 200%",
          opacity: 0.1,
          filter: `hue-rotate(${hue}deg)`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-bounce-pop rounded-2xl bg-black/70 px-6 py-3 text-white text-sm font-medium backdrop-blur-xl shadow-level-3">
          🎉 Party mode — you found it! Type anything to keep the vibe going
        </div>
      </div>
    </div>
  );
}

function MatrixOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const chars = "abcdefghijklmnopqrstuvwxyz0123456789@#$%&*<>/\\|".split("");
    const fontSize = 16;
    let columns = Math.floor(canvas.width / fontSize);
    const drops = Array.from({ length: columns }, () => Math.random() * -canvas.height);

    let raf = 0;
    const draw = () => {
      ctx.fillStyle = "rgba(4, 8, 12, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "oklch(72% 0.26 146)";
      ctx.font = `${fontSize}px ui-monospace, monospace`;
      columns = Math.floor(canvas.width / fontSize);
      for (let i = 0; i < columns; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] ?? 0;
        ctx.fillText(text, x, y);
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i] = y + fontSize;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-(--z-easter-egg) bg-black/80">
      <canvas ref={canvasRef} className="h-full w-full opacity-80" />
      <div className="absolute right-6 bottom-6 rounded-2xl bg-black/70 px-5 py-3 text-emerald-300 text-sm backdrop-blur-xl">
        The Matrix has you… wake up by pressing any key
      </div>
    </div>
  );
}
