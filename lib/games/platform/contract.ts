// ── Contrato entre GamePlayer, el registry y los Canvas de cada juego ──
import type { ComponentType, RefObject } from "react";
import type { SkinId } from "@/lib/games/platform/skins";
import type { GameInput, TouchLayout } from "@/lib/games/platform/touch";
export type GameStatus = "ready" | "playing" | "paused" | "over";
export type HudField = "score" | "lives" | "level" | "lines";
// Superconjunto de los HUD de cada motor; GamePlayer solo lee los campos de `entry.hud`.
export type GenericHud = {
  score: number;
  lives?: number;
  level?: number;
  lines?: number;
};
export type GameRenderProps = {
  status: GameStatus;
  skin: SkinId;
  onHud: (hud: GenericHud) => void;
  onGameOver: (finalScore: number) => void;
  inputRef: RefObject<GameInput | null>;
};
export type GameEntry = {
  Canvas: ComponentType<GameRenderProps>;
  hud: HudField[];
  controls: string;
  startTitle: string;
  startHint: string;
  touch: TouchLayout;
};
// Lo que todo motor expone (además de su entrada táctil/teclado).
export type GameEngine = GameInput & {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  destroy: () => void;
  setSkin?: (id: SkinId) => void; // opcional: un motor sin skins la ignora
};
export type GameCallbacks<H extends GenericHud> = {
  onHud: (hud: H) => void;
  onGameOver: (finalScore: number) => void;
};
export type CreateGame<G extends GameEngine, H extends GenericHud> = (
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks<H>,
  skin: SkinId,
) => G;
