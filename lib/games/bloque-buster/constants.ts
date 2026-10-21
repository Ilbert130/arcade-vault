import type { BlockColor, Level, LevelBlock, SpriteRect } from "./types";
// Mundo lógico fijo: la física no depende del tamaño de pantalla.
export const W = 800;
export const H = 600;
/** Límite de dt por frame (s) para evitar saltos tras un parón. */
export const MAX_DT = 0.05;
// ── Reglas (fieles al original) ───────────────────────────────────────────────
export const PADDLE_SPEED = 400;
export const PADDLE_W = 81;
export const PADDLE_H = 14;
export const PADDLE_Y = 560;
export const BALL_SIZE = 16;
export const BASE_BALL_VX = 200;
export const BASE_BALL_VY = -300;
export const START_LIVES = 3;
export const BLOCK_POINTS = 10;
export const BLOCK_COLS = 10;
export const BLOCK_ROWS = 6;
export const BLOCK_W = 64;
export const BLOCK_H = 24;
export const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
export const BLOCKS_ORIGIN_Y = 80;
export const EXPLOSION_DURATION = 150; // ms
export const EXPLOSION_FRAME_COUNT = 4;
// ── Assets (public/games/bloque-buster/) ──────────────────────────────────────
export const SPRITESHEET_SRC = "/games/bloque-buster/spritesheet-breakout.png";
export const BOUNCE_SRC = "/games/bloque-buster/sounds/ball-bounce.mp3";
export const BREAK_SRC = "/games/bloque-buster/sounds/break-sound.mp3";
export const SOUND_VOLUME = 0.4;
export const PADDLE_SPRITE: SpriteRect = { sx: 32, sy: 112, sw: 162, sh: 14 };
export const BALL_SPRITE: SpriteRect = { sx: 32, sy: 32, sw: 16, sh: 16 };
const BLOCK_SHEET_Y: Record<BlockColor, number> = {
  gray: 288,
  red: 176,
  cyan: 192,
  green: 208,
  magenta: 224,
  yellow: 240,
  hotpink: 256,
};
// El gris no tiene explosión propia: usa la roja, como el original.
const EXPLOSION_SHEET_Y: Record<BlockColor, number> = {
  ...BLOCK_SHEET_Y,
  gray: 176,
};
export const blockSprite = (color: BlockColor): SpriteRect => ({
  sx: 32,
  sy: BLOCK_SHEET_Y[color],
  sw: 32,
  sh: 16,
});
export const explosionFrame = (color: BlockColor, i: number): SpriteRect => ({
  sx: 256 + 32 * i,
  sy: EXPLOSION_SHEET_Y[color],
  sw: 32,
  sh: 16,
});
// ── Niveles ───────────────────────────────────────────────────────────────────
function buildLevels(): Level[] {
  const rows1: BlockColor[] = [
    "red",
    "yellow",
    "cyan",
    "magenta",
    "hotpink",
    "green",
  ];
  const rows2: BlockColor[] = [
    "gray",
    "cyan",
    "hotpink",
    "yellow",
    "magenta",
    "green",
  ];
  const rows4: BlockColor[] = [
    "cyan",
    "magenta",
    "green",
    "yellow",
    "hotpink",
    "red",
  ];
  const l1: LevelBlock[] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++)
      l1.push({ col, row, color: rows1[row] });
  const l2: LevelBlock[] = [];
  const pyStart = [4, 3, 2, 1, 0, 0];
  const pyEnd = [5, 6, 7, 8, 9, 9];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = pyStart[row]; col <= pyEnd[row]; col++)
      l2.push({ col, row, color: rows2[row] });
  const l3: LevelBlock[] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++)
      if ((col + row) % 2 === 0)
        l3.push({ col, row, color: row < 3 ? "yellow" : "magenta" });
  const gaps4 = [
    [2, 5, 8],
    [0, 4, 7, 9],
    [1, 3, 6],
    [2, 5, 8, 9],
    [0, 4, 7],
    [1, 3, 6, 9],
  ];
  const l4: LevelBlock[] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++)
      if (!gaps4[row].includes(col)) l4.push({ col, row, color: rows4[row] });
  const l5: LevelBlock[] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++) {
      const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
      const isCross = col === 4 || row === 2;
      if (isFrame || isCross)
        l5.push({
          col,
          row,
          color: isCross && !isFrame ? "hotpink" : "cyan",
        });
    }
  return [
    { speed: 1.0, blocks: l1 },
    { speed: 1.1, blocks: l2 },
    { speed: 1.21, blocks: l3 },
    { speed: 1.33, blocks: l4 },
    { speed: 1.46, blocks: l5 },
  ];
}
export const LEVELS: readonly Level[] = buildLevels();
