import { useEffect } from "react";

interface ProcessingAnimationRefs {
  containerRef: React.RefObject<HTMLDivElement | null>;
  historyRef: React.MutableRefObject<number[]>;
  processingAnimationRef: React.MutableRefObject<number | null>;
  lastActiveDataRef: React.MutableRefObject<number[]>;
  transitionProgressRef: React.MutableRefObject<number>;
  staticBarsRef: React.MutableRefObject<number[]>;
  needsRedrawRef: React.MutableRefObject<boolean>;
}

interface ProcessingAnimationValues {
  processing: boolean;
  active: boolean;
  barWidth: number;
  barGap: number;
  mode: "scrolling" | "static";
}

export function useProcessingAnimation(
  refs: ProcessingAnimationRefs,
  values: ProcessingAnimationValues,
) {
  const {
    containerRef,
    historyRef,
    processingAnimationRef,
    lastActiveDataRef,
    transitionProgressRef,
    staticBarsRef,
    needsRedrawRef,
  } = refs;
  const { processing, active, barWidth, barGap, mode } = values;

  useEffect(() => {
    const animRef = processingAnimationRef;
    let cancelled = false;

    if (processing && !active) {
      let time = 0;
      transitionProgressRef.current = 0;

      const animateProcessing = () => {
        if (cancelled) return;
        time += 0.03;
        transitionProgressRef.current = Math.min(1, transitionProgressRef.current + 0.02);

        const processingData = [];
        const barCount = Math.floor(
          (containerRef.current?.getBoundingClientRect().width || 200) / (barWidth + barGap),
        );

        if (mode === "static") {
          const halfCount = Math.floor(barCount / 2);

          for (let i = 0; i < barCount; i++) {
            const normalizedPosition = (i - halfCount) / halfCount;
            const centerWeight = 1 - Math.abs(normalizedPosition) * 0.4;

            const wave1 = Math.sin(time * 1.5 + normalizedPosition * 3) * 0.25;
            const wave2 = Math.sin(time * 0.8 - normalizedPosition * 2) * 0.2;
            const wave3 = Math.cos(time * 2 + normalizedPosition) * 0.15;
            const combinedWave = wave1 + wave2 + wave3;
            const processingValue = (0.2 + combinedWave) * centerWeight;

            let finalValue = processingValue;
            if (lastActiveDataRef.current.length > 0 && transitionProgressRef.current < 1) {
              const lastDataIndex = Math.min(i, lastActiveDataRef.current.length - 1);
              const lastValue = lastActiveDataRef.current[lastDataIndex] || 0;
              finalValue =
                lastValue * (1 - transitionProgressRef.current) +
                processingValue * transitionProgressRef.current;
            }

            processingData.push(Math.max(0.05, Math.min(1, finalValue)));
          }
        } else {
          for (let i = 0; i < barCount; i++) {
            const normalizedPosition = (i - barCount / 2) / (barCount / 2);
            const centerWeight = 1 - Math.abs(normalizedPosition) * 0.4;

            const wave1 = Math.sin(time * 1.5 + i * 0.15) * 0.25;
            const wave2 = Math.sin(time * 0.8 - i * 0.1) * 0.2;
            const wave3 = Math.cos(time * 2 + i * 0.05) * 0.15;
            const combinedWave = wave1 + wave2 + wave3;
            const processingValue = (0.2 + combinedWave) * centerWeight;

            let finalValue = processingValue;
            if (lastActiveDataRef.current.length > 0 && transitionProgressRef.current < 1) {
              const lastDataIndex = Math.floor((i / barCount) * lastActiveDataRef.current.length);
              const lastValue = lastActiveDataRef.current[lastDataIndex] || 0;
              finalValue =
                lastValue * (1 - transitionProgressRef.current) +
                processingValue * transitionProgressRef.current;
            }

            processingData.push(Math.max(0.05, Math.min(1, finalValue)));
          }
        }

        if (mode === "static") {
          staticBarsRef.current = processingData;
        } else {
          historyRef.current = processingData;
        }

        needsRedrawRef.current = true;
        animRef.current = requestAnimationFrame(animateProcessing);
      };

      animateProcessing();

      return () => {
        cancelled = true;
        if (animRef.current) {
          cancelAnimationFrame(animRef.current);
        }
      };
    } else if (!active && !processing) {
      const hasData =
        mode === "static" ? staticBarsRef.current.length > 0 : historyRef.current.length > 0;

      if (hasData) {
        let fadeProgress = 0;
        let fadeAnimId: number;
        const fadeToIdle = () => {
          if (cancelled) return;
          fadeProgress += 0.03;
          if (fadeProgress < 1) {
            if (mode === "static") {
              staticBarsRef.current = staticBarsRef.current.map(
                (value) => value * (1 - fadeProgress),
              );
            } else {
              historyRef.current = historyRef.current.map((value) => value * (1 - fadeProgress));
            }
            needsRedrawRef.current = true;
            fadeAnimId = requestAnimationFrame(fadeToIdle);
          } else {
            if (mode === "static") {
              staticBarsRef.current = [];
            } else {
              historyRef.current = [];
            }
          }
        };
        fadeToIdle();

        return () => {
          cancelled = true;
          if (fadeAnimId) {
            cancelAnimationFrame(fadeAnimId);
          }
        };
      }
    }

    return () => {
      cancelled = true;
    };
  }, [
    processing,
    active,
    barWidth,
    barGap,
    mode,
    processingAnimationRef,
    lastActiveDataRef,
    transitionProgressRef,
    staticBarsRef,
    historyRef,
    containerRef,
    needsRedrawRef,
  ]);
}
