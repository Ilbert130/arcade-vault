import type { SkinId } from "../skins";
// ── Skins de SERPENTINA (solo cosméticas: no cambian rejilla, ritmo ni hitbox) ──
export type SerpentinaSkin = {
  bg: string;
  grid: string;
  /** Cabeza (color brillante). */
  body: string;
  /** Segmentos del cuerpo. */
  bodyDark: string;
  /** Color del halo de la serpiente. */
  glowColor: string;
  /** shadowBlur de la serpiente (0 = sin glow). */
  glow: number;
  eyeWhite: string;
  eyePupil: string;
  fallbackFruit: string;
  /** "solid": segmentos rellenos y unidos; "tube": anillos huecos con núcleo blanco. */
  snakeStyle: "solid" | "tube";
  /** Relleno translúcido de los anillos en "tube". */
  tubeFill: string;
  /** Núcleo blanco de la doble pasada en "tube". */
  tubeCore: string;
  /** Radio de esquina de cada segmento (0 = bloque cuadrado). */
  radius: number;
  eyeShape: "round" | "square";
  /** Halo de la fruta (null = sin halo). */
  fruitGlowColor: string | null;
  fruitGlow: number;
  /** Tinte plano del atlas de frutas (null = sprite original). Se cachea al cargar. */
  fruitTint: string | null;
  /** Escalado sin suavizado (píxel duro). */
  pixelated: boolean;
  sprites: boolean;
};
export const SKINS: Record<SkinId, SerpentinaSkin> = {
  // Aspecto original, valor por valor (antes PALETTE en constants.ts).
  clasico: {
    bg: "#000000",
    grid: "rgba(0, 255, 136, 0.05)",
    body: "#00ff88",
    bodyDark: "#00b862",
    glowColor: "rgba(0, 255, 136, 0.6)",
    glow: 12,
    eyeWhite: "#ffffff",
    eyePupil: "#000000",
    fallbackFruit: "#ff3366",
    snakeStyle: "solid",
    tubeFill: "transparent",
    tubeCore: "#ffffff",
    radius: 10,
    eyeShape: "round",
    fruitGlowColor: null,
    fruitGlow: 0,
    fruitTint: null,
    pixelated: false,
    sprites: true,
  },
  // Tubo de neón: anillos huecos con glow ×2.2, cabeza cian maciza, rejilla magenta.
  neon: {
    bg: "#07021a",
    grid: "rgba(255, 0, 110, 0.12)",
    body: "#00f5ff",
    bodyDark: "#00ff88",
    glowColor: "rgba(0, 255, 136, 0.9)",
    glow: 26,
    eyeWhite: "#ffffff",
    eyePupil: "#07021a",
    fallbackFruit: "#ff006e",
    snakeStyle: "tube",
    tubeFill: "rgba(0, 255, 136, 0.14)",
    tubeCore: "#ffffff",
    radius: 10,
    eyeShape: "round",
    fruitGlowColor: "rgba(255, 0, 110, 0.9)",
    fruitGlow: 18,
    fruitTint: null,
    pixelated: false,
    sprites: true,
  },
  // LCD de 4 tonos tipo Game Boy: fondo claro, serpiente en bloques oscuros, sin glow.
  retro: {
    bg: "#9bbc0f",
    grid: "#8bac0f",
    body: "#0f380f",
    bodyDark: "#306230",
    glowColor: "transparent",
    glow: 0,
    eyeWhite: "#9bbc0f",
    eyePupil: "#0f380f",
    fallbackFruit: "#0f380f",
    snakeStyle: "solid",
    tubeFill: "transparent",
    tubeCore: "#9bbc0f",
    radius: 0,
    eyeShape: "square",
    fruitGlowColor: null,
    fruitGlow: 0,
    fruitTint: "#0f380f",
    pixelated: true,
    sprites: true,
  },
};
