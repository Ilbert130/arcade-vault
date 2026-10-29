"use client";
import { createRanariaGame } from "@/lib/games/ranaria/engine";
import type { GameRenderProps } from "@/lib/games/platform/contract";
import { useGameCanvas } from "@/components/games/useGameCanvas";
export default function RanariaCanvas(props: GameRenderProps) {
  const canvasRef = useGameCanvas(createRanariaGame, props);
  return (
    <canvas
      ref={canvasRef}
      className="ranaria-canvas"
      aria-label="RANARIA: campo de juego"
    />
  );
}
