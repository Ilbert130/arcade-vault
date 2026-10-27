import type { SkinId } from "../skins";
export type RanariaHud = {
  score: number;
  lives: number;
  level: number;
};
export type RanariaCallbacks = {
  /** Se llama solo cuando cambia score, lives o level (no en cada frame). */
  onHud: (hud: RanariaHud) => void;
  /** Se llama una vez, al perder la última vida (después de onHud con lives 0). */
  onGameOver: (finalScore: number) => void;
};
export type RanariaGame = {
  start: () => void; // partida desde cero y bucle rAF
  pause: () => void; // congela update (sigue dibujando el último frame)
  resume: () => void; // continúa; reinicia el reloj de dt
  reset: () => void; // estado inicial sin arrancar
  destroy: () => void; // cancela rAF y elimina listeners
  press: (action: string) => void; // = keydown de la acción; desconocidas se ignoran
  release: (action: string) => void; // = keyup de la acción
  releaseAll: () => void; // suelta todas las acciones mantenidas
  setSkin: (id: SkinId) => void; // cambia la skin y redibuja el frame actual
};
export type Direction = "up" | "down" | "left" | "right";
/** Acciones de entrada del motor (teclado y mando táctil): un salto por dirección. */
export type RanariaAction = Direction;
export type EntityType = "car" | "truck" | "log" | "turtle";
export type Entity = {
  /** Columna del borde izquierdo, en celdas (fraccionaria al moverse). */
  col: number;
  /** Ancho en celdas. */
  width: number;
  type: EntityType;
  /** Solo tortugas: bajo el agua no sirven de apoyo. */
  submerged?: boolean;
  /** Solo tortugas: segundos dentro de su ciclo de inmersión (independiente por grupo). */
  cycleT?: number;
};
export type Lane = {
  row: number;
  /** Celdas por segundo, siempre positiva; el sentido va en `dir`. */
  speed: number;
  dir: 1 | -1;
  /** Longitud (celdas) del bucle del carril: al salir por un lado reentra con el hueco intacto. */
  period: number;
  entities: Entity[];
};
export type Frog = {
  col: number;
  row: number;
  animating: boolean;
  /** Segundos transcurridos del salto en curso. */
  animT: number;
  targetCol: number;
  targetRow: number;
};
