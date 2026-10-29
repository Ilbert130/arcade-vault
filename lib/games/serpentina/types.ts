import type { SkinId } from "@/lib/games/platform/skins";
export type SerpentinaHud = {
  score: number;
  level: number;
};
export type SerpentinaCallbacks = {
  /** Se llama solo cuando cambia score o level (no en cada frame). */
  onHud: (hud: SerpentinaHud) => void;
  /** Se llama una vez: al chocar o al llenar la rejilla (victoria). */
  onGameOver: (finalScore: number) => void;
};
export type SerpentinaGame = {
  start: () => void; // partida desde cero y bucle rAF
  pause: () => void; // congela update (sigue dibujando el último frame)
  resume: () => void; // continúa; reinicia el reloj de dt
  reset: () => void; // estado inicial sin arrancar
  setSkin: (id: SkinId) => void; // cambia la skin y redibuja (solo cosmético)
  destroy: () => void; // cancela rAF y elimina listeners
  press: (action: string) => void; // = keydown de la acción; desconocidas se ignoran
  release: (action: string) => void; // = keyup de la acción
  releaseAll: () => void; // suelta todas las acciones mantenidas
};
/** Celda de la rejilla (col, row), no píxeles. */
export type Cell = { col: number; row: number };
export type Direction = "up" | "down" | "left" | "right";
/** Acciones de entrada del motor (teclado y mando táctil): una por dirección. */
export type SerpentinaAction = Direction;
export type FruitName =
  | "banana"
  | "orange"
  | "grape"
  | "garlic"
  | "eggplant"
  | "strawberry"
  | "cherry"
  | "carrot"
  | "mushroom"
  | "broccoli"
  | "watermelon"
  | "pepper"
  | "kiwi"
  | "lemon"
  | "peach"
  | "peanut"
  | "apple"
  | "tomato"
  | "berries"
  | "grapes2"
  | "pineapple"
  | "melon";
/** Región de fruits.png. */
export type SpriteRect = { x: number; y: number; w: number; h: number };
export type Fruit = Cell & { name: FruitName };
