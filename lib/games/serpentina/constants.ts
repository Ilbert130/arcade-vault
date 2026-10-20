import type { Direction, FruitName, SpriteRect } from "./types";
// Mundo lógico fijo: la lógica no depende del tamaño de pantalla.
export const W = 800;
export const H = 600;
/** Límite de dt por frame (s) para evitar saltos tras un parón. */
export const MAX_DT = 0.05;
// ── Rejilla ───────────────────────────────────────────────────────────────────
export const CELL = 40;
export const COLS = W / CELL; // 20
export const ROWS = H / CELL; // 15
export const TOTAL_CELLS = COLS * ROWS; // 300
// ── Reglas ────────────────────────────────────────────────────────────────────
export const START_LENGTH = 3;
export const START_DIRECTION: Direction = "right";
export const FRUIT_POINTS = 10;
export const FRUITS_PER_LEVEL = 5;
/** Máximo de giros encolados entre dos pasos. */
export const MAX_TURN_QUEUE = 2;
export const STEP_START_MS = 140;
export const STEP_MIN_MS = 70;
export const STEP_DECREASE_MS = 5;
export const FRUITS_PER_SPEEDUP = 2;
export const DIRECTION_DELTA: Record<Direction, { dc: number; dr: number }> = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 },
};
export const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};
/** Teclas de movimiento (KeyboardEvent.key en minúsculas para letras). */
export const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};
// ── Assets (public/games/serpentina/) ─────────────────────────────────────────
export const FRUITS_SRC = "/games/serpentina/fruits.png";
// Hoja 3790×442 px, fondo transparente; fila usada y=136–295 (160 px de alto).
export const FRUIT_ATLAS: Record<FruitName, SpriteRect> = {
  banana: { x: 34, y: 136, w: 110, h: 160 },
  orange: { x: 186, y: 136, w: 150, h: 160 },
  grape: { x: 378, y: 136, w: 110, h: 160 },
  garlic: { x: 540, y: 136, w: 130, h: 160 },
  eggplant: { x: 712, y: 136, w: 130, h: 160 },
  strawberry: { x: 894, y: 136, w: 110, h: 160 },
  cherry: { x: 1066, y: 136, w: 110, h: 160 },
  carrot: { x: 1228, y: 136, w: 130, h: 160 },
  mushroom: { x: 1400, y: 136, w: 130, h: 160 },
  broccoli: { x: 1582, y: 136, w: 110, h: 160 },
  watermelon: { x: 1734, y: 136, w: 150, h: 160 },
  pepper: { x: 1906, y: 136, w: 150, h: 160 },
  kiwi: { x: 2068, y: 136, w: 170, h: 160 },
  lemon: { x: 2250, y: 136, w: 140, h: 160 },
  peach: { x: 2432, y: 136, w: 130, h: 160 },
  peanut: { x: 2604, y: 136, w: 130, h: 160 },
  apple: { x: 2786, y: 136, w: 110, h: 160 },
  tomato: { x: 2948, y: 136, w: 130, h: 160 },
  berries: { x: 3110, y: 136, w: 150, h: 160 },
  grapes2: { x: 3302, y: 136, w: 110, h: 160 },
  pineapple: { x: 3454, y: 136, w: 150, h: 160 },
  melon: { x: 3637, y: 136, w: 130, h: 160 },
};
export const FRUIT_NAMES = Object.keys(FRUIT_ATLAS) as FruitName[];
// La paleta vive en ./skins.ts (SKINS.clasico es el aspecto original).
