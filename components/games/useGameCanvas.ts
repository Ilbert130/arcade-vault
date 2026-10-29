"use client";
import { useEffect, useRef } from "react";
import type {
  CreateGame,
  GameEngine,
  GameRenderProps,
  GameStatus,
  GenericHud,
} from "@/lib/games/platform/contract";
// Ciclo de vida común de todos los Canvas: crea el motor una vez, lo expone al mando
// táctil por `inputRef`, aplica la skin y traduce `status` a start/pause/resume/reset.
export function useGameCanvas<G extends GameEngine, H extends GenericHud>(
  createGame: CreateGame<G, H>,
  { status, skin, onHud, onGameOver, inputRef }: GameRenderProps,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<G | null>(null);
  const prevStatusRef = useRef<GameStatus>("ready");
  // Callbacks en refs: el motor se crea una vez y siempre llama a la versión más reciente.
  const onHudRef = useRef(onHud);
  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onHudRef.current = onHud;
    onGameOverRef.current = onGameOver;
  }, [onHud, onGameOver]);
  // Skin inicial por ref: cambiarla no recrea el motor (lo hace setSkin).
  const skinRef = useRef(skin);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = createGame(
      canvas,
      {
        onHud: (hud) => onHudRef.current(hud),
        onGameOver: (finalScore) => onGameOverRef.current(finalScore),
      },
      skinRef.current,
    );
    gameRef.current = game;
    inputRef.current = game;
    prevStatusRef.current = "ready";
    return () => {
      // Antes de destroy(): con StrictMode, el ref no apunta a un motor destruido.
      inputRef.current = null;
      game.destroy();
      gameRef.current = null;
    };
  }, [createGame, inputRef]);
  useEffect(() => {
    skinRef.current = skin;
    gameRef.current?.setSkin?.(skin);
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
  return canvasRef;
}
