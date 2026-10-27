import {
  COLS,
  GOAL_COUNT,
  POINTS_GOAL,
  POINTS_ROUND,
  POINTS_ROW,
  POINTS_TIME_MULT,
  H,
  JUMP_S,
  KEY_ACTIONS,
  MAX_DT,
  ROUND_TIME_DECREASE_S,
  ROUND_TIME_MIN_S,
  ROUND_TIME_S,
  ROW_START,
  ROW_GOALS,
  ROWS,
  START_COL,
  START_LIVES,
  TURTLE_SUBMERGED_S,
  TURTLE_VISIBLE_S,
  W,
} from "./constants";
import {
  drawBackground,
  drawBoardFrame,
  drawFrog,
  drawGoals,
  drawHud,
  drawLanes,
} from "./draw";
import { DEFAULT_SKIN, type SkinId } from "../skins";
import { SKINS } from "./skins";
import {
  buildLanes,
  checkGoal,
  checkRoadCollision,
  getSupport,
  isRiverRow,
} from "./entities";
import type {
  Direction,
  Frog,
  Lane,
  RanariaCallbacks,
  RanariaGame,
  RanariaHud,
} from "./types";
type Phase = "idle" | "playing" | "paused" | "gameover";
const BLOCKED_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
]);
const TURTLE_CYCLE_S = TURTLE_VISIBLE_S + TURTLE_SUBMERGED_S;
const DELTA: Record<Direction, { dc: number; dr: number }> = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 },
};
/** Tiempo de ronda (s) del nivel dado. */
const roundTime = (level: number) =>
  Math.max(
    ROUND_TIME_MIN_S,
    ROUND_TIME_S - (level - 1) * ROUND_TIME_DECREASE_S,
  );
