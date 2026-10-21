import {
  BALL_SIZE,
  BALL_SPRITE,
  BASE_BALL_VX,
  BASE_BALL_VY,
  BLOCK_POINTS,
  BOUNCE_SRC,
  BREAK_SRC,
  EXPLOSION_DURATION,
  H,
  LEVELS,
  MAX_DT,
  PADDLE_H,
  PADDLE_SPEED,
  PADDLE_SPRITE,
  PADDLE_W,
  PADDLE_Y,
  SOUND_VOLUME,
  SPRITESHEET_SRC,
  START_LIVES,
  W,
} from "./constants";
import { DEFAULT_SKIN, type SkinId } from "../skins";
import {
  buildNeonBlock,
  collideAABB,
  createBlocks,
  drawBackground,
  drawBall,
  drawBlock,
  drawExplosion,
  drawPaddle,
  type DrawSources,
} from "./entities";
import { SKINS } from "./skins";
import type {
  Ball,
  Block,
  BlockColor,
  BloqueBusterAction,
  BloqueBusterCallbacks,
  BloqueBusterGame,
  BloqueBusterHud,
  Explosion,
  Rect,
} from "./types";
type Phase = "idle" | "playing" | "paused" | "gameover";
const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "Space"]);
/** Traducción tecla → acción del motor. */
const KEY_ACTIONS: Record<string, BloqueBusterAction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
};
const isAction = (a: string): a is BloqueBusterAction =>
  a === "left" || a === "right";
