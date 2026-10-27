import type { SkinId } from "../skins";
// Mismas claves que la antigua PALETTE, más los ajustes de estilo (glow, contornos, formas).
export type RanariaSkin = {
  bg: string;
  boardBorder: string;
  goalRow: string;
  goalMouth: string;
  goalBorder: string;
  river: string;
  riverWave: string;
  safe: string;
  road: string;
  roadLine: string;
  carColors: string[];
  truckBody: string;
  truckCab: string;
  wheel: string;
  windshield: string;
  log: string;
  logLine: string;
  turtle: string;
  turtleShell: string;
  turtleGhost: string;
  /** Borde punteado de la tortuga sumergida. */
  turtleRing: string;
  frog: string;
  frogDark: string;
  /** Contorno de la rana (null = sin contorno); la separa de troncos y tortugas. */
  frogOutline: string | null;
  eyeWhite: string;
  eyePupil: string;
  hudText: string;
  hudDim: string;
  timeOk: string;
  timeWarn: string;
  timeLow: string;
  /** shadowBlur de entidades y HUD (0 = sin glow). */
  glow: number;
  /** Contorno de vehículos, troncos y tortugas (null = sin contorno). */
  outline: string | null;
  /** Formas de bordes duros (sin redondeo ni círculos) para el aspecto de hardware de época. */
  square: boolean;
};
// ── Clásico: aspecto original, valor por valor ────────────────────────────────
const clasico: RanariaSkin = {
  bg: "#000000",
  boardBorder: "#1f5a30",
  goalRow: "#0b3d1d",
  goalMouth: "#1f7a35",
  goalBorder: "#ffcc33",
  river: "#0a1f5c",
  riverWave: "rgba(120, 170, 255, 0.14)",
  safe: "#14501f",
  road: "#0a0a0a",
  roadLine: "rgba(255, 255, 255, 0.2)",
  carColors: ["#ff3b3b", "#ffd23b", "#3b8bff"],
  truckBody: "#8a8f98",
  truckCab: "#d3d8df",
  wheel: "#15151a",
  windshield: "#bfe8ff",
  log: "#7a4a22",
  logLine: "#4d2c12",
  turtle: "#2fbf5a",
  turtleShell: "#1d8a3f",
  turtleGhost: "rgba(47, 191, 90, 0.35)",
  turtleRing: "#2fbf5a",
  frog: "#5dff7a",
  frogDark: "#2ec24a",
  frogOutline: null,
  eyeWhite: "#ffffff",
  eyePupil: "#000000",
  hudText: "#ffffff",
  hudDim: "#7dff9a",
  timeOk: "#3dff6e",
  timeWarn: "#ffd23b",
  timeLow: "#ff3b3b",
  glow: 0,
  outline: null,
  square: false,
};
// ── Neón: fondo violeta oscuro, colores saturados, glow y núcleo claro ────────
const neon: RanariaSkin = {
  bg: "#07021a",
  boardBorder: "#b266ff",
  goalRow: "#12043a",
  goalMouth: "#06201a",
  goalBorder: "#f5ff00",
  river: "#050a3a",
  riverWave: "rgba(0, 245, 255, 0.3)",
  safe: "#1a0640",
  road: "#0b0420",
  roadLine: "rgba(255, 0, 110, 0.45)",
  carColors: ["#ff006e", "#f5ff00", "#00f5ff"],
  truckBody: "#b266ff",
  truckCab: "#e6e9ff",
  wheel: "#07021a",
  windshield: "#00f5ff",
  log: "#ff7a00",
  logLine: "#ffd9a0",
  turtle: "#00f5ff",
  turtleShell: "#07021a",
  turtleGhost: "rgba(0, 245, 255, 0.15)",
  turtleRing: "#00f5ff",
  frog: "#00ff88",
  frogDark: "#00b862",
  frogOutline: "#ffffff",
  eyeWhite: "#ffffff",
  eyePupil: "#07021a",
  hudText: "#e6e9ff",
  hudDim: "#00ff88",
  timeOk: "#00ff88",
  timeWarn: "#f5ff00",
  timeLow: "#ff006e",
  glow: 18,
  outline: "rgba(255, 255, 255, 0.85)",
  square: false,
};
// ── Retro: monitor ámbar, 5 tonos planos, sin glow, bordes duros ──────────────
const retro: RanariaSkin = {
  bg: "#140b00",
  boardBorder: "#ffb000",
  goalRow: "#140b00",
  goalMouth: "#2b1800",
  goalBorder: "#ffe2a0",
  river: "#2b1800",
  riverWave: "#6b3d00",
  safe: "#6b3d00",
  road: "#140b00",
  roadLine: "#6b3d00",
  carColors: ["#ffb000", "#ffe2a0", "#ffb000"],
  truckBody: "#ffb000",
  truckCab: "#ffe2a0",
  wheel: "#6b3d00",
  windshield: "#140b00",
  log: "#6b3d00",
  logLine: "#ffb000",
  turtle: "#6b3d00",
  turtleShell: "#ffb000",
  turtleGhost: "#2b1800",
  turtleRing: "#ffb000",
  frog: "#ffe2a0",
  frogDark: "#ffb000",
  frogOutline: "#140b00",
  eyeWhite: "#ffffff",
  eyePupil: "#140b00",
  hudText: "#ffe2a0",
  hudDim: "#ffb000",
  timeOk: "#ffb000",
  timeWarn: "#ffe2a0",
  timeLow: "#ffffff",
  glow: 0,
  outline: "#ffb000",
  square: true,
};
export const SKINS: Record<SkinId, RanariaSkin> = { clasico, neon, retro };
