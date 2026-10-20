import {
  BLOCKS_ORIGIN_X,
  BLOCKS_ORIGIN_Y,
  BLOCK_H,
  BLOCK_W,
  EXPLOSION_DURATION,
  EXPLOSION_FRAME_COUNT,
  H,
  LEVELS,
  W,
  blockSprite,
  explosionFrame,
} from "./constants";
import type { BloqueBusterSkin } from "./skins";
import type {
  Ball,
  Block,
  BlockColor,
  Explosion,
  Rect,
  SpriteRect,
} from "./types";
/** Bloques vivos de un nivel (1-indexado). */
export function createBlocks(level: number): Block[] {
  return LEVELS[level - 1].blocks.map((b) => ({
    x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
    y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
    w: BLOCK_W,
    h: BLOCK_H,
    color: b.color,
    alive: true,
  }));
}
export function collideAABB(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}
/** Fotograma de explosión (0..EXPLOSION_FRAME_COUNT-1), común a todas las skins. */
function explosionIndex(e: Explosion): number {
  return Math.min(
    Math.floor((e.elapsed / EXPLOSION_DURATION) * EXPLOSION_FRAME_COUNT),
    EXPLOSION_FRAME_COUNT - 1,
  );
}
// ── Sprites (skin clásica) ────────────────────────────────────────────────────
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  s: SpriteRect,
  r: Rect,
) {
  ctx.drawImage(img, s.sx, s.sy, s.sw, s.sh, r.x, r.y, r.w, r.h);
}
// ── Fondo ─────────────────────────────────────────────────────────────────────
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  skin: BloqueBusterSkin,
) {
  ctx.fillStyle = skin.bg;
  ctx.fillRect(0, 0, W, H);
  if (!skin.grid) return;
  ctx.strokeStyle = skin.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = skin.gridStep; x < W; x += skin.gridStep) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
  }
  for (let y = skin.gridStep; y < H; y += skin.gridStep) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
  }
  ctx.stroke();
}
// ── Neón ──────────────────────────────────────────────────────────────────────
/** Margen del bloque neón cacheado para que quepa el halo. */
export const neonPad = (skin: BloqueBusterSkin) => skin.glow + 4;
/**
 * Bloque neón prerenderizado en un canvas offscreen (una vez por skin, color y
 * dpr; nunca por frame): relleno translúcido, tubo con glow y núcleo blanco.
 */
