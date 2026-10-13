import {
  CELL,
  COLS,
  FRUITS_SRC,
  FRUIT_ATLAS,
  FRUIT_NAMES,
  H,
  PALETTE,
  ROWS,
  W,
} from "./constants";
import type { Cell, Direction, Fruit } from "./types";
export type FruitsImage = {
  img: HTMLImageElement;
  /** Cancela callbacks pendientes (para destroy()). */
  dispose: () => void;
};
/** Carga fruits.png para una instancia de motor (nada a nivel de módulo). */
export function loadFruitsImage(
  onLoad: () => void,
  onError: () => void,
): FruitsImage {
  const img = new Image();
  img.onload = onLoad;
  img.onerror = onError;
  img.src = FRUITS_SRC;
  return {
    img,
    dispose: () => {
      img.onload = null;
      img.onerror = null;
    },
  };
}
export function cellEquals(a: Cell, b: Cell): boolean {
  return a.col === b.col && a.row === b.row;
}
/** Fruta aleatoria en una celda que no esté ocupada; null si no queda ninguna. */
export function spawnFruit(
  occupied: readonly Cell[],
  rand: () => number = Math.random,
): Fruit | null {
  const taken = new Set(occupied.map((c) => c.row * COLS + c.col));
  const free: number[] = [];
  for (let i = 0; i < COLS * ROWS; i++) if (!taken.has(i)) free.push(i);
  if (free.length === 0) return null;
  const idx = free[Math.floor(rand() * free.length)];
  return {
    col: idx % COLS,
    row: Math.floor(idx / COLS),
    name: FRUIT_NAMES[Math.floor(rand() * FRUIT_NAMES.length)],
  };
}
export function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = PALETTE.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let c = 1; c < COLS; c++) {
    ctx.moveTo(c * CELL + 0.5, 0);
    ctx.lineTo(c * CELL + 0.5, H);
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.moveTo(0, r * CELL + 0.5);
    ctx.lineTo(W, r * CELL + 0.5);
  }
  ctx.stroke();
}
/** Dibuja la fruta escalada para caber en la celda sin deformarse. */
export function drawFruit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  fruit: Fruit,
) {
  const cx = fruit.col * CELL + CELL / 2;
  const cy = fruit.row * CELL + CELL / 2;
  if (!img) {
    ctx.fillStyle = PALETTE.fallbackFruit;
    ctx.beginPath();
    ctx.arc(cx, cy, CELL * 0.3, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const s = FRUIT_ATLAS[fruit.name];
  const box = CELL - 4;
  const scale = Math.min(box / s.w, box / s.h);
  const dw = s.w * scale;
  const dh = s.h * scale;
  ctx.drawImage(img, s.x, s.y, s.w, s.h, cx - dw / 2, cy - dh / 2, dw, dh);
}
const PAD = 3;
const RADIUS = 10;
function roundedCell(ctx: CanvasRenderingContext2D, cell: Cell) {
  ctx.beginPath();
  ctx.roundRect(
    cell.col * CELL + PAD,
    cell.row * CELL + PAD,
    CELL - PAD * 2,
    CELL - PAD * 2,
    RADIUS,
  );
  ctx.fill();
}
/** Relleno entre dos segmentos contiguos para que el cuerpo se vea continuo. */
function bridge(ctx: CanvasRenderingContext2D, a: Cell, b: Cell) {
  const x = Math.min(a.col, b.col) * CELL + PAD;
  const y = Math.min(a.row, b.row) * CELL + PAD;
  const w = (Math.abs(a.col - b.col) + 1) * CELL - PAD * 2;
  const h = (Math.abs(a.row - b.row) + 1) * CELL - PAD * 2;
  ctx.fillRect(x, y, w, h);
}
function drawEyes(ctx: CanvasRenderingContext2D, head: Cell, dir: Direction) {
  const cx = head.col * CELL + CELL / 2;
  const cy = head.row * CELL + CELL / 2;
  const fwd = 7; // desplazamiento hacia donde mira
  const side = 8; // separación entre ojos
  const horizontal = dir === "left" || dir === "right";
  const sign = dir === "right" || dir === "down" ? 1 : -1;
  const ex = horizontal ? cx + fwd * sign : cx;
  const ey = horizontal ? cy : cy + fwd * sign;
  for (const k of [-1, 1]) {
    const x = horizontal ? ex : ex + side * k;
    const y = horizontal ? ey + side * k : ey;
    ctx.fillStyle = PALETTE.eyeWhite;
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.eyePupil;
    ctx.beginPath();
    ctx.arc(
      x + (horizontal ? 1.5 * sign : 0),
      y + (horizontal ? 0 : 1.5 * sign),
      2.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}
/** Serpiente neón: `cells[0]` es la cabeza. */
export function drawSnake(
  ctx: CanvasRenderingContext2D,
  cells: readonly Cell[],
  dir: Direction,
) {
  ctx.save();
  ctx.shadowColor = PALETTE.glow;
  ctx.shadowBlur = 12;
  // Cuerpo de cola a cabeza; la cabeza queda encima con el color brillante.
  for (let i = cells.length - 1; i >= 0; i--) {
    ctx.fillStyle = i === 0 ? PALETTE.body : PALETTE.bodyDark;
    roundedCell(ctx, cells[i]);
    if (i > 0) bridge(ctx, cells[i], cells[i - 1]);
  }
  ctx.restore();
  drawEyes(ctx, cells[0], dir);
}
