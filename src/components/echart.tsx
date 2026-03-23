"use client";

import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  HeatmapChart,
  BoxplotChart,
  GaugeChart,
} from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  VisualMapComponent,
  MarkLineComponent,
  MarkPointComponent,
  MarkAreaComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useTheme } from "next-themes";
import type { EChartsOption } from "echarts";
import { useMemo } from "react";

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  HeatmapChart,
  BoxplotChart,
  GaugeChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  VisualMapComponent,
  MarkLineComponent,
  MarkPointComponent,
  MarkAreaComponent,
  CanvasRenderer,
]);

const DARK_THEME = {
  backgroundColor: "transparent",
  textStyle: { color: "#e2e8f0" },
  axisLine: { lineStyle: { color: "#475569" } },
  splitLine: { lineStyle: { color: "#334155" } },
  tooltip: {
    backgroundColor: "rgba(30, 35, 55, 0.95)",
    borderColor: "#475569",
    textStyle: { color: "#e2e8f0" },
  },
};

const LIGHT_THEME = {
  backgroundColor: "transparent",
  textStyle: { color: "#1e293b" },
  axisLine: { lineStyle: { color: "#94a3b8" } },
  splitLine: { lineStyle: { color: "#e2e8f0" } },
  tooltip: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderColor: "#e2e8f0",
    textStyle: { color: "#1e293b" },
  },
};

interface EChartProps {
  option: EChartsOption;
  style?: React.CSSProperties;
  notMerge?: boolean;
  className?: string;
}

export function EChart({
  option,
  style = { width: "100%", height: "400px" },
  notMerge = true,
  className,
}: EChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const themeConfig = isDark ? DARK_THEME : LIGHT_THEME;

  const mergedOption = useMemo(() => {
    const base = {
      backgroundColor: "transparent",
      textStyle: { ...themeConfig.textStyle },
      tooltip: {
        ...themeConfig.tooltip,
        borderRadius: 8,
      },
    };
    return { ...base, ...option };
  }, [option, themeConfig]);

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={mergedOption}
      notMerge={notMerge}
      style={style}
      className={className}
    />
  );
}

export { echarts };
export type { EChartsOption };

// Shared color palette
export const COLORS = {
  cyan: "#22d3ee",
  green: "#4ade80",
  orange: "#fb923c",
  pink: "#f472b6",
  purple: "#a78bfa",
  teal: "#34d399",
  blue: "#60a5fa",
  yellow: "#facc15",
  red: "#f87171",
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  "200km": COLORS.cyan,
  "100km": COLORS.green,
  "50km": COLORS.orange,
};

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return {
    isDark,
    textColor: isDark ? "#e2e8f0" : "#1e293b",
    subTextColor: isDark ? "#94a3b8" : "#64748b",
    borderColor: isDark ? "#334155" : "#e2e8f0",
    bgColor: isDark ? "rgba(30, 35, 55, 0.95)" : "rgba(255, 255, 255, 0.95)",
    gridLineColor: isDark ? "#334155" : "#e2e8f0",
  };
}
