import {
  BLOCKS_ORIGIN_X,
  BLOCKS_ORIGIN_Y,
  BLOCK_H,
  BLOCK_W,
  EXPLOSION_DURATION,
  EXPLOSION_FRAME_COUNT,
  LEVELS,
  blockSprite,
  explosionFrame,
} from "./constants";
import type { Block, Explosion, Rect, SpriteRect } from "./types";
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
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  s: SpriteRect,
  r: Rect,
) {
  ctx.drawImage(img, s.sx, s.sy, s.sw, s.sh, r.x, r.y, r.w, r.h);
}
export function drawBlock(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  block: Block,
) {
  drawSprite(ctx, img, blockSprite(block.color), block);
}
export function drawExplosion(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  e: Explosion,
) {
  const i = Math.min(
    Math.floor((e.elapsed / EXPLOSION_DURATION) * EXPLOSION_FRAME_COUNT),
    EXPLOSION_FRAME_COUNT - 1,
  );
  drawSprite(ctx, img, explosionFrame(e.color, i), e);
}
