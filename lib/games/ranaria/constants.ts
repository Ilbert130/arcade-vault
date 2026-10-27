import type { Direction } from "./types";
// Mundo lógico fijo 4:3 (como el resto de juegos); el tablero vertical se centra en él.
export const W = 800;
export const H = 600;
/** Límite de dt por frame (s) para evitar saltos tras un parón. */
export const MAX_DT = 0.05;
// ── Rejilla ───────────────────────────────────────────────────────────────────
export const COLS = 16;
export const ROWS = 14;
export const CELL = 40; // px
export const BOARD_W = COLS * CELL; // 640
export const BOARD_H = ROWS * CELL; // 560
/** Esquina superior izquierda del tablero dentro del mundo 800×600. */
export const BOARD_X = (W - BOARD_W) / 2; // 80
export const BOARD_Y = (H - BOARD_H) / 2; // 20
// ── Zonas (índice de fila, 0 = arriba) ────────────────────────────────────────
export const ROW_GOALS = 0;
export const ROW_RIVER_TOP = 1;
export const ROW_RIVER_BOT = 6;
export const ROW_SAFE_MID = 7;
export const ROW_ROAD_TOP = 8;
export const ROW_ROAD_BOT = 12;
export const ROW_START = 13;
export const START_COL = COLS / 2; // columna central de inicio
// ── Bocas destino: 5 bocas de 2 columnas, con 1 columna de hueco entre ellas ──
export const GOAL_COUNT = 5;
export const GOAL_WIDTH = 2;
/** Columna izquierda de cada boca: 1-2, 4-5, 7-8, 10-11, 13-14. */
export const GOAL_STARTS = [1, 4, 7, 10, 13];
// ── Reglas ────────────────────────────────────────────────────────────────────
export const START_LIVES = 3;
/** Fracción de celda que ocupa la rana en las colisiones (centrada). */
export const FROG_HITBOX = 0.7;
/** Duración del salto de una celda (s). */
export const JUMP_S = 0.12;
/** Tiempo de ronda (s) en el nivel 1 y reducción por nivel (con mínimo). */
export const ROUND_TIME_S = 15;
export const ROUND_TIME_DECREASE_S = 1;
export const ROUND_TIME_MIN_S = 8;
/** Factor global de velocidad de los carriles del nivel 1 (1 = valores del spec convertidos a celdas/s). */
export const SPEED_SCALE = 0.6;
/** Cada nivel acelera todos los carriles un 15 %. */
export const LEVEL_SPEED_FACTOR = 1.15;
/** Ciclo de las tortugas: visibles / bajo el agua (s). */
export const TURTLE_VISIBLE_S = 3;
export const TURTLE_SUBMERGED_S = 1.5;
// ── Puntuación ────────────────────────────────────────────────────────────────
export const POINTS_ROW = 10; // por fila nueva avanzada en la ronda
export const POINTS_GOAL = 50; // por boca ocupada
export const POINTS_ROUND = 200; // por ronda completada
export const POINTS_TIME_MULT = 10; // × segundos restantes, al ocupar una boca
/** Teclas de movimiento (KeyboardEvent.code). */
export const KEY_ACTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
};
