"use client";

import { useEffect, useRef, useState } from "react";
import { logError } from "@/lib/shared/logger";

let cachedHighlighter: React.ComponentType<Record<string, unknown>> | null = null;
let cachedDarkStyle: Record<string, unknown> | null = null;
let cachedLightStyle: Record<string, unknown> | null = null;
let loading: Promise<void> | null = null;

function loadModules(): Promise<void> {
  if (cachedHighlighter) return Promise.resolve();
  if (loading) return loading;
  loading = Promise.all([
    import("react-syntax-highlighter"),
    import("react-syntax-highlighter/dist/esm/styles/prism"),
  ]).then(([highlighterMod, styleMod]) => {
    type HighlighterModule = { Prism: React.ComponentType<Record<string, unknown>> };
    type StyleModule = { oneDark: Record<string, unknown>; oneLight: Record<string, unknown> };
    const hMod = highlighterMod as unknown as HighlighterModule;
    const sMod = styleMod as unknown as StyleModule;
    cachedHighlighter = hMod.Prism;
    cachedDarkStyle = sMod.oneDark;
    cachedLightStyle = sMod.oneLight;
  });
  return loading;
}

export function useLazySyntaxHighlighter(theme: "light" | "dark") {
  const [loaded, setLoaded] = useState(!!cachedHighlighter);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (cachedHighlighter) {
      setLoaded(true);
      return;
    }
    loadModules()
      .then(() => {
        if (mountedRef.current) setLoaded(true);
      })
      .catch((err) => {
        logError("SyntaxHighlighter", err);
        if (mountedRef.current) setLoaded(true);
      });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const style = theme === "dark" ? cachedDarkStyle : cachedLightStyle;

  return {
    SyntaxHighlighter: cachedHighlighter,
    style,
    loaded,
  };
}
