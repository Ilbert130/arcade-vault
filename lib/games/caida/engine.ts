import {
  BASE_DROP_MS,
  BLOCK,
  BOARD_H,
  BOARD_W,
  BOARD_X,
  BOARD_Y,
  COLS,
  H,
  HARD_DROP_POINTS,
  LEFT_PANEL_W,
  LEFT_PANEL_X,
  LEVEL_STEP_MS,
  LINES_PER_LEVEL,
  MAX_DT,
  MIN_DROP_MS,
  NEXT_BLOCK,
  NEXT_BOX,
  RIGHT_PANEL_W,
  RIGHT_PANEL_X,
  ROWS,
  SOFT_DROP_POINTS,
  W,
} from "./constants";
import {
  clearLines,
  collide,
  createBoard,
  drawBlock,
  ghostY,
  lineScore,
  merge,
  randomPiece,
  tryRotate,
  type BlockCache,
} from "./entities";
import { SKINS, type CaidaSkin } from "./skins";
import { DEFAULT_SKIN, type SkinId } from "@/lib/games/platform/skins";
import type {
  Board,
  Piece,
  CaidaAction,
  CaidaCallbacks,
  CaidaGame,
  CaidaHud,
} from "./types";
type Phase = "idle" | "playing" | "paused" | "gameover";
/** Teclas que el juego consume; se bloquea su acción por defecto mientras se juega. */
const GAME_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
]);
/** Traducción tecla → acción del motor. */
const KEY_ACTIONS: Record<string, CaidaAction> = {
  ArrowLeft: "moveLeft",
  ArrowRight: "moveRight",
  ArrowDown: "softDrop",
  ArrowUp: "rotate",
  KeyX: "rotate",
  Space: "hardDrop",
};
/** Acciones que ignoran el auto-repeat del teclado (en el mando no llevan `repeat`). */
const ONCE_ACTIONS = new Set<CaidaAction>(["rotate", "hardDrop"]);
const dropIntervalMs = (level: number) =>
  Math.max(MIN_DROP_MS, BASE_DROP_MS - (level - 1) * LEVEL_STEP_MS);