const newFrog = (): Frog => ({
  col: START_COL,
  row: ROW_START,
  animating: false,
  animT: 0,
  targetCol: START_COL,
  targetRow: ROW_START,
});
export function createRanariaGame(
  canvas: HTMLCanvasElement,
  callbacks: RanariaCallbacks,
  initialSkin: SkinId = DEFAULT_SKIN,
): RanariaGame {
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("Canvas 2D no disponible");
  const ctx: CanvasRenderingContext2D = ctxOrNull;
  const font =
    getComputedStyle(canvas).getPropertyValue("--mono").trim() || "monospace";
  // ── Estado (privado al closure) ─────────────────────────────────────────────
  let lanes: Lane[] = [];
  let frog: Frog = newFrog();
  let facing: Direction = "up";
  let pendingDir: Direction | null = null;
  let goals: boolean[] = [];
  /** Fila más alta alcanzada en la ronda: cada fila nueva da puntos una sola vez. */
  let bestRow = ROW_START;
  let score = 0;
  let lives = START_LIVES;
  let level = 1;
  let timeLeft = roundTime(1);
  let phase: Phase = "idle";
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let dpr = 0;
  let listening = false;
  let gameOverEmitted = false;
  let lastHud: RanariaHud | null = null;
  let skinId: SkinId = initialSkin;
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
  function resetState() {
    lanes = buildLanes(1);
    frog = newFrog();
    facing = "up";
    pendingDir = null;
    goals = Array.from({ length: GOAL_COUNT }, () => false);
    bestRow = ROW_START;
    score = 0;
    lives = START_LIVES;
    level = 1;
    timeLeft = roundTime(1);
    gameOverEmitted = false;
  }
  function moveLanes(dt: number) {
    for (const lane of lanes) {
      const dx = lane.speed * lane.dir * dt;
      for (const e of lane.entities) {
        e.col += dx;
        // Reentra por el lado opuesto conservando el hueco (ver Lane.period).
        if (lane.dir === 1 && e.col >= COLS) e.col -= lane.period;
        else if (lane.dir === -1 && e.col + e.width <= 0) e.col += lane.period;
        if (e.type === "turtle") {
          e.cycleT = ((e.cycleT ?? 0) + dt) % TURTLE_CYCLE_S;
          e.submerged = e.cycleT >= TURTLE_VISIBLE_S;
        }
      }
    }
  }
  function startJump(dir: Direction) {
    facing = dir;
    const { dc, dr } = DELTA[dir];
    // Si va sobre un tronco su columna es fraccionaria: el salto parte de la celda más cercana.
    const targetCol = Math.round(frog.col) + dc;
    const targetRow = frog.row + dr;
    // Los bordes del tablero no se cruzan: el salto se ignora.
    if (
      targetCol < 0 ||
      targetCol >= COLS ||
      targetRow < 0 ||
      targetRow >= ROWS
    )
      return;
    frog.animating = true;
    frog.animT = 0;
    frog.targetCol = targetCol;
    frog.targetRow = targetRow;
  }
  function updateFrog(dt: number) {
    if (!frog.animating) {
      if (!pendingDir) return;
      const dir = pendingDir;
      pendingDir = null;
      startJump(dir);
      return;
    }
    frog.animT += dt;
    if (frog.animT < JUMP_S) return;
    frog.col = frog.targetCol;
    frog.row = frog.targetRow;
    frog.animating = false;
    frog.animT = 0;
    resolveLanding();
  }
  /** Celda de destino alcanzada: puntos por fila nueva y resolución de la fila de metas. */
  function resolveLanding() {
    if (frog.row < bestRow) {
      score += (bestRow - frog.row) * POINTS_ROW;
      bestRow = frog.row;
    }
    if (frog.row !== ROW_GOALS) return;
    const mouth = checkGoal(frog, goals);
    if (mouth < 0) {
      // Fuera de una boca, o boca ya ocupada.
      killFrog();
      return;
    }
    goals[mouth] = true;
    score += POINTS_GOAL + Math.floor(timeLeft) * POINTS_TIME_MULT;
    if (goals.every(Boolean)) completeRound();
    else respawnFrog();
  }
  /** Las 5 bocas llenas: bonus de ronda y siguiente nivel con tráfico más rápido. */
  function completeRound() {
    score += POINTS_ROUND;
    level++;
    goals = Array.from({ length: GOAL_COUNT }, () => false);
    bestRow = ROW_START;
    lanes = buildLanes(level);
    respawnFrog();
  }
  function respawnFrog() {
    frog = newFrog();
    facing = "up";
    pendingDir = null;
    timeLeft = roundTime(level);
  }
  /** La rana muere: pierde una vida; sin vidas termina la partida (el bucle emite el HUD y onGameOver). */
  function killFrog() {
    lives--;
    if (lives <= 0) {
      lives = 0;
      phase = "gameover";
      return;
    }
    respawnFrog();
  }
  /** Peligros continuos: vehículos, agua, tortugas sumergidas y deriva sobre troncos. */
  function checkHazards(dt: number) {
    if (phase !== "playing") return;
    if (checkRoadCollision(frog, lanes)) {
      killFrog();
      return;
    }
    if (frog.animating || !isRiverRow(frog.row)) return;
    const support = getSupport(frog, lanes);
    if (!support) {
      killFrog();
      return;
    }
    frog.col += support.lane.speed * support.lane.dir * dt;
    // Arrastrada fuera del tablero por la corriente.
    if (frog.col < -0.5 || frog.col > COLS - 0.5) killFrog();
  }
  function update(dt: number) {
    if (phase !== "playing") return;
    moveLanes(dt);
    updateFrog(dt);
    checkHazards(dt);
    if (phase !== "playing") return;
    timeLeft -= dt;
    if (timeLeft <= 0) killFrog();
  }
  // ── Input ───────────────────────────────────────────────────────────────────
  function press(action: string) {
    if (phase !== "playing" || !(action in DELTA)) return;
    pendingDir = action as Direction;
  }
  // Los saltos son por pulsación: no hay estado mantenido que soltar.
  function release() {}
  function onKeyDown(e: KeyboardEvent) {
    if (phase !== "playing") return;
    if (BLOCKED_KEYS.has(e.code)) e.preventDefault();
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const dir = KEY_ACTIONS[e.code];
    if (dir) press(dir);
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
    drawGoals(ctx, goals, skin);
    drawLanes(ctx, lanes, skin);
    drawFrog(ctx, frog, facing, JUMP_S, skin);
    drawBoardFrame(ctx, skin);
    drawHud(
      ctx,
      { score, lives, level, timeFraction: timeLeft / roundTime(level) },
      font,
      skin,
    );
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
      pendingDir = null;
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
    destroy() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      window.removeEventListener("keydown", onKeyDown);
      listening = false;
    },
    setSkin(id) {
      if (id === skinId) return;
      skinId = id;
      // Redibuja el frame actual (también en ready, pausa o game over).
      draw();
    },
    press,
    release,
    releaseAll: release,
  };
}
