"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import type {
  DefaultLegendContentProps,
  DefaultTooltipContentProps,
  TooltipPayloadEntry,
  TooltipValueType,
} from "recharts";

import { cn } from "@/lib/utils";

const ResponsiveContainer = dynamic(
  () => import("./chart-inner").then((m) => m.ResponsiveContainer),
  {
    ssr: false,
  },
);
const Legend = dynamic(() => import("./chart-inner").then((m) => m.Legend), {
  ssr: false,
});
const Tooltip = dynamic(() => import("./chart-inner").then((m) => m.Tooltip), {
  ssr: false,
});

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

const INITIAL_DIMENSION = { width: 320, height: 200 } as const;
type TooltipNameType = number | string;

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.use(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof ResponsiveContainer>["children"];
  initialDimension?: {
    width: number;
    height: number;
  };
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider
      // oxlint-disable-next-line react/jsx-no-constructed-context-values — value IS memoized via useMemo
      value={React.useMemo(() => ({ config }), [config])}
    >
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <ResponsiveContainer initialDimension={initialDimension}>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const SAFE_CSS_ID = /^[\w-]+$/;
const SAFE_CSS_VAR = /[^a-zA-Z0-9-]/g;

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, config]) => config.theme ?? config.color);

  if (!colorConfig.length) {
    return null;
  }

  const cssId = SAFE_CSS_ID.test(id) ? id : `chart-${id.replace(SAFE_CSS_VAR, "")}`;

  return (
    <style
      // biome-ignore lint/security/noDangerouslySetInnerHtml: chart CSS uses sanitized internal IDs (useId) and developer-defined config colors; key names are stripped of non-CSS-safe chars
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${cssId}] {
${colorConfig
  .flatMap(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ?? itemConfig.color;
    const safeKey = key.replace(SAFE_CSS_VAR, "");
    return color && safeKey ? [`  --color-${safeKey}: ${color};`] : [];
  })
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};

function TooltipLabelContent({
  hideLabel,
  payload,
  labelKey,
  label,
  config,
  labelFormatter,
  labelClassName,
}: {
  hideLabel: boolean;
  payload?: readonly TooltipPayloadEntry[];
  labelKey?: string;
  label?: React.ReactNode;
  config: ChartConfig;
  labelFormatter?: (
    label: React.ReactNode,
    payload: readonly TooltipPayloadEntry[],
  ) => React.ReactNode;
  labelClassName?: string;
}) {
  if (hideLabel || !payload?.length) {
    return null;
  }

  const [item] = payload ?? [];
  const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
  const itemConfig = getPayloadConfigFromPayload(config, item, key);
  const value =
    !labelKey && typeof label === "string" ? (config[label]?.label ?? label) : itemConfig?.label;

  if (labelFormatter) {
    return (
      <div className={cn("font-medium", labelClassName)}>{labelFormatter(value, payload)}</div>
    );
  }

  if (!value) {
    return null;
  }

  return <div className={cn("font-medium", labelClassName)}>{value}</div>;
}

const ChartTooltip = Tooltip;

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  } & Omit<DefaultTooltipContentProps<TooltipValueType, TooltipNameType>, "accessibilityLayer">) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div
      className={cn(
        "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs/relaxed shadow-level-2",
        className,
      )}
    >
      {!nestLabel ? (
        <TooltipLabelContent
          hideLabel={hideLabel}
          payload={payload}
          labelKey={labelKey}
          label={label}
          config={config}
          labelFormatter={labelFormatter}
          labelClassName={labelClassName}
        />
      ) : null}
      <div className="grid gap-1.5">
        {payload.flatMap((item, index) => {
          if (item.type === "none") return [];
          const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const indicatorColor = color ?? item.payload?.fill ?? item.color;

          return [
            <div
              key={`${nameKey ?? item.name ?? item.dataKey ?? index}`}
              className={cn(
                "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                indicator === "dot" && "items-center",
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn(
                          "shrink-0 rounded-sm border-(--color-border) bg-(--color-bg)",
                          {
                            "h-2.5 w-2.5": indicator === "dot",
                            "w-1": indicator === "line",
                            "w-0 border-[1.5px] border-dashed bg-transparent":
                              indicator === "dashed",
                            "my-0.5": nestLabel && indicator === "dashed",
                          },
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center",
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? (
                        <TooltipLabelContent
                          hideLabel={hideLabel}
                          payload={payload}
                          labelKey={labelKey}
                          label={label}
                          config={config}
                          labelFormatter={labelFormatter}
                          labelClassName={labelClassName}
                        />
                      ) : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label ?? item.name}
                      </span>
                    </div>
                    {item.value != null && (
                      <span className="font-medium font-mono text-foreground tabular-nums">
                        {typeof item.value === "number"
                          ? item.value.toLocaleString()
                          : String(item.value)}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>,
          ];
        })}
      </div>
    </div>
  );
}

const ChartLegend = Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: React.ComponentProps<"div"> & {
  hideIcon?: boolean;
  nameKey?: string;
} & DefaultLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  const legendItems: React.ReactNode[] = [];
  for (let index = 0; index < payload.length; index++) {
    const item = payload[index];
    if (item.type === "none") continue;
    const key = `${nameKey ?? item.dataKey ?? "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);

    legendItems.push(
      <div
        key={`${nameKey ?? item.dataKey ?? item.value ?? index}`}
        className={cn(
          "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
        )}
      >
        {itemConfig?.icon && !hideIcon ? (
          <itemConfig.icon />
        ) : (
          <div
            className="size-2 shrink-0 rounded-sm"
            style={{
              backgroundColor: item.color,
            }}
          />
        )}
        {itemConfig?.label}
      </div>,
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
    >
      {legendItems}
    </div>
  );
}

function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload && typeof payload.payload === "object" && payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
};
