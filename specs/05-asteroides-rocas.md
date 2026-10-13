# 05 — ROCAS: juego de Asteroides real en la plataforma

**Estado:** Implementado
**Depende de:** SPEC 04-supabase-auth
**Fecha:** 2026-09-30

**Objetivo:** Portar a TypeScript el juego de Asteroides de `references/started-games/02-asteroids/` y ejecutarlo en `/juegos/rocas/jugar` dentro del marco CRT, con el HUD y el modal de fin de partida de React mostrando puntuación, vidas y nivel reales.

## Alcance

**Incluye:**

- Motor del juego portado a TypeScript en `lib/games/asteroids/` (sin variables globales ni acceso a `document`):
  - Clases tipadas `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle`, con la misma mecánica y constantes del original (rotación, empuje, fricción, tamaños, puntos 20/50/100, división de asteroides, 3 vidas, invencibilidad con parpadeo, niveles con `3 + nivel` asteroides, power-up de disparo triple "3x").
  - Fábrica `createAsteroidsGame(canvas, callbacks)` que devuelve un controlador `start / pause / resume / reset / destroy`.
  - Mundo lógico fijo de 800×600 con envolvimiento toroidal; `dt` limitado a 50 ms.
  - Gestión de teclado propia (listeners en `window` que se añaden en `start` y se eliminan en `destroy`); `preventDefault` de flechas y Espacio solo mientras la partida está en curso, para no hacer scroll ni activar botones con foco.
  - Al pausar se limpian las teclas presionadas; al reanudar se reinicia el reloj (`lastTime = null`) para evitar un salto de `dt`.
- Se mantiene el HUD del canvas (`drawHUD`) con la misma disposición del original: `SCORE  n` arriba a la izquierda, `NIVEL n` centrado arriba, iconos de nave por cada vida arriba a la derecha (`drawLifeIcon`) y el indicador del power-up activo (`3x  4.2s`) bajo la puntuación. Se reestiliza con la paleta neón (texto `--ink`, iconos de vida `--cyan`, indicador `3x` `--green`) y fuente monoespaciada. Solo se elimina el overlay "GAME OVER" del canvas (`drawOverlay`), que sustituye el modal de React.
- Paleta neón del Vault en el canvas (constantes en el motor que replican los tokens de `app/globals.css`): nave `--cyan`, asteroides `--magenta`, balas `--yellow`, power-up `--green`, partículas `--ink`, con `shadowBlur` para el glow. Fondo negro.
- Componente cliente `components/games/AsteroidsCanvas.tsx`:
  - Renderiza un `<canvas>` que ocupa todo `.crt-screen` (que ya es 4:3); resolución interna `800·dpr × 600·dpr` escalada con `ctx.setTransform` para nitidez en pantallas HiDPI; tamaño visual por CSS (100 % × 100 %).
  - Crea el motor en `useEffect` y lo destruye en el cleanup (compatible con el doble montaje de StrictMode).
  - Recibe por props el estado deseado (`status`) y expone eventos al padre (`onHud`, `onGameOver`).
- Cambios en `app/juegos/[id]/jugar/page.tsx`:
  - Si `game.id === "rocas"`: monta `AsteroidsCanvas` en lugar de `.game-arena` y desactiva el intervalo de puntuación simulada; el HUD de la página (`player-hud`) también muestra puntuación, vidas (♥ reales) y nivel que emite el motor, sincronizado con el HUD del canvas.
  - Máquina de estados de la partida: `"ready" | "playing" | "paused" | "over"`.
  - Estado `ready`: overlay en el CRT "PULSA ESPACIO PARA EMPEZAR" (con el estilo `.crt-content`) y un botón EMPEZAR; Espacio o el botón inician la partida.
  - `P` o `Escape` alternan pausa/reanudar; el botón PAUSA/REANUDAR existente hace lo mismo y reutiliza el overlay "EN PAUSA".
  - Auto-pausa en `visibilitychange` (pestaña oculta) y `blur` de la ventana si la partida está en `playing`.
  - Game over del motor (vidas = 0) → estado `over` → se abre el modal "FIN DEL JUEGO" existente con la puntuación final.
  - Botón FIN → detiene el motor y abre el modal con la puntuación actual (se puede guardar).
  - "GUARDAR PUNTUACIÓN" usa `saveScore` de `lib/session.ts` sin cambios.
  - "JUGAR DE NUEVO" → `reset()` del motor y vuelve a `ready`. SALIR y VOLVER AL VAULT destruyen el motor al desmontar.
  - El nombre del jugador sigue saliendo de `getCurrentUsername()` o `"INVITADO"` (SPEC 04).
