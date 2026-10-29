"use client";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { createTetrisGame } from "@/lib/games/tetris/engine";
import type { TetrisGame, TetrisHud } from "@/lib/games/tetris/types";
import type { GameInput } from "@/lib/games/touch";
export type TetrisStatus = "ready" | "playing" | "paused" | "over";
type TetrisCanvasProps = {
  status: TetrisStatus;
  onHud: (hud: TetrisHud) => void;
  onGameOver: (finalScore: number) => void;
  inputRef?: RefObject<GameInput | null>;
};
export default function TetrisCanvas({
  status,
  onHud,
  onGameOver,
  inputRef,
}: TetrisCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<TetrisGame | null>(null);
  const prevStatusRef = useRef<TetrisStatus>("ready");
  // Callbacks en refs: el motor se crea una vez y siempre llama a la versión más reciente.
  const onHudRef = useRef(onHud);
  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onHudRef.current = onHud;
    onGameOverRef.current = onGameOver;
  }, [onHud, onGameOver]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = createTetrisGame(canvas, {
      onHud: (hud) => onHudRef.current(hud),
      onGameOver: (finalScore) => onGameOverRef.current(finalScore),
    });
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
      className="tetris-canvas"
      aria-label="CAÍDA: tablero de piezas"
    />
  );
}
