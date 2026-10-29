import type { SkinId } from "@/lib/games/platform/skins";
import type { BlockColor } from "./types";
// ── Skins de BLOQUE BUSTER (solo cosméticas: no cambian tamaños, hitbox ni física) ──
/** Patrón interior de un bloque plano (distingue tipos sin depender solo del tono). */
export type BlockPattern = "solid" | "dots" | "stripes" | "frame";
export type BloqueBusterSkin = {
  bg: string;
  /** Rejilla de fondo (null = sin rejilla). */
  grid: string | null;
  gridStep: number;
  /** shadowBlur de bloques, pala, bola y explosiones (0 = sin glow). */
  glow: number;
  /** "sprite": spritesheet original; "neon": tubos con glow; "flat": bloques planos de época. */
  style: "sprite" | "neon" | "flat";
  /** true = se dibuja con el spritesheet (las claves de color se ignoran). */
  sprites: boolean;
  /** Color por tipo de bloque (sigue el tono visible del sprite clásico). */
  colors: Record<BlockColor, string>;
  /** Patrón interior por tipo de bloque (solo "flat"). */
  patterns: Record<BlockColor, BlockPattern>;
  /** Alfa del relleno de bloques y pala en "neon". */
  fillAlpha: number;
  /** Núcleo de la doble pasada en "neon". */
  core: string;
  paddle: string;
  /** Extremos de la pala. */
  paddleCap: string;
  ball: string;
  /** Halo de la bola (solo "neon"). */
  ballGlow: string;
};
export const SKINS: Record<SkinId, BloqueBusterSkin> = {
  // Aspecto original, valor por valor (antes PALETTE.bg + spritesheet tal cual).
  // Las claves de color solo se usan si sprites = false: aquí no afectan al dibujo.
  clasico: {
    bg: "#000000",
    grid: null,
    gridStep: 40,
    glow: 0,
    style: "sprite",
    sprites: true,
    colors: {
      gray: "#8a8fb5",
      red: "#ff006e",
      cyan: "#00ff88",
      green: "#4d7cff",
      magenta: "#b266ff",
      yellow: "#f5ff00",
      hotpink: "#ff8a00",
    },
    patterns: {
      gray: "solid",
      red: "solid",
      cyan: "solid",
      green: "solid",
      magenta: "solid",
      yellow: "solid",
      hotpink: "solid",
    },
    fillAlpha: 1,
    core: "#ffffff",
    paddle: "#e6e9ff",
    paddleCap: "#ff006e",
    ball: "#e6e9ff",
    ballGlow: "transparent",
  },
  // Tubos de neón: contorno de 1.5 px + núcleo blanco, glow 20, relleno translúcido,
  // fondo violeta casi negro con rejilla magenta.
  neon: {
    bg: "#07021a",
    grid: "rgba(255, 0, 110, 0.12)",
    gridStep: 40,
    glow: 20,
    style: "neon",
    sprites: false,
    colors: {
      gray: "#e6e9ff",
      red: "#ff006e",
      cyan: "#00ff88",
      green: "#00f5ff",
      magenta: "#b266ff",
      yellow: "#f5ff00",
      hotpink: "#ff8a00",
    },
    patterns: {
      gray: "solid",
      red: "solid",
      cyan: "solid",
      green: "solid",
      magenta: "solid",
      yellow: "solid",
      hotpink: "solid",
    },
    fillAlpha: 0.16,
    core: "#ffffff",
    paddle: "#00f5ff",
    paddleCap: "#ff006e",
    ball: "#f5ff00",
    ballGlow: "rgba(245, 255, 0, 0.9)",
  },
  // CGA de 8 bits: 4 colores + amarillo, planos, sin glow, bordes duros; los 7 tipos
  // de bloque se distinguen por color + patrón (liso, puntos, rayas, marco).
  retro: {
    bg: "#000000",
    grid: null,
    gridStep: 40,
    glow: 0,
    style: "flat",
    sprites: false,
    colors: {
      gray: "#ffffff",
      red: "#ff55ff",
      cyan: "#55ffff",
      green: "#55ffff",
      magenta: "#ff55ff",
      yellow: "#ffff55",
      hotpink: "#ff55ff",
    },
    patterns: {
      gray: "frame",
      red: "solid",
      cyan: "solid",
      green: "stripes",
      magenta: "stripes",
      yellow: "solid",
      hotpink: "dots",
    },
    fillAlpha: 1,
    core: "#000000",
    paddle: "#ffffff",
    paddleCap: "#ff55ff",
    ball: "#ffff55",
    ballGlow: "transparent",
  },
};
