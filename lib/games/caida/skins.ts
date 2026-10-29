import type { SkinId } from "@/lib/games/platform/skins";
// ── Skins de CAÍDA (solo cosméticas: no tocan tablero, piezas, fantasma ni HUD) ──
// Claves de color heredadas de la antigua PALETTE; su papel en el juego:
// cyan = borde del tablero · ink = cifra de puntuación · green = cifra de líneas
// yellow = cifra de nivel · inkDim = etiquetas · line = marco de SIGUIENTE · bg = fondo.
/** Cómo se pinta cada bloque: plano (clásico), neón con glow precocinado o retro con patrón. */
export type BlockStyle = "flat" | "glow" | "pattern";
/** Patrón interior de un bloque retro (distingue piezas además del tono). */
export type BlockPattern = "solid" | "dot" | "stripes" | "frame";
export type CaidaSkin = {
  bg: string;
  ink: string;
  inkDim: string;
  cyan: string;
  magenta: string;
  yellow: string;
  green: string;
  line: string;
  /** Rejilla del tablero. */
  grid: string;
  gridWidth: number;
  /** Tinte del área del tablero (null = sin tinte). */
  boardTint: string | null;
  /** Color por tipo de pieza (índice 0 = vacío): I, O, T, S, Z, J, L, N. */
  colors: readonly (string | null)[];
  /** Patrón por tipo de pieza (solo `pattern`; índice 0 = vacío). */
  patterns: readonly (BlockPattern | null)[] | null;
  blockStyle: BlockStyle;
  /** Franja superior de brillo de cada bloque (null = sin franja). */
  blockShine: string | null;
  /** shadowBlur de los bloques (solo `glow`, precocinado offscreen). */
  blockGlow: number;
  /** Opacidad de la pieza fantasma. */
  ghostAlpha: number;
  /** shadowBlur del borde del tablero y de las cifras (0 = sin glow). */
  glow: number;
  borderWidth: number;
  /** Núcleo fino sobre el borde y los bloques neón (null = sin núcleo). */
  core: string | null;
};
export const SKINS: Record<SkinId, CaidaSkin> = {
  // Aspecto original, valor por valor (antigua PALETTE + COLORS + GLOW 8 + literales).
  clasico: {
    bg: "#000000",
    ink: "#e6e9ff", // --ink
    inkDim: "#8a8fb5", // --ink-dim
    cyan: "#00f5ff", // --cyan
    magenta: "#ff006e", // --magenta
    yellow: "#f5ff00", // --yellow
    green: "#00ff88", // --green
    line: "rgba(0, 245, 255, 0.18)", // --line
    grid: "rgba(0, 245, 255, 0.18)", // --line
    gridWidth: 0.5,
    boardTint: "rgba(0, 245, 255, 0.03)",
    colors: [
      null,
      "#00f5ff", // I — --cyan
      "#f5ff00", // O — --yellow
      "#b266ff", // T
      "#00ff88", // S — --green
      "#ff006e", // Z — --magenta
      "#4d7cff", // J
      "#d97a3a", // L — --bronze
      "#c7d0e0", // N (tuerca) — --silver
    ],
    patterns: null,
    blockStyle: "flat",
    blockShine: "rgba(255, 255, 255, 0.12)",
    blockGlow: 0,
    ghostAlpha: 0.2,
    glow: 8,
    borderWidth: 1.5,
    core: null,
  },
  // Clásico al extremo: fondo violeta, bloques huecos con glow y núcleo blanco, rejilla magenta.
  neon: {
    bg: "#07021a",
    ink: "#f4f0ff",
    inkDim: "#b9a6ff",
    cyan: "#00f5ff",
    magenta: "#ff006e",
    yellow: "#f5ff00",
    green: "#00ff88",
    line: "rgba(0, 245, 255, 0.45)",
    grid: "rgba(255, 0, 110, 0.12)",
    gridWidth: 0.5,
    boardTint: "rgba(178, 102, 255, 0.05)",
    colors: [
      null,
      "#00f5ff", // I
      "#f5ff00", // O
      "#b266ff", // T
      "#00ff88", // S
      "#ff006e", // Z
      "#4d7cff", // J
      "#ff7a1a", // L
      "#d0d8ff", // N
    ],
    patterns: null,
    blockStyle: "glow",
    blockShine: null,
    blockGlow: 12,
    ghostAlpha: 0.3,
    glow: 18,
    borderWidth: 1.5,
    core: "rgba(255, 255, 255, 0.8)",
  },
  // Monitor de fósforo blanco-azulado (P4) a 4 tonos: sin glow, planos, piezas por tono + patrón.
  retro: {
    bg: "#05080f",
    ink: "#e8f0ff",
    inkDim: "#7fa6e0",
    cyan: "#e8f0ff", // borde: tono claro
    magenta: "#7fa6e0",
    yellow: "#e8f0ff", // nivel: claro
    green: "#7fa6e0", // líneas: medio
    line: "#7fa6e0",
    grid: "#1d2a44",
    gridWidth: 1,
    boardTint: null,
    colors: [
      null,
      "#e8f0ff", // I — claro
      "#7fa6e0", // O — medio
      "#e8f0ff", // T — claro
      "#7fa6e0", // S — medio
      "#e8f0ff", // Z — claro
      "#7fa6e0", // J — medio
      "#e8f0ff", // L — claro
      "#7fa6e0", // N — medio
    ],
    patterns: [
      null,
      "solid", // I
      "solid", // O
      "dot", // T
      "dot", // S
      "stripes", // Z
      "stripes", // J
      "frame", // L
      "frame", // N
    ],
    blockStyle: "pattern",
    blockShine: null,
    blockGlow: 0,
    ghostAlpha: 0.35,
    glow: 0,
    borderWidth: 2,
    core: null,
  },
};
