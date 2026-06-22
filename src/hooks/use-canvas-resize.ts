import { useEffect } from "react";

interface CanvasResizeRefs {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  gradientCacheRef: React.MutableRefObject<CanvasGradient | null>;
  lastWidthRef: React.MutableRefObject<number>;
  needsRedrawRef: React.MutableRefObject<boolean>;
}

export function useCanvasResize(refs: CanvasResizeRefs) {
  const { canvasRef, containerRef, gradientCacheRef, lastWidthRef, needsRedrawRef } = refs;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      gradientCacheRef.current = null;
      lastWidthRef.current = rect.width;
      needsRedrawRef.current = true;
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [canvasRef, containerRef, gradientCacheRef, lastWidthRef, needsRedrawRef]);
}
