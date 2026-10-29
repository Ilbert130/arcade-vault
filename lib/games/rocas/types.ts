import type { SkinId } from "@/lib/games/platform/skins";
export type RocasHud = {
  score: number;
  lives: number;
  level: number;
};
export type RocasCallbacks = {
  /** Se llama solo cuando cambia score, lives o level (no en cada frame). */
  onHud: (hud: RocasHud) => void;
  /** Se llama una vez cuando lives llega a 0. */
  onGameOver: (finalScore: number) => void;
};
export type RocasGame = {
  start: () => void; // inicia la partida desde cero y el bucle rAF
  pause: () => void; // congela update (sigue dibujando el último frame)
  resume: () => void; // continúa; reinicia el reloj de dt
  reset: () => void; // estado inicial (score 0, lives 3, level 1) sin arrancar
  setSkin: (id: SkinId) => void; // cambia la skin (solo cosmética) y redibuja
  destroy: () => void; // cancela rAF y elimina listeners de teclado
  press: (action: string) => void; // = keydown de la acción; desconocidas se ignoran
  release: (action: string) => void; // = keyup de la acción
  releaseAll: () => void; // suelta todas las acciones mantenidas
};
/** Acciones de entrada del motor (teclado y mando táctil). */
export type RocasAction = "rotateLeft" | "rotateRight" | "thrust" | "fire";
/** Mapa de acciones mantenidas. */
export type ActionMap = Partial<Record<RocasAction, boolean>>;