export function createBloqueBusterGame(
  canvas: HTMLCanvasElement,
  callbacks: BloqueBusterCallbacks,
  initialSkin: SkinId = DEFAULT_SKIN,
): BloqueBusterGame {
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("Canvas 2D no disponible");
  const ctx: CanvasRenderingContext2D = ctxOrNull;
  // ── Estado (privado al closure) ─────────────────────────────────────────────
  const paddle: Rect = { x: 0, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H };
  const ball: Ball = { x: 0, y: 0, w: BALL_SIZE, h: BALL_SIZE, vx: 0, vy: 0 };
  let blocks: Block[] = [];
  let explosions: Explosion[] = [];
  let score = 0;
  let lives = START_LIVES;
  let level = 1;
  let phase: Phase = "idle";
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let dpr = 0;
  let listening = false;
  let destroyed = false;
  let gameOverEmitted = false;
  let lastHud: BloqueBusterHud | null = null;
  const keys = { left: false, right: false };
  let skinId: SkinId = initialSkin;
  // ── Assets (por instancia, nada a nivel de módulo) ──────────────────────────
  const sheet = new Image();
  let sheetReady = false;
  let bounceSound: HTMLAudioElement | null = null;
  let breakSound: HTMLAudioElement | null = null;
  // Bloques neón prerenderizados por skin+color; se invalidan si cambia el dpr.
  const blockCache = new Map<string, CanvasImageSource | null>();
  const sources: DrawSources = {
    sheet,
    neonBlock(color: BlockColor) {
      const key = `${skinId}:${color}`;
      if (!blockCache.has(key))
        blockCache.set(key, buildNeonBlock(color, SKINS[skinId], dpr));
      return blockCache.get(key) ?? null;
    },
  };
  function play(sound: HTMLAudioElement | null) {
    if (!sound) return;
    const clone = sound.cloneNode() as HTMLAudioElement;
    clone.volume = SOUND_VOLUME;
    clone.play().catch(() => {});
  }
  // ── HUD hacia React ─────────────────────────────────────────────────────────
  function emitHud() {
    if (
      lastHud &&
      lastHud.score === score &&
      lastHud.lives === lives &&
      lastHud.level === level
    )
      return;
    lastHud = { score, lives, level };
    callbacks.onHud(lastHud);
  }
  // ── Lógica ──────────────────────────────────────────────────────────────────
  function placeBall() {
    const speed = LEVELS[level - 1].speed;
    ball.x = paddle.x + (paddle.w - ball.w) / 2;
    ball.y = paddle.y - ball.h;
    ball.vx = BASE_BALL_VX * speed;
    ball.vy = BASE_BALL_VY * speed;
  }
  function loadLevel(n: number) {
    level = n;
    blocks = createBlocks(n);
    explosions = [];
    placeBall();
  }
  function resetState() {
    score = 0;
    lives = START_LIVES;
    paddle.x = (W - paddle.w) / 2;
    releaseAll();
    gameOverEmitted = false;
    loadLevel(1);
  }
  function update(dt: number) {
    if (phase !== "playing" || !sheetReady) return;
    if (keys.left) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
    if (keys.right)
      paddle.x = Math.min(W - paddle.w, paddle.x + PADDLE_SPEED * dt);
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    // Paredes y techo
    if (ball.x <= 0) {
      ball.x = 0;
      ball.vx = Math.abs(ball.vx);
      play(bounceSound);
    }
    if (ball.x + ball.w >= W) {
      ball.x = W - ball.w;
      ball.vx = -Math.abs(ball.vx);
      play(bounceSound);
    }
    if (ball.y <= 0) {
      ball.y = 0;
      ball.vy = Math.abs(ball.vy);
      play(bounceSound);
    }
    // Pala
    if (
      ball.vy > 0 &&
      ball.x + ball.w > paddle.x &&
      ball.x < paddle.x + paddle.w &&
      ball.y + ball.h >= paddle.y &&
      ball.y + ball.h <= paddle.y + paddle.h + 8
    ) {
      ball.y = paddle.y - ball.h;
      ball.vy = -Math.abs(ball.vy);
      play(bounceSound);
    }
    // Bloques (uno por frame)
    for (const block of blocks) {
      if (!block.alive || !collideAABB(ball, block)) continue;
      block.alive = false;
      explosions.push({
        x: block.x,
        y: block.y,
        w: block.w,
        h: block.h,
        color: block.color,
        elapsed: 0,
      });
      score += BLOCK_POINTS;
      ball.vy = -ball.vy;
      play(breakSound);
      if (blocks.every((b) => !b.alive)) {
        if (level < LEVELS.length) loadLevel(level + 1);
        else phase = "gameover";
      }
      break;
    }
    for (const e of explosions) e.elapsed += dt * 1000;
    explosions = explosions.filter((e) => e.elapsed < EXPLOSION_DURATION);
    // Bola perdida
    if (phase === "playing" && ball.y > H) {
      lives--;
      if (lives <= 0) {
        lives = 0;
        phase = "gameover";
      } else {
        placeBall();
      }
    }
  }
  // ── Input ───────────────────────────────────────────────────────────────────
  function press(action: string) {
    if (phase !== "playing" || !isAction(action)) return;
    keys[action] = true;
  }
  function release(action: string) {
    if (isAction(action)) keys[action] = false;
  }
  function releaseAll() {
    keys.left = false;
    keys.right = false;
  }
  function onKeyDown(e: KeyboardEvent) {
    if (phase !== "playing") return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    const action = KEY_ACTIONS[e.code];
    if (action) press(action);
  }
  function onKeyUp(e: KeyboardEvent) {
    if (GAME_KEYS.has(e.code) && phase === "playing") e.preventDefault();
    const action = KEY_ACTIONS[e.code];
    if (action) release(action);
  }
  function onMouseMove(e: MouseEvent) {
    if (phase !== "playing") return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const mouseX = ((e.clientX - rect.left) * W) / rect.width;
    paddle.x = Math.max(0, Math.min(W - paddle.w, mouseX - paddle.w / 2));
  }
  // ── Draw ────────────────────────────────────────────────────────────────────
  function syncResolution() {
    const nextDpr = window.devicePixelRatio || 1;
    if (nextDpr === dpr) return;
    dpr = nextDpr;
    blockCache.clear();
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  function draw() {
    syncResolution();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const skin = SKINS[skinId];
    drawBackground(ctx, skin);
    // La partida no arranca hasta que carga el spritesheet en ninguna skin
    // (update lo exige); las vectoriales solo pueden mostrar antes el tablero.
    if (skin.sprites && !sheetReady) return;
    for (const block of blocks)
      if (block.alive) drawBlock(ctx, sources, block, skin);
    for (const e of explosions) drawExplosion(ctx, sources, e, skin);
    drawPaddle(ctx, sources, PADDLE_SPRITE, paddle, skin);
    drawBall(ctx, sources, BALL_SPRITE, ball, skin);
  }
  // ── Bucle ───────────────────────────────────────────────────────────────────
  function loop(ts: number) {
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, MAX_DT);
    lastTime = ts;
    update(dt);
    emitHud();
    draw();
    if (phase === "gameover") {
      rafId = null;
      if (!gameOverEmitted) {
        gameOverEmitted = true;
        callbacks.onGameOver(score);
      }
      return;
    }
    rafId = requestAnimationFrame(loop);
  }
  function ensureLoop() {
    if (rafId !== null) return;
    lastTime = null;
    rafId = requestAnimationFrame(loop);
  }
  function addListeners() {
    if (listening) return;
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousemove", onMouseMove);
    listening = true;
  }
  sheet.onload = () => {
    sheetReady = true;
    if (!destroyed && rafId === null) draw();
  };
  sheet.src = SPRITESHEET_SRC;
  // Estado inicial visible antes de empezar.
  resetState();
  draw();
  return {
    start() {
      resetState();
      bounceSound ??= new Audio(BOUNCE_SRC);
      breakSound ??= new Audio(BREAK_SRC);
      phase = "playing";
      lastTime = null;
      emitHud();
      addListeners();
      ensureLoop();
    },
    pause() {
      if (phase !== "playing") return;
      phase = "paused";
      releaseAll();
    },
    resume() {
      if (phase !== "paused") return;
      phase = "playing";
      lastTime = null;
    },
    reset() {
      resetState();
      phase = "idle";
      emitHud();
      draw();
    },
    setSkin(id) {
      if (id === skinId) return;
      skinId = id;
      // Sin bucle activo (ready / over) se redibuja ya; con bucle, en el siguiente frame.
      if (!destroyed && rafId === null) draw();
    },
    destroy() {
      destroyed = true;
      blockCache.clear();
      sheet.onload = null;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onMouseMove);
      listening = false;
    },
    press,
    release,
    releaseAll,
  };
}
