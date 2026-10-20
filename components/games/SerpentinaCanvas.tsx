"use client";
import { useEffect, useRef } from "react";
import type { SkinId } from "@/lib/games/skins";
import { createSerpentinaGame } from "@/lib/games/serpentina/engine";
import type {
  SerpentinaGame,
  SerpentinaHud,
} from "@/lib/games/serpentina/types";
export type SerpentinaStatus = "ready" | "playing" | "paused" | "over";
type SerpentinaCanvasProps = {
  status: SerpentinaStatus;
  onHud: (hud: SerpentinaHud) => void;
  onGameOver: (finalScore: number) => void;
  skin: SkinId;
};
export default function SerpentinaCanvas({
  status,
  onHud,
  onGameOver,
  skin,
}: SerpentinaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<SerpentinaGame | null>(null);
  const prevStatusRef = useRef<SerpentinaStatus>("ready");
  // Callbacks en refs: el motor se crea una vez y siempre llama a la versión más reciente.
  const onHudRef = useRef(onHud);
  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onHudRef.current = onHud;
    onGameOverRef.current = onGameOver;
  }, [onHud, onGameOver]);
  // Skin inicial por ref: cambiarla no recrea el motor.
  const skinRef = useRef(skin);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = createSerpentinaGame(
      canvas,
      {
        onHud: (hud) => onHudRef.current(hud),
        onGameOver: (finalScore) => onGameOverRef.current(finalScore),
      },
      skinRef.current,
    );
    gameRef.current = game;
    prevStatusRef.current = "ready";
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);
  useEffect(() => {
    skinRef.current = skin;
    gameRef.current?.setSkin(skin);
  }, [skin]);
  useEffect(() => {
    const game = gameRef.current;
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (!game || prev === status) return;
    if (prev === "ready" && status === "playing") game.start();
    else if (prev === "playing" && status === "paused") game.pause();
    else if (prev === "paused" && status === "playing") game.resume();
    else if (status === "over") game.pause();
    else if (prev === "over" && status === "ready") game.reset();
  }, [status]);
  return (
    <canvas
      ref={canvasRef}
      className="serpentina-canvas"
      aria-label="SERPENTINA: campo de juego"
    />
  );
}
