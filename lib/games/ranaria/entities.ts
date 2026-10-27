import {
  COLS,
  FROG_HITBOX,
  GOAL_STARTS,
  GOAL_WIDTH,
  JUMP_S,
  ROW_GOALS,
  LEVEL_SPEED_FACTOR,
  ROW_RIVER_BOT,
  SPEED_SCALE,
  ROW_RIVER_TOP,
  ROW_ROAD_BOT,
  ROW_ROAD_TOP,
  TURTLE_SUBMERGED_S,
  TURTLE_VISIBLE_S,
} from "./constants";
import type { Entity, EntityType, Frog, Lane } from "./types";
type LaneSpec = {
  row: number;
  dir: 1 | -1;
  /** Celdas por segundo en el nivel 1. */
  speed: number;
  type: EntityType;
  /** Anchos (celdas) del patrón que se repite a lo largo del carril. */
  widths: number[];
  /** Hueco (celdas) detrás de cada entidad. */
  gap: number;
  /** Desfase inicial (celdas) para que los carriles no queden alineados. */
  offset: number;
};
// Carretera (filas 8–12): 2.25–6 celdas/s (1.5–4 px/frame), sentidos alternos, huecos ≥ 3.
// Río (filas 1–6): 1.5–4.5 celdas/s (1–3 px/frame), troncos de 2–4 y tortugas de 2–3, huecos ≥ 2.
const LANE_SPECS: LaneSpec[] = [
  { row: 1, dir: 1, speed: 4, type: "log", widths: [3], gap: 3, offset: 2 },
  { row: 2, dir: -1, speed: 3, type: "log", widths: [2], gap: 3, offset: 5 },
  { row: 3, dir: 1, speed: 2, type: "turtle", widths: [3], gap: 2, offset: 1 },
  { row: 4, dir: -1, speed: 3.75, type: "log", widths: [4], gap: 3, offset: 7 },
  { row: 5, dir: 1, speed: 2.25, type: "log", widths: [3], gap: 3, offset: 4 },
  {
    row: 6,
    dir: -1,
    speed: 1.5,
    type: "turtle",
    widths: [2],
    gap: 2,
    offset: 3,
  },
  {
    row: 8,
    dir: 1,
    speed: 2.25,
    type: "car",
    widths: [1, 1],
    gap: 3,
    offset: 0,
  },
  { row: 9, dir: -1, speed: 3, type: "truck", widths: [3], gap: 4, offset: 6 },
  { row: 10, dir: 1, speed: 4, type: "car", widths: [2], gap: 3, offset: 2 },
  {
    row: 11,
    dir: -1,
    speed: 2.6,
    type: "truck",
    widths: [3, 2],
    gap: 4,
    offset: 9,
  },
  {
    row: 12,
    dir: 1,
    speed: 5.25,
    type: "car",
    widths: [1, 1, 1],
    gap: 3,
    offset: 5,
  },
];
const TURTLE_CYCLE_S = TURTLE_VISIBLE_S + TURTLE_SUBMERGED_S;
function buildLane(spec: LaneSpec, level: number): Lane {
  const maxW = Math.max(...spec.widths);
  const unit = spec.widths.reduce((sum, w) => sum + w + spec.gap, 0);
  // El bucle debe cubrir la pantalla más la entidad más ancha, para que reentre fuera de vista.
  const repeats = Math.ceil((COLS + maxW) / unit);
  const period = unit * repeats;
  const entities: Entity[] = [];
  let cursor = (spec.offset % period) - maxW;
  for (let r = 0; r < repeats; r++) {
    for (const width of spec.widths) {
      const entity: Entity = { col: cursor, width, type: spec.type };
      if (spec.type === "turtle") {
        // Cada grupo con su propia fase del ciclo, repartidas de forma determinista.
        entity.cycleT = (entities.length * 1.7 + spec.row) % TURTLE_CYCLE_S;
        entity.submerged = entity.cycleT >= TURTLE_VISIBLE_S;
      }
      // Equivalente módulo bucle dentro de [-maxW, period - maxW): nada nace fuera de vista por error.
      if (entity.col >= period - maxW) entity.col -= period;
      entities.push(entity);
      cursor += width + spec.gap;
    }
  }
  return {
    row: spec.row,
    dir: spec.dir,
    speed: spec.speed * SPEED_SCALE * LEVEL_SPEED_FACTOR ** (level - 1),
    period,
    entities,
  };
}
/** Carriles de carretera y río del nivel dado; cada nivel acelera todo un 15 %. */
export function buildLanes(level: number): Lane[] {
  return LANE_SPECS.map((spec) => buildLane(spec, level));
}
export const isRoadRow = (row: number) =>
  row >= ROW_ROAD_TOP && row <= ROW_ROAD_BOT;
export const isRiverRow = (row: number) =>
  row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOT;

// ── Colisiones y apoyo ────────────────────────────────────────────────────────
/** Posición de la rana en celdas, interpolada durante el salto. */
export function frogPosition(frog: Frog): { col: number; row: number } {
  if (!frog.animating) return { col: frog.col, row: frog.row };
  const t = Math.min(frog.animT / JUMP_S, 1);
  return {
    col: frog.col + (frog.targetCol - frog.col) * t,
    row: frog.row + (frog.targetRow - frog.row) * t,
  };
}
/** Hitbox horizontal de la rana (centrada en su celda). */
function frogSpan(col: number): [number, number] {
  const margin = (1 - FROG_HITBOX) / 2;
  return [col + margin, col + 1 - margin];
}
/** true si un vehículo de la carretera solapa a la rana. */
export function checkRoadCollision(frog: Frog, lanes: Lane[]): boolean {
  const { col, row } = frogPosition(frog);
  const laneRow = Math.round(row);
  if (!isRoadRow(laneRow)) return false;
  const [left, right] = frogSpan(col);
  return lanes.some(
    (lane) =>
      lane.row === laneRow &&
      lane.entities.some((e) => left < e.col + e.width && right > e.col),
  );
}
/** Tronco o tortuga visible bajo el centro de la rana (mismo carril), o null. */
export function getSupport(
  frog: Frog,
  lanes: Lane[],
): { lane: Lane; entity: Entity } | null {
  const center = frog.col + 0.5;
  for (const lane of lanes) {
    if (lane.row !== frog.row) continue;
    for (const entity of lane.entities) {
      if (entity.submerged) continue;
      if (center >= entity.col && center < entity.col + entity.width)
        return { lane, entity };
    }
  }
  return null;
}
/** Índice de la boca libre bajo la rana en la fila de metas, o -1 (fuera de boca u ocupada). */
export function checkGoal(frog: Frog, goals: boolean[]): number {
  if (frog.row !== ROW_GOALS) return -1;
  const center = frog.col + 0.5;
  const index = GOAL_STARTS.findIndex(
    (start) => center >= start && center < start + GOAL_WIDTH,
  );
  return index >= 0 && !goals[index] ? index : -1;
}
