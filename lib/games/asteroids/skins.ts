import type { SkinId } from "@/lib/games/skins";
// ── Skins de ROCAS (solo cosméticas: no tocan tamaños, hitboxes ni HUD) ──────
// Claves de color heredadas de la antigua PALETTE; su papel en el juego:
// cyan = nave y vidas · magenta = asteroides · yellow = balas · green = power-up
// ink = textos del HUD · inkDim = reservado · bg = fondo.
export type AsteroidsSkin = {
  bg: string;
  ink: string;
  inkDim: string;
  cyan: string;
  magenta: string;
  yellow: string;
  green: string;
  /** Partículas de explosión: "r, g, b" (el alfa lo pone la partícula). */
  particleRgb: string;
  /** Llama del propulsor. */
  flame: string;
  /** shadowBlur base de los objetos (0 = sin glow). */
  glow: number;
  /** Halo del texto del HUD. */
  hudShadow: string;
  hudGlow: number;
  /** Grosor base del trazo vectorial (nave/asteroides). */
  lineWidth: number;
  lineJoin: CanvasLineJoin;
  /** Segunda pasada fina sobre cada trazo (null = sin núcleo). */
  core: string | null;
  /** Rejilla de fondo (null = sin rejilla). */
  grid: string | null;
  /** Balas como píxel cuadrado en lugar de punto redondo. */
  squareBullets: boolean;
};
export const SKINS: Record<SkinId, AsteroidsSkin> = {
  // Aspecto original, valor por valor (antigua PALETTE + GLOW 10).
  clasico: {
    bg: "#000000",
    ink: "#e6e9ff", // --ink
    inkDim: "#8a8fb5", // --ink-dim
    cyan: "#00f5ff", // --cyan
    magenta: "#ff006e", // --magenta
    yellow: "#f5ff00", // --yellow
    green: "#00ff88", // --green
    particleRgb: "230, 233, 255",
    flame: "rgba(245, 255, 0, 0.85)",
    glow: 10,
    hudShadow: "rgba(230, 233, 255, 0.55)",
    hudGlow: 6,
    lineWidth: 1.5,
    lineJoin: "round",
    core: null,
    grid: null,
    squareBullets: false,
  },
  // Clásico al extremo: fondo violeta, glow ×2.2, trazo fino con núcleo blanco y rejilla.
  neon: {
    bg: "#07021a",
    ink: "#f4f0ff",
    inkDim: "#b9a6ff",
    cyan: "#00f5ff",
    magenta: "#ff006e",
    yellow: "#f5ff00",
    green: "#00ff88",
    particleRgb: "0, 245, 255",
    flame: "rgba(245, 255, 0, 0.95)",
    glow: 22,
    hudShadow: "rgba(178, 102, 255, 0.9)",
    hudGlow: 12,
    lineWidth: 1.2,
    lineJoin: "round",
    core: "#ffffff",
    grid: "rgba(255, 0, 110, 0.12)",
    squareBullets: false,
  },
  // Monitor vectorial de fósforo verde: monocromo, sin glow, esquinas duras.
  retro: {
    bg: "#0b1a0b",
    ink: "#b6ffb0",
    inkDim: "#1f5e1f",
    cyan: "#b6ffb0", // nave: fósforo claro
    magenta: "#39ff14", // asteroides: fósforo medio
    yellow: "#b6ffb0", // balas: fósforo claro
    green: "#b6ffb0", // power-up: claro + rombo y "3x"
    particleRgb: "57, 255, 20",
    flame: "#39ff14",
    glow: 0,
    hudShadow: "transparent",
    hudGlow: 0,
    lineWidth: 1.5,
    lineJoin: "miter",
    core: null,
    grid: null,
    squareBullets: true,
  },
};