- El resto de juegos (`bloque-buster`, `caida`, `serpentina`, `gloton`, `invasores`, `ranaria`, `duelo-pixel`) mantiene exactamente la simulación actual.
- `.crt-bottom` muestra la etiqueta de controles para ROCAS: `← → ROTAR · ↑ PROPULSAR · ESPACIO DISPARAR · P PAUSA`.

**No incluye (fuera de alcance de este spec):**

- Puntuaciones en Supabase (tabla `scores`, leaderboard real, Salón de la Fama con datos reales) → spec futuro.
- Controles táctiles / soporte móvil jugable, WASD o mandos (gamepad).
- Sonido y música.
- OVNIs u otras mecánicas que no existen en el juego original (aunque el texto `long` de ROCAS los menciona, no se modifica el catálogo en este spec).
- Cambios en `lib/data.ts` (título, portada, `best`, `plays`) o en la página de detalle `/juegos/rocas`.
- Portar Tetris, Arkanoid u otros juegos de `references/started-games/`.
- Modificar o eliminar los archivos de `references/started-games/02-asteroids/` (siguen como referencia, excluidos de ESLint).
- Anti-trampas o validación server-side de puntuaciones.

## Modelo de datos

No hay datos persistentes nuevos: la puntuación se sigue guardando con `saveScore` en `localStorage` (`av_scores`). Solo se introducen tipos TypeScript.

### Motor (`lib/games/asteroids/types.ts`)

```ts
export type AsteroidsHud = {
  score: number;
  lives: number;
  level: number;
};

export type AsteroidsCallbacks = {
  /** Se llama solo cuando cambia score, lives o level (no en cada frame). */
  onHud: (hud: AsteroidsHud) => void;
  /** Se llama una vez cuando lives llega a 0. */
  onGameOver: (finalScore: number) => void;
};

export type AsteroidsGame = {
  start: () => void; // inicia la partida desde cero y el bucle rAF
  pause: () => void; // congela update (sigue dibujando el último frame)
  resume: () => void; // continúa; reinicia el reloj de dt
  reset: () => void; // estado inicial (score 0, lives 3, level 1) sin arrancar
  destroy: () => void; // cancela rAF y elimina listeners de teclado
};
```

```ts
// lib/games/asteroids/engine.ts
export function createAsteroidsGame(
  canvas: HTMLCanvasElement,
  callbacks: AsteroidsCallbacks,
): AsteroidsGame;
```

Estado interno del motor (privado al closure): `ship`, `bullets`, `asteroids`, `particles`, `powerUps`, `score`, `lives`, `level`, `phase: "idle" | "playing" | "dead" | "paused" | "gameover"`, `deadTimer`, `powerUpSpawned`, `killsSinceSpawn`, `keys`, `justPressed`, `rafId`, `lastTime`.

### Componente (`components/games/AsteroidsCanvas.tsx`)

```ts
type AsteroidsCanvasProps = {
  status: "ready" | "playing" | "paused" | "over";
  onHud: (hud: AsteroidsHud) => void;
  onGameOver: (finalScore: number) => void;
};
```

Transiciones de `status` → motor: `ready→playing` = `start()`, `playing→paused` = `pause()`, `paused→playing` = `resume()`, `playing|paused→over` = `pause()` (FIN), `over→ready` = `reset()`.

### Archivos

```
lib/games/asteroids/
  types.ts        tipos públicos
  constants.ts    W, H, RADII, SPEEDS, POINTS, power-up, paleta neón
  entities.ts     Bullet, Asteroid, PowerUp, Ship, Particle
  engine.ts       createAsteroidsGame (bucle, input, colisiones, niveles, draw)
components/games/
  AsteroidsCanvas.tsx
```

## Plan de implementación

