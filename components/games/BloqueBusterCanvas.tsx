"use client";
import { createBloqueBusterGame } from "@/lib/games/bloque-buster/engine";
import type { GameRenderProps } from "@/lib/games/platform/contract";
import { useGameCanvas } from "@/components/games/useGameCanvas";
export default function BloqueBusterCanvas(props: GameRenderProps) {
  const canvasRef = useGameCanvas(createBloqueBusterGame, props);
  return (
    <canvas
      ref={canvasRef}
      className="bloque-buster-canvas"
      aria-label="BLOQUE BUSTER: campo de bloques"
    />
  );
}
