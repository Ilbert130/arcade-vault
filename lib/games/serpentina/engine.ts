import {
  COLS,
  DIRECTION_DELTA,
  FRUITS_PER_LEVEL,
  FRUITS_PER_SPEEDUP,
  FRUIT_POINTS,
  H,
  KEY_TO_DIRECTION,
  MAX_DT,
  MAX_TURN_QUEUE,
  OPPOSITE,
  ROWS,
  START_DIRECTION,
  START_LENGTH,
  STEP_DECREASE_MS,
  STEP_MIN_MS,
  STEP_START_MS,
  TOTAL_CELLS,
  W,
} from "./constants";
import { DEFAULT_SKIN, type SkinId } from "../skins";
import {
  cellEquals,
  drawBackground,
  drawFruit,
  drawSnake,
  loadFruitsImage,
  spawnFruit,
  tintAtlas,
} from "./entities";
import { SKINS } from "./skins";
import type {
  Cell,
  Direction,
  Fruit,
  SerpentinaAction,
  SerpentinaCallbacks,
  SerpentinaGame,
  SerpentinaHud,
} from "./types";
type Phase = "idle" | "playing" | "paused" | "gameover";
type ImageState = "loading" | "ready" | "failed";
const BLOCKED_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
]);
/** Duración del paso (s) según frutas comidas: −5 ms cada 2 frutas, mínimo 70 ms. */
function stepSeconds(fruitsEaten: number): number {
  const ms = Math.max(
    STEP_MIN_MS,
    STEP_START_MS -
      Math.floor(fruitsEaten / FRUITS_PER_SPEEDUP) * STEP_DECREASE_MS,
  );
  return ms / 1000;
}
function initialSnake(): Cell[] {
  const row = Math.floor(ROWS / 2);
  const headCol = Math.floor(COLS / 2);
  return Array.from({ length: START_LENGTH }, (_, i) => ({
    col: headCol - i,
    row,
  }));
}
export function createSerpentinaGame(
  canvas: HTMLCanvasElement,
  callbacks: SerpentinaCallbacks,
  initialSkin: SkinId = DEFAULT_SKIN,
): SerpentinaGame {
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("Canvas 2D no disponible");
  const ctx: CanvasRenderingContext2D = ctxOrNull;
  // ── Estado (privado al closure) ─────────────────────────────────────────────
  let snake: Cell[] = [];
  let direction: Direction = START_DIRECTION;
  let turnQueue: Direction[] = [];
  let fruit: Fruit | null = null;
  let fruitsEaten = 0;
  let score = 0;
  let level = 1;
  let stepAcc = 0;
  let phase: Phase = "idle";
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let dpr = 0;
  let listening = false;
  let destroyed = false;
  let gameOverEmitted = false;
  let lastHud: SerpentinaHud | null = null;
  let skinId: SkinId = initialSkin;
  // ── Assets (por instancia, nada a nivel de módulo) ──────────────────────────
  let imageState: ImageState = "loading";
  const fruits = loadFruitsImage(
    () => {
      imageState = "ready";
      if (!destroyed && rafId === null) draw();
    },
    () => {
      imageState = "failed";
      if (!destroyed && rafId === null) draw();
    },
  );
  // Atlas tintado por skin, creado una sola vez cuando la imagen está lista.
  const tintedAtlas = new Map<SkinId, CanvasImageSource | null>();
  function fruitSource(): CanvasImageSource | null {
    if (imageState !== "ready") return null;
    const tint = SKINS[skinId].fruitTint;
    if (!tint) return fruits.img;
    if (!tintedAtlas.has(skinId))
      tintedAtlas.set(skinId, tintAtlas(fruits.img, tint));
    return tintedAtlas.get(skinId) ?? fruits.img;
  }
  // ── HUD hacia React ─────────────────────────────────────────────────────────
  function emitHud() {
    if (lastHud && lastHud.score === score && lastHud.level === level) return;
    lastHud = { score, level };
    callbacks.onHud(lastHud);
  }
  // ── Lógica ──────────────────────────────────────────────────────────────────
  function resetState() {
    snake = initialSnake();
    direction = START_DIRECTION;
    turnQueue = [];
    fruitsEaten = 0;
    score = 0;
    level = 1;
    stepAcc = 0;
    gameOverEmitted = false;
    fruit = spawnFruit(snake);
  }
  function queueTurn(next: Direction) {
    if (turnQueue.length >= MAX_TURN_QUEUE) return;
    const reference = turnQueue[turnQueue.length - 1] ?? direction;
    if (next === reference || next === OPPOSITE[reference]) return;
    turnQueue.push(next);
  }
  /** Avanza una celda. Pone `phase = "gameover"` si choca o gana. */
  function advance() {
    const turn = turnQueue.shift();
    if (turn && turn !== OPPOSITE[direction]) direction = turn;
    const { dc, dr } = DIRECTION_DELTA[direction];
    const head = snake[0];
    const next: Cell = { col: head.col + dc, row: head.row + dr };
    if (next.col < 0 || next.col >= COLS || next.row < 0 || next.row >= ROWS) {
      phase = "gameover";
      return;
    }
    const eating = fruit !== null && cellEquals(next, fruit);
    // Si no come, la cola se libera en este mismo paso: no cuenta como choque.
    const body = eating ? snake : snake.slice(0, -1);
    if (body.some((c) => cellEquals(c, next))) {
      phase = "gameover";
      return;
    }
    snake.unshift(next);
    if (!eating) {
      snake.pop();
      return;
    }
    fruitsEaten++;
    score += FRUIT_POINTS;
    level = 1 + Math.floor(fruitsEaten / FRUITS_PER_LEVEL);
    fruit = snake.length >= TOTAL_CELLS ? null : spawnFruit(snake);
    // Sin celda libre = rejilla llena = victoria.
    if (fruit === null) phase = "gameover";
  }
  function update(dt: number) {
    if (phase !== "playing" || imageState === "loading") return;
    stepAcc += dt;
    let step = stepSeconds(fruitsEaten);
    while (stepAcc >= step && phase === "playing") {
      stepAcc -= step;
      advance();
      step = stepSeconds(fruitsEaten);
    }
  }
  // ── Input ───────────────────────────────────────────────────────────────────
  function press(action: string) {
    if (phase !== "playing" || !(action in OPPOSITE)) return;
    queueTurn(action as SerpentinaAction);
  }
  // Los giros son por pulsación: no hay estado mantenido que soltar.
  function release() {}
  function onKeyDown(e: KeyboardEvent) {
    if (phase !== "playing") return;
    if (BLOCKED_KEYS.has(e.code) || BLOCKED_KEYS.has(e.key)) e.preventDefault();
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const dir = KEY_TO_DIRECTION[key];
    if (dir) press(dir);
  }
  function onKeyUp(e: KeyboardEvent) {
    if (
      phase === "playing" &&
      (BLOCKED_KEYS.has(e.code) || BLOCKED_KEYS.has(e.key))
    )
      e.preventDefault();
  }
  // ── Draw ────────────────────────────────────────────────────────────────────
  function syncResolution() {
    const nextDpr = window.devicePixelRatio || 1;
    if (nextDpr === dpr) return;
    dpr = nextDpr;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  function draw() {
    syncResolution();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const skin = SKINS[skinId];
    drawBackground(ctx, skin);
    if (imageState === "loading") return;
    if (fruit) drawFruit(ctx, fruitSource(), fruit, skin);
    drawSnake(ctx, snake, direction, skin);
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
    listening = true;
  }
  // Estado inicial visible antes de empezar.
  resetState();
  draw();
  return {
    start() {
      resetState();
      phase = "playing";
      lastTime = null;
      emitHud();
      addListeners();
      ensureLoop();
    },
    pause() {
      if (phase !== "playing") return;
      phase = "paused";
      turnQueue = [];
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
      tintedAtlas.clear();
      fruits.dispose();
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      listening = false;
    },
    press,
    release,
    releaseAll: release,
  };
}