export function createCaidaGame(
  canvas: HTMLCanvasElement,
  callbacks: CaidaCallbacks,
  skinId: SkinId = DEFAULT_SKIN,
): CaidaGame {
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("Canvas 2D no disponible");
  const ctx: CanvasRenderingContext2D = ctxOrNull;
  // Fuente monoespaciada del Vault (variable CSS ya resuelta por el navegador).
  const font =
    getComputedStyle(canvas).getPropertyValue("--mono").trim() || "monospace";
  // ── Estado (privado al closure) ─────────────────────────────────────────────
  let board: Board = createBoard();
  let current: Piece | null = null;
  let next: Piece | null = null;
  let score = 0;
  let lines = 0;
  let level = 1;
  let phase: Phase = "idle";
  let dropAccum = 0; // ms desde la última caída automática
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let dpr = 0;
  let listening = false;
  let gameOverEmitted = false;
  let lastHud: CaidaHud | null = null;
  // ── Skin (solo cosmética) ───────────────────────────────────────────────────
  let skin: CaidaSkin = SKINS[skinId] ?? SKINS[DEFAULT_SKIN];
  const blockCache: BlockCache = new Map();
  // ── HUD hacia React ─────────────────────────────────────────────────────────
  function emitHud() {
    if (
      lastHud &&
      lastHud.score === score &&
      lastHud.lines === lines &&
      lastHud.level === level
    )
      return;
    lastHud = { score, lines, level };
    callbacks.onHud(lastHud);
  }
  // ── Lógica ──────────────────────────────────────────────────────────────────
  function resetState() {
    board = createBoard();
    current = null;
    next = null;
    score = 0;
    lines = 0;
    level = 1;
    dropAccum = 0;
    gameOverEmitted = false;
  }
  /** La siguiente pieza pasa a ser la actual; si no cabe al aparecer, fin de partida. */
  function spawn() {
    current = next ?? randomPiece();
    next = randomPiece();
    if (collide(board, current.shape, current.x, current.y)) phase = "gameover";
  }
  function lockPiece() {
    if (!current) return;
    merge(board, current);
    const cleared = clearLines(board);
    if (cleared) {
      lines += cleared;
      score += lineScore(cleared) * level;
      level = Math.floor(lines / LINES_PER_LEVEL) + 1;
    }
    spawn();
  }
  function move(dx: number) {
    if (current && !collide(board, current.shape, current.x + dx, current.y))
      current = { ...current, x: current.x + dx };
  }
  function softDrop() {
    if (!current) return;
    if (!collide(board, current.shape, current.x, current.y + 1)) {
      current = { ...current, y: current.y + 1 };
      score += SOFT_DROP_POINTS;
    } else {
      lockPiece();
    }
  }
  function hardDrop() {
    if (!current) return;
    const gy = ghostY(board, current);
    score += (gy - current.y) * HARD_DROP_POINTS;
    current = { ...current, y: gy };
    lockPiece();
  }
  function update(dt: number) {
    if (phase !== "playing" || !current) return;
    dropAccum += dt * 1000;
    if (dropAccum < dropIntervalMs(level)) return;
    dropAccum = 0;
    if (!collide(board, current.shape, current.x, current.y + 1))
      current = { ...current, y: current.y + 1 };
    else lockPiece();
  }
  // ── Input ───────────────────────────────────────────────────────────────────
  function press(action: string) {
    if (phase !== "playing") return;
    switch (action) {
      case "moveLeft":
        move(-1);
        break;
      case "moveRight":
        move(1);
        break;
      case "softDrop":
        softDrop();
        break;
      case "rotate":
        if (current) current = tryRotate(board, current);
        break;
      case "hardDrop":
        hardDrop();
        break;
    }
  }
  // Todas las acciones son por pulsación: no hay estado mantenido que soltar.
  function release() {}
  function onKeyDown(e: KeyboardEvent) {
    if (phase !== "playing") return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    const action = KEY_ACTIONS[e.code];
    // Rotar y caída dura no se encadenan con el auto-repeat del navegador.
    if (action && !(e.repeat && ONCE_ACTIONS.has(action))) press(action);
  }
  function onKeyUp(e: KeyboardEvent) {
    if (phase === "playing" && GAME_KEYS.has(e.code)) e.preventDefault();
  }
  // ── Draw ────────────────────────────────────────────────────────────────────
  function syncResolution() {
    const nextDpr = window.devicePixelRatio || 1;
    if (nextDpr === dpr) return;
    dpr = nextDpr;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  function drawGrid() {
    ctx.strokeStyle = skin.grid;
    ctx.lineWidth = skin.gridWidth;
    ctx.beginPath();
    for (let c = 1; c < COLS; c++) {
      ctx.moveTo(BOARD_X + c * BLOCK, BOARD_Y);
      ctx.lineTo(BOARD_X + c * BLOCK, BOARD_Y + BOARD_H);
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.moveTo(BOARD_X, BOARD_Y + r * BLOCK);
      ctx.lineTo(BOARD_X + BOARD_W, BOARD_Y + r * BLOCK);
    }
    ctx.stroke();
  }
  function drawPiece(piece: Piece, y: number, alpha = 1) {
    for (let r = 0; r < piece.shape.length; r++)
      for (let c = 0; c < piece.shape[r].length; c++)
        drawBlock(
          ctx,
          skin,
          blockCache,
          BOARD_X + (piece.x + c) * BLOCK,
          BOARD_Y + (y + r) * BLOCK,
          piece.shape[r][c],
          BLOCK,
          alpha,
        );
  }
  function drawStat(label: string, value: string, y: number, color: string) {
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = `12px ${font}`;
    ctx.fillStyle = skin.inkDim;
    ctx.fillText(label, LEFT_PANEL_X, y);
    ctx.font = `bold 26px ${font}`;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = skin.glow;
    ctx.fillText(value, LEFT_PANEL_X, y + 32, LEFT_PANEL_W);
    ctx.restore();
  }
  function drawNext() {
    const box = NEXT_BOX * NEXT_BLOCK;
    const bx = RIGHT_PANEL_X + (RIGHT_PANEL_W - box) / 2;
    const by = 60;
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = `12px ${font}`;
    ctx.fillStyle = skin.inkDim;
    ctx.fillText("SIGUIENTE", RIGHT_PANEL_X, 40);
    ctx.strokeStyle = skin.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, box - 1, box - 1);
    ctx.restore();
    if (!next) return;
    const offX = Math.floor((NEXT_BOX - next.shape[0].length) / 2);
    const offY = Math.floor((NEXT_BOX - next.shape.length) / 2);
    for (let r = 0; r < next.shape.length; r++)
      for (let c = 0; c < next.shape[r].length; c++)
        drawBlock(
          ctx,
          skin,
          blockCache,
          bx + (offX + c) * NEXT_BLOCK,
          by + (offY + r) * NEXT_BLOCK,
          next.shape[r][c],
          NEXT_BLOCK,
        );
  }
  function draw() {
    syncResolution();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = skin.bg;
    ctx.fillRect(0, 0, W, H);
    if (skin.boardTint) {
      ctx.fillStyle = skin.boardTint;
      ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
    }
    drawGrid();
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        drawBlock(
          ctx,
          skin,
          blockCache,
          BOARD_X + c * BLOCK,
          BOARD_Y + r * BLOCK,
          board[r][c],
          BLOCK,
        );
    if (current) {
      drawPiece(current, ghostY(board, current), skin.ghostAlpha);
      drawPiece(current, current.y);
    }
    ctx.save();
    ctx.strokeStyle = skin.cyan;
    ctx.shadowColor = skin.cyan;
    ctx.shadowBlur = skin.glow;
    ctx.lineWidth = skin.borderWidth;
    ctx.strokeRect(BOARD_X - 1, BOARD_Y, BOARD_W + 2, BOARD_H);
    if (skin.core) {
      // Neón: núcleo fino sobre el trazo de color.
      ctx.shadowBlur = 0;
      ctx.strokeStyle = skin.core;
      ctx.lineWidth = 0.75;
      ctx.strokeRect(BOARD_X - 1, BOARD_Y, BOARD_W + 2, BOARD_H);
    }
    ctx.restore();
    drawStat("PUNTUACIÓN", score.toLocaleString("es-ES"), 40, skin.ink);
    drawStat("LÍNEAS", String(lines), 130, skin.green);
    drawStat("NIVEL", String(level), 220, skin.yellow);
    drawNext();
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
  draw();
  return {
    start() {
      resetState();
      next = randomPiece();
      phase = "playing";
      spawn();
      lastTime = null;
      emitHud();
      addListeners();
      ensureLoop();
    },
    pause() {
      if (phase === "playing") phase = "paused";
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
      skin = SKINS[id] ?? SKINS[DEFAULT_SKIN];
      // Redibuja ya: en "idle"/"gameover" no hay bucle y en pausa se ve el cambio al instante.
      draw();
    },
    destroy() {
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
