import {
  BOARD_H,
  BOARD_W,
  BOARD_X,
  BOARD_Y,
  CELL,
  GOAL_STARTS,
  GOAL_WIDTH,
  H,
  ROW_GOALS,
  ROW_RIVER_BOT,
  ROW_RIVER_TOP,
  ROW_ROAD_BOT,
  ROW_ROAD_TOP,
  ROW_SAFE_MID,
  ROW_START,
  W,
} from "./constants";
import type { RanariaSkin } from "./skins";
import type { Direction, Entity, Frog, Lane } from "./types";
// Todo se dibuja con primitivas canvas (sin imágenes), recibiendo ctx por parámetro.
const cellX = (col: number) => BOARD_X + col * CELL;
const cellY = (row: number) => BOARD_Y + row * CELL;
const FACING_ANGLE: Record<Direction, number> = {
  up: 0,
  right: Math.PI / 2,
  down: Math.PI,
  left: -Math.PI / 2,
};
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  skin: RanariaSkin,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, skin.square ? 0 : r);
}
/** Activa el glow de la skin con el color dado (no-op si glow = 0); se limpia con save/restore. */
function glowOn(
  ctx: CanvasRenderingContext2D,
  skin: RanariaSkin,
  color: string,
) {
  if (skin.glow <= 0) return;
  ctx.shadowColor = color;
  ctx.shadowBlur = skin.glow;
}
/** Contorno fino de la skin sobre el trazado actual. */
function outlineStroke(ctx: CanvasRenderingContext2D, skin: RanariaSkin) {
  if (!skin.outline) return;
  ctx.strokeStyle = skin.outline;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  skin: RanariaSkin,
) {
  ctx.fillStyle = skin.bg;
  ctx.fillRect(0, 0, W, H);
  const band = (row0: number, row1: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(BOARD_X, cellY(row0), BOARD_W, (row1 - row0 + 1) * CELL);
  };
  band(ROW_GOALS, ROW_GOALS, skin.goalRow);
  band(ROW_RIVER_TOP, ROW_RIVER_BOT, skin.river);
  band(ROW_SAFE_MID, ROW_SAFE_MID, skin.safe);
  band(ROW_ROAD_TOP, ROW_ROAD_BOT, skin.road);
  band(ROW_START, ROW_START, skin.safe);
  // Olas del río.
  ctx.strokeStyle = skin.riverWave;
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 22]);
  for (let row = ROW_RIVER_TOP; row <= ROW_RIVER_BOT; row++) {
    for (const dy of [12, 28]) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X + (dy === 12 ? 0 : 18), cellY(row) + dy);
      ctx.lineTo(BOARD_X + BOARD_W, cellY(row) + dy);
      ctx.stroke();
    }
  }
  // Líneas discontinuas entre carriles de carretera.
  ctx.strokeStyle = skin.roadLine;
  ctx.setLineDash([16, 14]);
  for (let row = ROW_ROAD_TOP + 1; row <= ROW_ROAD_BOT; row++) {
    ctx.beginPath();
    ctx.moveTo(BOARD_X, cellY(row));
    ctx.lineTo(BOARD_X + BOARD_W, cellY(row));
    ctx.stroke();
  }
  ctx.setLineDash([]);
}
function drawFrogShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  facing: Direction,
  jump: number,
  skin: RanariaSkin,
  scale = 1,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(FACING_ANGLE[facing]);
  ctx.scale(scale * (1 + 0.18 * jump), scale * (1 + 0.18 * jump));
  glowOn(ctx, skin, skin.frog);
  ctx.fillStyle = skin.frogDark;
  // Patas: recogidas en reposo, extendidas durante el salto.
  const reach = 4 + jump * 8;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    if (skin.square) {
      ctx.rect(sx * (11 + reach * 0.4) - 4, -7 - reach - 5, 8, 10);
      ctx.rect(sx * (11 + reach * 0.6) - 4, 8 + reach - 6, 8, 12);
    } else {
      ctx.ellipse(
        sx * (11 + reach * 0.4),
        -7 - reach,
        4,
        6,
        sx * 0.5,
        0,
        Math.PI * 2,
      );
      ctx.moveTo(sx * (11 + reach * 0.6) + 5, 8 + reach);
      ctx.ellipse(
        sx * (11 + reach * 0.6),
        8 + reach,
        5,
        7,
        -sx * 0.5,
        0,
        Math.PI * 2,
      );
    }
    ctx.fill();
  }
  ctx.fillStyle = skin.frog;
  ctx.beginPath();
  if (skin.square) ctx.rect(-13, -11, 26, 22);
  else ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  if (skin.frogOutline) {
    ctx.strokeStyle = skin.frogOutline;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  for (const sx of [-1, 1]) {
    ctx.fillStyle = skin.eyeWhite;
    ctx.beginPath();
    if (skin.square) ctx.rect(sx * 6 - 4, -13, 8, 8);
    else ctx.arc(sx * 6, -9, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.eyePupil;
    ctx.beginPath();
    if (skin.square) ctx.rect(sx * 6 - 2, -12, 4, 4);
    else ctx.arc(sx * 6, -10, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
export function drawGoals(
  ctx: CanvasRenderingContext2D,
  goals: boolean[],
  skin: RanariaSkin,
) {
  GOAL_STARTS.forEach((start, i) => {
    const x = cellX(start) + 2;
    const y = cellY(ROW_GOALS) + 4;
    const w = GOAL_WIDTH * CELL - 4;
    const h = CELL - 8;
    ctx.fillStyle = skin.goalMouth;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = skin.goalBorder;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    if (goals[i])
      drawFrogShape(ctx, x + w / 2, y + h / 2, "down", 0, skin, 0.8);
  });
}
function drawVehicle(
  ctx: CanvasRenderingContext2D,
  e: Entity,
  lane: Lane,
  skin: RanariaSkin,
) {
  const x = cellX(e.col);
  const y = cellY(lane.row);
  const w = e.width * CELL;
  const bodyY = y + 7;
  const bodyH = CELL - 14;
  ctx.fillStyle = skin.wheel;
  for (const wx of [x + 9, x + w - 9]) {
    for (const wy of [bodyY - 1, bodyY + bodyH + 1]) {
      ctx.beginPath();
      ctx.arc(wx, wy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (e.type === "car") {
    const carColor = skin.carColors[lane.row % skin.carColors.length];
    glowOn(ctx, skin, carColor);
    ctx.fillStyle = carColor;
    roundRect(ctx, x + 2, bodyY, w - 4, bodyH, 6, skin);
    ctx.fill();
    outlineStroke(ctx, skin);
    ctx.shadowBlur = 0;
    ctx.fillStyle = skin.windshield;
    const glassX = lane.dir === 1 ? x + w - 14 : x + 6;
    ctx.fillRect(glassX, bodyY + 4, 8, bodyH - 8);
    return;
  }
  const cabW = CELL - 6;
  ctx.fillStyle = skin.truckBody;
  glowOn(ctx, skin, skin.truckBody);
  roundRect(ctx, x + 1, bodyY, w - 2, bodyH, 3, skin);
  ctx.fill();
  outlineStroke(ctx, skin);
  // Cabina diferenciada en el extremo delantero.
  const cabX = lane.dir === 1 ? x + w - cabW - 1 : x + 1;
  ctx.fillStyle = skin.truckCab;
  roundRect(ctx, cabX, bodyY, cabW, bodyH, 3, skin);
  ctx.fill();
  outlineStroke(ctx, skin);
  ctx.shadowBlur = 0;
  ctx.fillStyle = skin.windshield;
  ctx.fillRect(
    lane.dir === 1 ? cabX + cabW - 9 : cabX + 3,
    bodyY + 4,
    6,
    bodyH - 8,
  );
}
function drawLog(
  ctx: CanvasRenderingContext2D,
  e: Entity,
  row: number,
  skin: RanariaSkin,
) {
  const x = cellX(e.col);
  const y = cellY(row) + 6;
  const w = e.width * CELL;
  const h = CELL - 12;
  ctx.fillStyle = skin.log;
  glowOn(ctx, skin, skin.log);
  roundRect(ctx, x + 1, y, w - 2, h, 8, skin);
  ctx.fill();
  outlineStroke(ctx, skin);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = skin.logLine;
  ctx.lineWidth = 2;
  for (let i = 1; i < e.width * 2; i++) {
    const lx = x + i * (CELL / 2);
    ctx.beginPath();
    ctx.moveTo(lx, y + 4);
    ctx.lineTo(lx - 4, y + h - 4);
    ctx.stroke();
  }
}
function drawTurtles(
  ctx: CanvasRenderingContext2D,
  e: Entity,
  row: number,
  skin: RanariaSkin,
) {
  for (let i = 0; i < e.width; i++) {
    const cx = cellX(e.col) + i * CELL + CELL / 2;
    const cy = cellY(row) + CELL / 2;
    ctx.beginPath();
    if (skin.square) ctx.rect(cx - 14, cy - 14, 28, 28);
    else ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    if (e.submerged) {
      ctx.fillStyle = skin.turtleGhost;
      ctx.fill();
      ctx.strokeStyle = skin.turtleRing;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      continue;
    }
    ctx.save();
    glowOn(ctx, skin, skin.turtle);
    ctx.fillStyle = skin.turtle;
    ctx.fill();
    outlineStroke(ctx, skin);
    ctx.restore();
    // Caparazón con patrón de escamas.
    ctx.strokeStyle = skin.turtleShell;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (skin.square) ctx.rect(cx - 9, cy - 9, 18, 18);
    else ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.moveTo(cx - 9, cy);
    ctx.lineTo(cx + 9, cy);
    ctx.moveTo(cx, cy - 9);
    ctx.lineTo(cx, cy + 9);
    ctx.stroke();
  }
}
/** Dibuja los carriles recortados al tablero (las entidades entran y salen por los bordes). */
export function drawLanes(
  ctx: CanvasRenderingContext2D,
  lanes: Lane[],
  skin: RanariaSkin,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
  ctx.clip();
  for (const lane of lanes) {
    for (const e of lane.entities) {
      ctx.save();
      if (e.type === "car" || e.type === "truck")
        drawVehicle(ctx, e, lane, skin);
      else if (e.type === "log") drawLog(ctx, e, lane.row, skin);
      else drawTurtles(ctx, e, lane.row, skin);
      ctx.restore();
    }
  }
  ctx.restore();
}
export function drawFrog(
  ctx: CanvasRenderingContext2D,
  frog: Frog,
  facing: Direction,
  jumpSeconds: number,
  skin: RanariaSkin,
) {
  const t = frog.animating ? Math.min(frog.animT / jumpSeconds, 1) : 0;
  const col = frog.col + (frog.targetCol - frog.col) * t;
  const row = frog.row + (frog.targetRow - frog.row) * t;
  drawFrogShape(
    ctx,
    cellX(col) + CELL / 2,
    cellY(row) + CELL / 2,
    facing,
    frog.animating ? Math.sin(Math.PI * t) : 0,
    skin,
  );
}
export function drawBoardFrame(
  ctx: CanvasRenderingContext2D,
  skin: RanariaSkin,
) {
  ctx.save();
  glowOn(ctx, skin, skin.boardBorder);
  ctx.strokeStyle = skin.boardBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(BOARD_X - 1, BOARD_Y - 1, BOARD_W + 2, BOARD_H + 2);
  ctx.restore();
}
type HudValues = {
  score: number;
  lives: number;
  level: number;
  /** Fracción de tiempo de ronda restante, 0–1. */
  timeFraction: number;
};
/** HUD interno en los márgenes del mundo: puntos (izq.), vidas (der.), nivel (arriba), tiempo (abajo). */
export function drawHud(
  ctx: CanvasRenderingContext2D,
  hud: HudValues,
  font: string,
  skin: RanariaSkin,
) {
  ctx.save();
  glowOn(ctx, skin, skin.hudText);
  ctx.fillStyle = skin.hudText;
  ctx.textBaseline = "top";
  ctx.font = `14px ${font}`;
  ctx.textAlign = "left";
  ctx.fillText("PUNTOS", 8, BOARD_Y + 4);
  ctx.font = `bold 16px ${font}`;
  ctx.fillText(String(hud.score), 8, BOARD_Y + 24);
  ctx.textAlign = "center";
  ctx.font = `14px ${font}`;
  ctx.fillText(`NIVEL ${hud.level}`, W / 2, 3);
  ctx.textAlign = "right";
  ctx.fillText("VIDAS", W - 8, BOARD_Y + 4);
  ctx.fillStyle = skin.frog;
  for (let i = 0; i < hud.lives; i++) {
    if (skin.square) ctx.fillRect(W - 23 - i * 20, BOARD_Y + 31, 14, 14);
    else {
      ctx.beginPath();
      ctx.arc(W - 16 - i * 20, BOARD_Y + 38, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Barra de tiempo bajo el tablero: verde → amarillo → rojo.
  const f = Math.max(0, Math.min(1, hud.timeFraction));
  ctx.fillStyle =
    f > 0.5 ? skin.timeOk : f > 0.25 ? skin.timeWarn : skin.timeLow;
  ctx.fillRect(BOARD_X, BOARD_Y + BOARD_H + 5, BOARD_W * f, 8);
  ctx.restore();
}
