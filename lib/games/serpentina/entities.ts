import {
  CELL,
  COLS,
  FRUITS_SRC,
  FRUIT_ATLAS,
  FRUIT_NAMES,
  H,
  ROWS,
  W,
} from "./constants";
import type { SerpentinaSkin } from "./skins";
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
/**
 * Atlas tintado en un canvas offscreen (una vez por skin, no por frame):
 * conserva el alfa del PNG y sustituye el color por `color` (source-atop).
 */
export function tintAtlas(
  img: HTMLImageElement,
  color: string,
): HTMLCanvasElement | null {
  const off = document.createElement("canvas");
  off.width = img.naturalWidth;
  off.height = img.naturalHeight;
  const octx = off.getContext("2d");
  if (!octx) return null;
  octx.drawImage(img, 0, 0);
  octx.globalCompositeOperation = "source-atop";
  octx.fillStyle = color;
  octx.fillRect(0, 0, off.width, off.height);
  return off;
}
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  skin: SerpentinaSkin,
) {
  ctx.fillStyle = skin.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = skin.grid;
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
  img: CanvasImageSource | null,
  fruit: Fruit,
  skin: SerpentinaSkin,
) {
  const cx = fruit.col * CELL + CELL / 2;
  const cy = fruit.row * CELL + CELL / 2;
  ctx.save();
  if (skin.fruitGlowColor && skin.fruitGlow > 0) {
    ctx.shadowColor = skin.fruitGlowColor;
    ctx.shadowBlur = skin.fruitGlow;
  }
  if (!img || !skin.sprites) {
    ctx.fillStyle = skin.fallbackFruit;
    if (skin.radius === 0) {
      const r = Math.round(CELL * 0.3);
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, CELL * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  const s = FRUIT_ATLAS[fruit.name];
  const box = CELL - 4;
  const scale = Math.min(box / s.w, box / s.h);
  const dw = s.w * scale;
  const dh = s.h * scale;
  if (skin.pixelated) ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, s.x, s.y, s.w, s.h, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}
const PAD = 3;
function cellPath(ctx: CanvasRenderingContext2D, cell: Cell, radius: number) {
  ctx.beginPath();
  const x = cell.col * CELL + PAD;
  const y = cell.row * CELL + PAD;
  const size = CELL - PAD * 2;
  if (radius > 0) ctx.roundRect(x, y, size, size, radius);
  else ctx.rect(x, y, size, size);
}
/** Relleno entre dos segmentos contiguos para que el cuerpo se vea continuo. */
function bridge(ctx: CanvasRenderingContext2D, a: Cell, b: Cell) {
  const x = Math.min(a.col, b.col) * CELL + PAD;
  const y = Math.min(a.row, b.row) * CELL + PAD;
  const w = (Math.abs(a.col - b.col) + 1) * CELL - PAD * 2;
  const h = (Math.abs(a.row - b.row) + 1) * CELL - PAD * 2;
  ctx.fillRect(x, y, w, h);
}
function drawEyes(
  ctx: CanvasRenderingContext2D,
  head: Cell,
  dir: Direction,
  skin: SerpentinaSkin,
) {
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
    const px = x + (horizontal ? 1.5 * sign : 0);
    const py = y + (horizontal ? 0 : 1.5 * sign);
    if (skin.eyeShape === "square") {
      // Ojos de píxel duro, mismo tamaño aparente que los redondos.
      ctx.fillStyle = skin.eyeWhite;
      ctx.fillRect(Math.round(x - 4), Math.round(y - 4), 8, 8);
      ctx.fillStyle = skin.eyePupil;
      ctx.fillRect(Math.round(px - 2), Math.round(py - 2), 4, 4);
      continue;
    }
    ctx.fillStyle = skin.eyeWhite;
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.eyePupil;
    ctx.beginPath();
    ctx.arc(px, py, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
/** Anillos huecos con glow y núcleo blanco (doble pasada); cabeza maciza. */
function drawTube(
  ctx: CanvasRenderingContext2D,
  cells: readonly Cell[],
  skin: SerpentinaSkin,
) {
  ctx.save();
  // Pasada 1: relleno tenue sin glow.
  ctx.fillStyle = skin.tubeFill;
  for (let i = cells.length - 1; i > 0; i--) {
    cellPath(ctx, cells[i], skin.radius);
    ctx.fill();
  }
  // Pasada 2: trazo de color con glow; la cabeza va rellena.
  ctx.shadowColor = skin.glowColor;
  ctx.shadowBlur = skin.glow;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = skin.bodyDark;
  for (let i = cells.length - 1; i > 0; i--) {
    cellPath(ctx, cells[i], skin.radius);
    ctx.stroke();
  }
  ctx.fillStyle = skin.body;
  cellPath(ctx, cells[0], skin.radius);
  ctx.fill();
  // Pasada 3: núcleo blanco fino, sin glow.
  ctx.shadowBlur = 0;
  ctx.lineWidth = 0.75;
  ctx.strokeStyle = skin.tubeCore;
  for (let i = cells.length - 1; i >= 0; i--) {
    cellPath(ctx, cells[i], skin.radius);
    ctx.stroke();
  }
  ctx.restore();
}
/** Serpiente según la skin: `cells[0]` es la cabeza. */
export function drawSnake(
  ctx: CanvasRenderingContext2D,
  cells: readonly Cell[],
  dir: Direction,
  skin: SerpentinaSkin,
) {
  if (skin.snakeStyle === "tube") {
    drawTube(ctx, cells, skin);
    drawEyes(ctx, cells[0], dir, skin);
    return;
  }
  ctx.save();
  ctx.shadowColor = skin.glowColor;
  ctx.shadowBlur = skin.glow;
  // Cuerpo de cola a cabeza; la cabeza queda encima con el color brillante.
  for (let i = cells.length - 1; i >= 0; i--) {
    ctx.fillStyle = i === 0 ? skin.body : skin.bodyDark;
    cellPath(ctx, cells[i], skin.radius);
    ctx.fill();
    if (i > 0) bridge(ctx, cells[i], cells[i - 1]);
  }
  ctx.restore();
  drawEyes(ctx, cells[0], dir, skin);
}
