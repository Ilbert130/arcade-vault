"use client";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { createAsteroidsGame } from "@/lib/games/asteroids/engine";
import type { AsteroidsGame, AsteroidsHud } from "@/lib/games/asteroids/types";
import type { SkinId } from "@/lib/games/skins";
import type { GameInput } from "@/lib/games/touch";
export type AsteroidsStatus = "ready" | "playing" | "paused" | "over";
type AsteroidsCanvasProps = {
  status: AsteroidsStatus;
  skin: SkinId;
  onHud: (hud: AsteroidsHud) => void;
  onGameOver: (finalScore: number) => void;
  inputRef?: RefObject<GameInput | null>;
};
export default function AsteroidsCanvas({
  status,
  skin,
  onHud,
  onGameOver,
  inputRef,
}: AsteroidsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<AsteroidsGame | null>(null);
  const prevStatusRef = useRef<AsteroidsStatus>("ready");
  // Callbacks en refs: el motor se crea una vez y siempre llama a la versión más reciente.
  const onHudRef = useRef(onHud);
  const onGameOverRef = useRef(onGameOver);
  // Skin inicial por ref: cambiarla no recrea el motor (lo hace setSkin).
  const skinRef = useRef(skin);
  useEffect(() => {
    onHudRef.current = onHud;
    onGameOverRef.current = onGameOver;
  }, [onHud, onGameOver]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = createAsteroidsGame(
      canvas,
      {
        onHud: (hud) => onHudRef.current(hud),
        onGameOver: (finalScore) => onGameOverRef.current(finalScore),
      },
      skinRef.current,
    );
    gameRef.current = game;
    if (inputRef) inputRef.current = game;
    prevStatusRef.current = "ready";
    return () => {
      // Antes de destroy(): con StrictMode, el ref no apunta a un motor destruido.
      if (inputRef) inputRef.current = null;
      game.destroy();
      gameRef.current = null;
    };
  }, [inputRef]);
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
      className="asteroids-canvas"
      aria-label="ROCAS: campo de asteroides"
    />
  );
}