export function buildNeonBlock(
  color: BlockColor,
  skin: BloqueBusterSkin,
  dpr: number,
): HTMLCanvasElement | null {
  const pad = neonPad(skin);
  const off = document.createElement("canvas");
  off.width = Math.ceil((BLOCK_W + pad * 2) * dpr);
  off.height = Math.ceil((BLOCK_H + pad * 2) * dpr);
  const o = off.getContext("2d");
  if (!o) return null;
  o.setTransform(dpr, 0, 0, dpr, 0, 0);
  const c = skin.colors[color];
  const x = pad + 3;
  const y = pad + 3;
  const w = BLOCK_W - 6;
  const h = BLOCK_H - 6;
  o.globalAlpha = skin.fillAlpha;
  o.fillStyle = c;
  o.fillRect(x, y, w, h);
  o.globalAlpha = 1;
  // Doble trazo con glow (halo más denso) y núcleo blanco fino encima.
  o.shadowColor = c;
  o.shadowBlur = skin.glow;
  o.strokeStyle = c;
  o.lineWidth = 1.5;
  o.strokeRect(x, y, w, h);
  o.strokeRect(x, y, w, h);
  o.shadowBlur = 0;
  o.strokeStyle = skin.core;
  o.lineWidth = 0.6;
  o.strokeRect(x, y, w, h);
  return off;
}
function drawNeonPaddle(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  skin: BloqueBusterSkin,
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, (r.h - 2) / 2);
  ctx.globalAlpha = Math.min(1, skin.fillAlpha * 1.6);
  ctx.fillStyle = skin.paddle;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowColor = skin.paddle;
  ctx.shadowBlur = skin.glow;
  ctx.strokeStyle = skin.paddle;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = skin.core;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // Extremos magenta, como las bandas rojas del sprite clásico.
  ctx.shadowColor = skin.paddleCap;
  ctx.shadowBlur = skin.glow * 0.6;
  ctx.fillStyle = skin.paddleCap;
  ctx.fillRect(r.x + 7, r.y + 3, 3, r.h - 6);
  ctx.fillRect(r.x + r.w - 10, r.y + 3, 3, r.h - 6);
  ctx.restore();
}
function drawNeonBall(
  ctx: CanvasRenderingContext2D,
  b: Ball,
  skin: BloqueBusterSkin,
) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  ctx.save();
  ctx.shadowColor = skin.ballGlow;
  ctx.shadowBlur = skin.glow;
  ctx.fillStyle = skin.ball;
  ctx.beginPath();
  ctx.arc(cx, cy, b.w / 2 - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = skin.core;
  ctx.beginPath();
  ctx.arc(cx, cy, b.w / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawNeonExplosion(
  ctx: CanvasRenderingContext2D,
  e: Explosion,
  skin: BloqueBusterSkin,
) {
  // Onda que se expande y se apaga en 4 pasos (pocas a la vez: glow asumible).
  const i = explosionIndex(e);
  const grow = 2 + i * 3;
  const x = e.x + 3 - grow;
  const y = e.y + 3 - grow;
  const w = e.w - 6 + grow * 2;
  const h = e.h - 6 + grow * 2;
  const c = skin.colors[e.color];
  ctx.save();
  ctx.globalAlpha = 1 - i / EXPLOSION_FRAME_COUNT;
  ctx.shadowColor = c;
  ctx.shadowBlur = skin.glow;
  ctx.strokeStyle = c;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = skin.core;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
// ── Plano de época (retro) ────────────────────────────────────────────────────
function drawFlatBlock(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  color: BlockColor,
  skin: BloqueBusterSkin,
) {
  // 1 px de hueco duro alrededor: la rejilla de bloques se lee sin bisel ni glow.
  const x = r.x + 1;
  const y = r.y + 1;
  const w = r.w - 2;
  const h = r.h - 2;
  ctx.fillStyle = skin.colors[color];
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = skin.core;
  switch (skin.patterns[color]) {
    case "dots":
      for (let px = x + 5; px < x + w - 6; px += 8) {
        ctx.fillRect(px, y + 6, 2, 2);
        ctx.fillRect(px + 4, y + h - 8, 2, 2);
      }
      break;
    case "stripes":
      ctx.fillRect(x + 3, y + 7, w - 6, 2);
      ctx.fillRect(x + 3, y + h - 9, w - 6, 2);
      break;
    case "frame":
      ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
      break;
    case "solid":
      break;
  }
}
function drawFlatPaddle(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  skin: BloqueBusterSkin,
) {
  // Esquinas recortadas en escalón (sin curvas) y extremos de color.
  ctx.fillStyle = skin.paddle;
  ctx.fillRect(r.x, r.y + 2, r.w, r.h - 4);
  ctx.fillRect(r.x + 2, r.y, r.w - 4, r.h);
  ctx.fillStyle = skin.paddleCap;
  ctx.fillRect(r.x + 2, r.y + 2, 8, r.h - 4);
  ctx.fillRect(r.x + r.w - 10, r.y + 2, 8, r.h - 4);
}
function drawFlatBall(
  ctx: CanvasRenderingContext2D,
  b: Ball,
  skin: BloqueBusterSkin,
) {
  // Bola en "cruz" de píxeles: redonda a ojo, sin antialias.
  ctx.fillStyle = skin.ball;
  ctx.fillRect(b.x + 4, b.y, b.w - 8, b.h);
  ctx.fillRect(b.x, b.y + 4, b.w, b.h - 8);
  ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
}
function drawFlatExplosion(
  ctx: CanvasRenderingContext2D,
  e: Explosion,
  skin: BloqueBusterSkin,
) {
  // 4 fotogramas duros: un marco que se encoge hacia el centro, sin transparencias.
  const i = explosionIndex(e);
  const ix = 4 + i * 7;
  const iy = 2 + i * 2;
  const w = e.w - ix * 2;
  const h = e.h - iy * 2;
  ctx.fillStyle = skin.colors[e.color];
  ctx.fillRect(e.x + ix, e.y + iy, w, h);
  ctx.fillStyle = skin.core;
  ctx.fillRect(e.x + ix + 2, e.y + iy + 2, w - 4, h - 4);
}
// ── Entidades según la skin ───────────────────────────────────────────────────
/** Fuentes de dibujo: spritesheet (clásica) y bloques neón cacheados. */
export type DrawSources = {
  sheet: HTMLImageElement;
  neonBlock: (color: BlockColor) => CanvasImageSource | null;
};
export function drawBlock(
  ctx: CanvasRenderingContext2D,
  src: DrawSources,
  block: Block,
  skin: BloqueBusterSkin,
) {
  if (skin.style === "sprite") {
    drawSprite(ctx, src.sheet, blockSprite(block.color), block);
    return;
  }
  if (skin.style === "flat") {
    drawFlatBlock(ctx, block, block.color, skin);
    return;
  }
  const img = src.neonBlock(block.color);
  if (!img) return;
  const pad = neonPad(skin);
  ctx.drawImage(
    img,
    block.x - pad,
    block.y - pad,
    block.w + pad * 2,
    block.h + pad * 2,
  );
}
export function drawExplosion(
  ctx: CanvasRenderingContext2D,
  src: DrawSources,
  e: Explosion,
  skin: BloqueBusterSkin,
) {
  if (skin.style === "sprite")
    drawSprite(ctx, src.sheet, explosionFrame(e.color, explosionIndex(e)), e);
  else if (skin.style === "flat") drawFlatExplosion(ctx, e, skin);
  else drawNeonExplosion(ctx, e, skin);
}
export function drawPaddle(
  ctx: CanvasRenderingContext2D,
  src: DrawSources,
  sprite: SpriteRect,
  paddle: Rect,
  skin: BloqueBusterSkin,
) {
  if (skin.style === "sprite") drawSprite(ctx, src.sheet, sprite, paddle);
  else if (skin.style === "flat") drawFlatPaddle(ctx, paddle, skin);
  else drawNeonPaddle(ctx, paddle, skin);
}
export function drawBall(
  ctx: CanvasRenderingContext2D,
  src: DrawSources,
  sprite: SpriteRect,
  ball: Ball,
  skin: BloqueBusterSkin,
) {
  if (skin.style === "sprite") drawSprite(ctx, src.sheet, sprite, ball);
  else if (skin.style === "flat") drawFlatBall(ctx, ball, skin);
  else drawNeonBall(ctx, ball, skin);
}
