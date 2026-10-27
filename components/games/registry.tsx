"use client";
import type { ComponentType, RefObject } from "react";
import type { SkinId } from "@/lib/games/skins";
import type { GameInput, TouchLayout } from "@/lib/games/touch";
import { touchLayout } from "@/lib/games/touch";
import type { AsteroidsAction } from "@/lib/games/asteroids/types";
import type { TetrisAction } from "@/lib/games/tetris/types";
import type { BloqueBusterAction } from "@/lib/games/bloque-buster/types";
import type { SerpentinaAction } from "@/lib/games/serpentina/types";
import type { RanariaAction } from "@/lib/games/ranaria/types";
import AsteroidsCanvas from "@/components/games/AsteroidsCanvas";
import TetrisCanvas from "@/components/games/TetrisCanvas";
import BloqueBusterCanvas from "@/components/games/BloqueBusterCanvas";
import SerpentinaCanvas from "@/components/games/SerpentinaCanvas";
import RanariaCanvas from "@/components/games/RanariaCanvas";
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
// Juegos con motor real. Los que no estén aquí usan la simulación de GamePlayer.
export const GAME_REGISTRY: Record<string, GameEntry> = {
  rocas: {
    Canvas: AsteroidsCanvas,
    hud: ["score", "lives", "level"],
    controls: "← → ROTAR · ↑ PROPULSAR · ESPACIO DISPARAR · P PAUSA",
    startTitle: "ROCAS",
    startHint: "PULSA ESPACIO PARA EMPEZAR",
    touch: touchLayout<AsteroidsAction>([
      { slot: "left", action: "rotateLeft", label: "GIRAR" },
      { slot: "right", action: "rotateRight", label: "GIRAR" },
      { slot: "up", action: "thrust", label: "PROPULSAR" },
      { slot: "a", action: "fire", label: "DISPARAR" },
    ]),
  },
  caida: {
    Canvas: TetrisCanvas,
    hud: ["score", "lines", "level"],
    controls:
      "← → MOVER · ↑ ROTAR · ↓ CAÍDA SUAVE · ESPACIO CAÍDA DURA · P PAUSA",
    startTitle: "CAÍDA",
    startHint: "PULSA ESPACIO PARA EMPEZAR",
    touch: touchLayout<TetrisAction>([
      { slot: "left", action: "moveLeft", label: "MOVER", repeat: true },
      { slot: "right", action: "moveRight", label: "MOVER", repeat: true },
      { slot: "down", action: "softDrop", label: "BAJAR", repeat: true },
      { slot: "a", action: "rotate", label: "ROTAR" },
      { slot: "b", action: "hardDrop", label: "SOLTAR" },
    ]),
  },
  "bloque-buster": {
    Canvas: BloqueBusterCanvas,
    hud: ["score", "lives", "level"],
    controls: "← → MOVER PALA · RATÓN MOVER PALA · P PAUSA",
    startTitle: "BLOQUE BUSTER",
    startHint: "PULSA ESPACIO PARA EMPEZAR",
    touch: touchLayout<BloqueBusterAction>([
      { slot: "left", action: "left", label: "MOVER" },
      { slot: "right", action: "right", label: "MOVER" },
    ]),
  },
  serpentina: {
    Canvas: SerpentinaCanvas,
    hud: ["score", "level"],
    controls: "← ↑ → ↓ / WASD MOVER · P PAUSA",
    startTitle: "SERPENTINA",
    startHint: "PULSA ESPACIO PARA EMPEZAR",
    touch: touchLayout<SerpentinaAction>([
      { slot: "up", action: "up", label: "" },
      { slot: "down", action: "down", label: "" },
      { slot: "left", action: "left", label: "" },
      { slot: "right", action: "right", label: "" },
    ]),
  },
  ranaria: {
    Canvas: RanariaCanvas,
    hud: ["score", "lives", "level"],
    controls: "← ↑ → ↓ / WASD SALTAR · P PAUSA",
    startTitle: "RANARIA",
    startHint: "PULSA ESPACIO PARA EMPEZAR",
    touch: touchLayout<RanariaAction>([
      { slot: "up", action: "up", label: "" },
      { slot: "down", action: "down", label: "" },
      { slot: "left", action: "left", label: "" },
      { slot: "right", action: "right", label: "" },
    ]),
  },
};