1. **Documentación.** Leer en `node_modules/next/dist/docs/` lo relevante a client components y `useParams` / `PageProps` en Next.js 16.3.3 antes de tocar `jugar/page.tsx`. Releer `references/started-games/02-asteroids/game.js` completo.
2. **Tipos y constantes.** Crear `lib/games/asteroids/types.ts` y `constants.ts` (incluida la paleta neón con los hex de `globals.css`). `npm run build` pasa.
3. **Entidades.** Crear `entities.ts` con las cinco clases tipadas; cada `draw` recibe `ctx: CanvasRenderingContext2D` por parámetro en lugar de usar un global. `Ship.update` recibe el mapa de teclas. Sin cambios de mecánica respecto al original.
4. **Motor.** Crear `engine.ts` con `createAsteroidsGame`: estado en closure, `initGame`/`nextLevel`/`killShip`/`explode`, colisiones, bucle `requestAnimationFrame` con cap de 50 ms, listeners de teclado con `preventDefault` condicionado, emisión de `onHud` solo al cambiar valores y `onGameOver` una sola vez. `draw` con `drawHUD` (score, nivel, iconos de vida, indicador `3x`) en paleta neón y glow, sin `drawOverlay`. Escalado por `devicePixelRatio`.
5. **AsteroidsCanvas.** Crear `components/games/AsteroidsCanvas.tsx` (`"use client"`): `useRef` del canvas, creación del motor en `useEffect` con `destroy` en el cleanup, callbacks guardados en refs para no recrear el motor, y un `useEffect` sobre `status` que aplica las transiciones del modelo de datos.
6. **Integración en `/jugar`.** En `app/juegos/[id]/jugar/page.tsx`:
   - Añadir `status` (`"ready" | "playing" | "paused" | "over"`) y `lives` real para ROCAS; el intervalo simulado se ejecuta solo si `game.id !== "rocas"`.
   - Si es ROCAS: renderizar `AsteroidsCanvas` dentro de `.crt-screen`, overlay de inicio en `ready`, overlay "EN PAUSA" en `paused`, modal al pasar a `over`.
   - Listener de teclado de página: Espacio en `ready` → `playing`; `P`/`Escape` alternan pausa. Listeners de `visibilitychange` y `blur` → `paused` si estaba `playing`. Cleanup de todos.
   - FIN → `over`; JUGAR DE NUEVO → `ready` con score/lives/level a sus valores iniciales y `saved = false`.
   - Etiqueta de controles en `.crt-bottom` solo para ROCAS.
   - Los demás juegos se comportan exactamente igual que antes.
7. **Diseño.** Aplicar `/frontend-design` para el overlay de inicio, el HUD del canvas (incluido el indicador `3x`) y la paleta del canvas, de forma coherente con el CRT y los estilos existentes (estilos nuevos en `globals.css` si hacen falta).
8. **Verificación manual.** `npm run dev`:
   - `/juegos/rocas/jugar` muestra el overlay "PULSA ESPACIO PARA EMPEZAR"; la nave no se mueve hasta pulsar Espacio o EMPEZAR.
   - Flechas rotan/propulsan y Espacio dispara sin hacer scroll de la página.
   - Destruir un asteroide grande suma 20, mediano 50, pequeño 100 en el HUD del canvas y en el de React; vaciar el campo sube el nivel en ambos.
   - Chocar resta una vida (icono de nave en el canvas, ♥ en React) en ambos HUD; con 0 vidas se abre el modal con la puntuación final; guardarla añade la entrada a `av_scores` en `localStorage`.
   - P, Escape y el botón PAUSA pausan/reanudan; cambiar de pestaña pausa automáticamente y al volver no hay salto de posiciones.
   - FIN abre el modal con la puntuación actual; JUGAR DE NUEVO vuelve a `ready` con 0 / ♥♥♥ / 01.
   - SALIR navega a `/juegos/rocas` y, al volver a jugar, no quedan listeners ni bucles duplicados (la nave no va al doble de velocidad).
   - `/juegos/caida/jugar` (y el resto) siguen mostrando la simulación anterior.
   - El canvas se ve nítido y escala con el ancho de la ventana manteniendo 4:3.
   - `npm run build` y `npm run lint` sin errores; consola del navegador sin errores.

## Criterios de aceptación

- [x] Existen `lib/games/asteroids/{types,constants,entities,engine}.ts` y `components/games/AsteroidsCanvas.tsx`, sin `any` ni `@ts-ignore`.
- [x] El motor no usa variables globales de módulo mutables ni `document.getElementById`; todo el estado vive en el closure de `createAsteroidsGame`.
- [x] `/juegos/rocas/jugar` ejecuta el juego real en un `<canvas>` dentro de `.crt-screen`; el resto de ids conserva la simulación anterior.
- [x] La partida no empieza hasta pulsar Espacio o EMPEZAR en el overlay de inicio.
- [x] Puntos por asteroide: grande 20, mediano 50, pequeño 100; los grandes y medianos se dividen en dos.
- [x] El canvas dibuja su HUD (puntuación, nivel, iconos de vida, indicador `3x`) en paleta neón, y el HUD de React refleja los mismos valores reales del motor; el canvas no dibuja el overlay "GAME OVER".
- [x] `onHud` no se emite en cada frame (solo al cambiar un valor).
- [x] El power-up 3x aparece, otorga 5 s de disparo triple y su indicador se ve en el canvas.
- [x] Flechas y Espacio no provocan scroll ni activan botones mientras se juega.
- [x] P / Escape / botón PAUSA alternan la pausa; ocultar la pestaña o perder el foco pausa automáticamente.
- [x] Al llegar a 0 vidas o pulsar FIN se abre el modal "FIN DEL JUEGO" con la puntuación correcta, y "GUARDAR PUNTUACIÓN" la guarda con `saveScore`.
- [x] "JUGAR DE NUEVO" reinicia a puntuación 0, 3 vidas, nivel 01 y estado de inicio.
- [x] Salir de la página cancela el `requestAnimationFrame` y elimina todos los listeners (verificable entrando y saliendo varias veces sin aceleración ni errores).
- [x] El canvas mantiene 4:3, escala con el contenedor y se ve nítido en pantallas HiDPI.
- [x] Los colores del canvas usan la paleta neón del Vault (cyan, magenta, amarillo, verde).
- [x] `npm run build` y `npm run lint` completan sin errores y la consola del navegador no muestra errores en `/juegos/rocas/jugar`.

