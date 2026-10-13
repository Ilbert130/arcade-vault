"use client";
import type { ComponentType } from "react";
import AsteroidsCanvas from "@/components/games/AsteroidsCanvas";
import TetrisCanvas from "@/components/games/TetrisCanvas";
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
  onHud: (hud: GenericHud) => void;
  onGameOver: (finalScore: number) => void;
};
export type GameEntry = {
  Canvas: ComponentType<GameRenderProps>;
  hud: HudField[];
  controls: string;
  startTitle: string;
  startHint: string;
};
// Juegos con motor real. Los que no estén aquí usan la simulación de GamePlayer.
export const GAME_REGISTRY: Record<string, GameEntry> = {
  rocas: {
    Canvas: AsteroidsCanvas,
    hud: ["score", "lives", "level"],
    controls: "← → ROTAR · ↑ PROPULSAR · ESPACIO DISPARAR · P PAUSA",
    startTitle: "ROCAS",
    startHint: "PULSA ESPACIO PARA EMPEZAR",
  },
  caida: {
    Canvas: TetrisCanvas,
    hud: ["score", "lines", "level"],
    controls:
      "← → MOVER · ↑ ROTAR · ↓ CAÍDA SUAVE · ESPACIO CAÍDA DURA · P PAUSA",
    startTitle: "CAÍDA",
    startHint: "PULSA ESPACIO PARA EMPEZAR",
  },
};
