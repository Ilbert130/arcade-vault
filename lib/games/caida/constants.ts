// Mundo lógico fijo: la física y la dificultad no dependen del tamaño de pantalla.
export const W = 800;
export const H = 600;
/** Límite de dt por frame (s) para evitar saltos tras un parón. */
export const MAX_DT = 0.05;
// ── Tablero ───────────────────────────────────────────────────────────────────
export const COLS = 10;
export const ROWS = 20;
export const BLOCK = 30;
export const BOARD_W = COLS * BLOCK; // 300
export const BOARD_H = ROWS * BLOCK; // 600
/** Tablero centrado en el canvas; los paneles quedan a los lados. */
export const BOARD_X = (W - BOARD_W) / 2; // 250
export const BOARD_Y = 0;
// ── Paneles laterales ─────────────────────────────────────────────────────────
export const PANEL_PAD = 24;
export const LEFT_PANEL_X = PANEL_PAD; // mini-HUD (puntuación, líneas, nivel)
export const LEFT_PANEL_W = BOARD_X - PANEL_PAD * 2; // 202
export const RIGHT_PANEL_X = BOARD_X + BOARD_W + PANEL_PAD; // 574
export const RIGHT_PANEL_W = W - RIGHT_PANEL_X - PANEL_PAD; // 202
export const NEXT_BOX = 4; // la vista previa ocupa una rejilla de 4×4 bloques
export const NEXT_BLOCK = 30;
// ── Reglas (fieles al original) ───────────────────────────────────────────────
export const LINE_SCORES = [0, 100, 300, 500, 800] as const;
export const SOFT_DROP_POINTS = 1; // por fila
export const HARD_DROP_POINTS = 2; // por celda
export const LINES_PER_LEVEL = 10;
export const BASE_DROP_MS = 1000;
export const LEVEL_STEP_MS = 90;
export const MIN_DROP_MS = 100;
/** Desplazamientos horizontales probados al rotar, en orden. */
export const KICKS = [0, -1, 1, -2, 2] as const;
export const PIECE_TYPES = 8;
// Colores, glow y opacidad del fantasma viven en ./skins.ts (SKINS.clasico = aspecto original).