## Decisiones tomadas y descartadas

- **Reusar la entrada `rocas` del catálogo.** Ya describe un juego de asteroides y tiene portada propia; no requiere tocar `lib/data.ts`. _Descartado:_ nueva entrada `asteroids` o renombrar ROCAS (el texto que menciona OVNIs se deja para un ajuste de catálogo posterior).
- **Port a TypeScript con fábrica `createAsteroidsGame`.** Elimina globals, permite varios montajes seguros y comunicar el estado a React. _Descartado:_ `<iframe>` a `public/` (requiere `postMessage`, estilo aislado) y mover el JS sin tipar.
- **HUD en el canvas (como el original) y también en React; fin de partida en el modal de React.** El jugador ve puntuación, nivel y vidas dentro del CRT sin apartar la vista del juego, y `player-hud` sigue mostrando los datos reales (necesarios además para el modal y `saveScore`). El indicador temporal `3x` vive solo en el canvas para no emitir eventos a React cada décima de segundo. _Descartado:_ eliminar el HUD del canvas (pierde la información dentro de la pantalla) y el overlay "GAME OVER" en el canvas (duplicaría el modal).
- **Mundo lógico 800×600 escalado por CSS + `devicePixelRatio`.** Conserva la física y la dificultad del original en cualquier pantalla; `.crt-screen` ya es 4:3. _Descartado:_ tamaño fijo (scroll/recorte) y mundo dinámico (dificultad variable).
- **Controles: flechas + Espacio + P/Escape.** _Descartado:_ WASD y controles táctiles (alcance extra; posible spec futuro).
- **Paleta neón del Vault conservando los power-ups.** Integra el juego visualmente en el CRT sin perder mecánica. _Descartado:_ port visual 1:1 en blanco y negro, o quitar power-ups.
- **Puntuación en `localStorage` vía `saveScore`.** La persistencia en Supabase sigue reservada a su propio spec, como establece SPEC 04.
- **Overlay de inicio "PULSA ESPACIO".** Evita perder vidas mientras carga la página. _Descartado:_ arranque inmediato.
- **Auto-pausa al ocultar la pestaña o perder el foco.** _Descartado:_ confiar solo en el cap de `dt`.
- **FIN abre el modal y permite guardar.** Mantiene el comportamiento actual de la página. _Descartado:_ abandonar sin guardar.
- **Los demás juegos siguen con la simulación.** Cada juego real tendrá su propio spec. _Descartado:_ "Próximamente" u ocultarlos.

## Riesgos identificados

- **Doble montaje en StrictMode (dev).** Crear el motor dos veces duplicaría bucles y listeners; `destroy()` en el cleanup del `useEffect` debe cancelar el rAF y quitar todos los listeners.
- **Conflicto de Espacio entre página y motor.** Espacio sirve para empezar (página) y para disparar (motor); el motor solo procesa Espacio en `playing` y la página solo en `ready`, y `justPressed` se limpia en `start()` para que la pulsación de inicio no dispare.
- **Foco en botones.** Si un botón del HUD (PAUSA, FIN) tiene foco, Espacio lo activaría; el `preventDefault` en `keydown` durante `playing` lo evita, y conviene hacer `blur()` del botón tras pulsarlo.
- **Callbacks obsoletos.** Si el motor captura funciones de React del primer render, el HUD no se actualizará correctamente; se pasan a través de refs.
- **Rendimiento del glow.** `shadowBlur` en muchas partículas puede bajar FPS en equipos modestos; aplicarlo solo a nave, asteroides y power-up si se detecta caída.
- **Teclas "pegadas".** Si se suelta una tecla mientras la ventana no tiene foco, `keyup` no llega; al pausar (incluida la auto-pausa por `blur`) se limpia el mapa de teclas.
