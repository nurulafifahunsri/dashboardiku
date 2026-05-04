import { ChartColorConfig, SasaranProgram, Year } from "@/types";

const yearlyPalettes = [
  {
    categories: {
      [SasaranProgram.Talenta]: "#17624a",
      [SasaranProgram.Inovasi]: "#197a9a",
      [SasaranProgram.Kontribusi]: "#ce7b34",
      [SasaranProgram.TataKelola]: "#b23b6b",
    },
    target: "#ce7b34",
    realization: "#17624a",
  },
  {
    categories: {
      [SasaranProgram.Talenta]: "#2b6cb0",
      [SasaranProgram.Inovasi]: "#8f4fbf",
      [SasaranProgram.Kontribusi]: "#c2410c",
      [SasaranProgram.TataKelola]: "#0f766e",
    },
    target: "#8f4fbf",
    realization: "#0f766e",
  },
  {
    categories: {
      [SasaranProgram.Talenta]: "#b45309",
      [SasaranProgram.Inovasi]: "#047857",
      [SasaranProgram.Kontribusi]: "#be185d",
      [SasaranProgram.TataKelola]: "#2563eb",
    },
    target: "#b45309",
    realization: "#2563eb",
  },
  {
    categories: {
      [SasaranProgram.Talenta]: "#7c3aed",
      [SasaranProgram.Inovasi]: "#15803d",
      [SasaranProgram.Kontribusi]: "#dc2626",
      [SasaranProgram.TataKelola]: "#0369a1",
    },
    target: "#dc2626",
    realization: "#15803d",
  },
  {
    categories: {
      [SasaranProgram.Talenta]: "#0e7490",
      [SasaranProgram.Inovasi]: "#a16207",
      [SasaranProgram.Kontribusi]: "#6d28d9",
      [SasaranProgram.TataKelola]: "#be123c",
    },
    target: "#a16207",
    realization: "#0e7490",
  },
  {
    categories: {
      [SasaranProgram.Talenta]: "#4d7c0f",
      [SasaranProgram.Inovasi]: "#c026d3",
      [SasaranProgram.Kontribusi]: "#1d4ed8",
      [SasaranProgram.TataKelola]: "#ea580c",
    },
    target: "#ea580c",
    realization: "#1d4ed8",
  },
] satisfies ChartColorConfig[];

export const defaultChartColors: ChartColorConfig = yearlyPalettes[0];

export const generateChartColors = (year: Year | string): ChartColorConfig => {
  const numericYear = Number(year);
  const index = Number.isFinite(numericYear) ? Math.abs(numericYear - 2025) % yearlyPalettes.length : 0;
  return yearlyPalettes[index];
};

export const parseChartColors = (value: unknown, year: Year | string): ChartColorConfig => {
  if (value && typeof value === "object") return value as ChartColorConfig;
  if (typeof value === "string" && value.trim()) {
    try {
      return JSON.parse(value) as ChartColorConfig;
    } catch {
      return generateChartColors(year);
    }
  }
  return generateChartColors(year);
};
