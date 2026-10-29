import {
  COLORS,
  COLS,
  KICKS,
  LINE_SCORES,
  PIECE_TYPES,
  ROWS,
} from "./constants";
import type { Board, Matrix, Piece } from "./types";
// ── Piezas (índice = tipo; 0 = vacío): I, O, T, S, Z, J, L y N («tuerca») ─────
const PIECES: readonly (Matrix | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // N (tuerca)
];
// ── Tablero ───────────────────────────────────────────────────────────────────
export const createBoard = (): Board =>
  Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));
/** Pieza aleatoria uniforme entre las 8 (sin bolsa), centrada arriba. */
export const randomPiece = (): Piece => {
  const type = Math.floor(Math.random() * PIECE_TYPES) + 1;
  const shape = (PIECES[type] ?? []).map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
};
export const collide = (
  board: Board,
  shape: Matrix,
  ox: number,
  oy: number,
): boolean => {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
};
export const rotateCW = (shape: Matrix): Matrix => {
  const rows = shape.length;
  const cols = shape[0].length;
  const result: Matrix = Array.from({ length: cols }, () =>
    new Array<number>(rows).fill(0),
  );
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
};
/** Rota en sentido horario probando los wall kicks; devuelve la misma pieza si ninguno cabe. */
export const tryRotate = (board: Board, piece: Piece): Piece => {
  const shape = rotateCW(piece.shape);
  for (const kick of KICKS) {
    if (!collide(board, shape, piece.x + kick, piece.y))
      return { ...piece, shape, x: piece.x + kick };
  }
  return piece;
};
/** Fija la pieza en el tablero (muta `board`). */
export const merge = (board: Board, piece: Piece): void => {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      const v = piece.shape[r][c];
      const by = piece.y + r;
      if (v && by >= 0) board[by][piece.x + c] = v;
    }
  }
};
/** Elimina las filas completas (muta `board`) y devuelve cuántas fueron. */
export const clearLines = (board: Board): number => {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every((v) => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array<number>(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  return cleared;
};
/** Puntos base por `cleared` líneas a la vez, antes de multiplicar por el nivel. */
export const lineScore = (cleared: number): number =>
  LINE_SCORES[cleared as 0 | 1 | 2 | 3 | 4] ?? 0;
/** Fila donde aterrizaría la pieza actual (pieza fantasma). */
export const ghostY = (board: Board, piece: Piece): number => {
  let gy = piece.y;
  while (!collide(board, piece.shape, piece.x, gy + 1)) gy++;
  return gy;
};
// ── Dibujo ────────────────────────────────────────────────────────────────────
/** Dibuja un bloque con su esquina superior izquierda en (px, py) del mundo lógico. */
export const drawBlock = (
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  colorIndex: number,
  size: number,
  alpha = 1,
): void => {
  const color = COLORS[colorIndex];
  if (!color) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fillRect(px + 1, py + 1, size - 2, 4);
  ctx.globalAlpha = 1;
};
