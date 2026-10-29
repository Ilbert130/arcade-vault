# Propuesta B — FORMACIÓN

**Tema:** Invasores · **Ángulo:** B — Puzzle / estrategia

| Campo | Valor                                                                                                                                     |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| id    | `formacion`                                                                                                                               |
| title | FORMACIÓN                                                                                                                                 |
| cat   | PUZZLE                                                                                                                                    |
| color | cyan                                                                                                                                      |
| cover | `cover-formacion` (nueva: rejilla 3×4 de invasores pixelados de cuatro colores sobre fondo azul noche, con un cursor cian doble en medio) |
| short | Reordena la flota alienígena antes de que aterrice.                                                                                       |

**Long:** La flota invasora desciende fila a fila desde la nave nodriza. Intercepta sus comunicaciones, intercambia a los alienígenas de posición y alinea tres de la misma especie para provocar un cortocircuito. Encadena reacciones antes de que la formación toque tu línea de defensa.

**Pitch:** Eres un hacker de la resistencia infiltrado en la red de mando alienígena: no disparas, **reorganizas**. La formación cuelga de la nave nodriza y baja una fila cada pocos segundos; con un cursor doble intercambias invasores vecinos en horizontal y, al alinear 3 o más de la misma especie, explotan y los de abajo "suben" a rellenar el hueco, lo que puede desatar cadenas en cascada que multiplican la puntuación. Cada nivel acelera la bajada y suma especies, y el botón PROVOCAR permite traer la siguiente fila antes de tiempo a cambio de puntos: arriesgar o respirar es la decisión de cada segundo.

**Por qué encaja con el tema:** La pieza de juego es la formación invasora clásica que desciende hacia la superficie; la presión de tiempo es literalmente la invasión aterrizando, y la mecánica consiste en desordenar su formación desde dentro.

### Autoevaluación (1–5)

| Criterio                | Nota | Motivo                                                                                                                                  |
| ----------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Estética                | 5    | Invasores pixel art de 2 fotogramas en neón, explosiones de partículas y línea de defensa parpadeante: encaja de lleno en el CRT.       |
| Puntuación              | 5    | Base por invasor, bonus por grupo grande, multiplicador de cadena y nivel, y bonus por PROVOCAR: el ranking separa bien a los expertos. |
| Viabilidad técnica      | 4    | Rejilla 8×11, detección de líneas y compactación por columnas; lo más delicado son las animaciones encadenadas (máquina de estados).    |
| Controles               | 5    | Flechas/WASD para el cursor, Espacio para intercambiar, X para provocar. Sin diagonales ni ratón.                                       |
| Equilibrio del catálogo | 4    | Segundo PUZZLE (tras CAÍDA) pero con mecánica distinta (intercambio + cadenas, no encaje de piezas) y color cyan.                       |
| Esfuerzo (5 = poco)     | 3    | Desde cero, sin assets; lógica de rejilla sencilla pero muchas pequeñas animaciones.                                                    |
| Identidad               | 5    | "Space Invaders al revés convertido en puzzle": reconocible al instante y propio de la plataforma.                                      |

<!-- SPEC -->

# 11 — FORMACIÓN: puzzle de intercambio contra una flota invasora que desciende

**Estado:** Borrador
**Depende de:** SPEC 05-asteroides-rocas, SPEC 06-leaderboard-tabla-juegos, SPEC 10-snake-serpentina
**Fecha:** 2026-10-18

**Objetivo:** Crear FORMACIÓN desde cero como motor TS jugable en el CRT de `/juegos/formacion/jugar`, insertarlo en el catálogo (`playable = true`) y activar su leaderboard.

## Alcance

**Incluye:**

- Motor `lib/games/formacion/` (types, constants, entities, engine) con contrato `{ start, pause, resume, reset, destroy }` y callbacks `onHud`/`onGameOver`.
- Componente `components/games/FormacionCanvas.tsx` (patrón de `SerpentinaCanvas`).
- Entrada `formacion` en `components/games/registry.tsx` (HUD: Puntuación, Escudos [`lives`], Nivel; controles; overlay `FORMACIÓN` con `startHint` "ALINEA 3 INVASORES IGUALES").
- Migración `supabase/migrations/<timestamp>_formacion_playable.sql` con `insert` de la fila nueva (`playable = true`, `sort_order = 9`), aplicada con el MCP de Supabase + `get_advisors`.
- Estilos `.formacion-canvas` y portada nueva `.cover-formacion` en `app/globals.css` (diseñados con `/frontend-design`, tokens CRT existentes).
- Invasores dibujados de forma procedural en canvas a partir de bitmaps 8×8 propios (2 fotogramas por especie), sin assets externos.
- Controles:
  - `← → ↑ ↓` / `W A S D`: mover el cursor doble (ocupa 2 celdas horizontales contiguas).
  - `Espacio` / `Z`: intercambiar las dos celdas bajo el cursor.
  - `X` / `Shift`: PROVOCAR (hace bajar la siguiente fila de inmediato, +puntos).
  - Pausa: `P` / `Esc` (gestionada por `GamePlayer`).
- Reglas, puntuación y progresión detalladas en **Reglas del juego**.

**No incluye:**

- Sonido, música, modo versus o multijugador, soporte táctil o ratón.
- Invasores especiales (bombas, bloques de basura, comodines) y power-ups.
- Overlays de pausa/fin en canvas (los pinta `GamePlayer`).
- Anti-trampas ni cambios en `saveScore`, vistas o modal.
- Cambios en los demás juegos ni en `invasores` (fila sembrada que queda reservada para el SHOOTER).

## Reglas del juego

### Mundo y tablero

- Mundo lógico 800×600 (4:3). Tablero de **8 columnas × 11 filas**, celda de **44 px** → 352×484 px, con origen en `(224, 88)`; línea de defensa en `y = 572`.
- Franja superior `y = 40–88`: la nave nodriza (barra neón) y la **fila siguiente** en vista previa, que asoma gradualmente.
- Panel izquierdo (`x = 24–200`): barra vertical "PRÓXIMA OLA" con el tiempo restante hasta la siguiente fila.
- Panel derecho (`x = 600–776`): rótulo de cadena actual ("CADENA ×3") y último bonus obtenido, dibujados por el motor.

### Entidades

| Entidad        | Descripción                                                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invasor        | `{ species: 0..5, state: "idle" \| "swapping" \| "flashing" \| "rising", anim }`. 6 especies con forma y color propios: cyan `#00f5ff`, magenta `#ff006e`, amarillo `#f5ff00`, verde `#00ff88`, naranja `#ff7700`, violeta `#aa00ff`. |
| Columna        | Pila anclada arriba: los invasores ocupan las filas `0..len-1` sin huecos (la "gravedad" apunta hacia la nave nodriza).                                                                                                               |
| Cursor         | `{ col: 0..6, row: 0..10 }`, cubre `(col,row)` y `(col+1,row)`. Marco cian con brillo pulsante.                                                                                                                                       |
| Fila siguiente | Array de 8 especies generado por adelantado; se ve en la vista previa.                                                                                                                                                                |
| Partículas     | Explosión de 12 píxeles por invasor eliminado, vida 0,5 s (pool reutilizable).                                                                                                                                                        |

### Mecánica

1. **Intercambio:** con `Espacio`/`Z` se intercambian las celdas bajo el cursor (invasor↔invasor o invasor↔vacío). Animación de 0,1 s. No se puede intercambiar una celda en estado `flashing` o `rising`. Dos vacíos: no hace nada.
2. **Compactación:** si tras un intercambio una columna queda con hueco (un invasor movido a una columna más corta, o una columna que pierde un invasor por encima de otros), los invasores suben hasta quedar contiguos desde arriba (animación `rising` de 0,12 s por celda).
3. **Coincidencias:** tras cada intercambio o compactación se buscan líneas horizontales o verticales de **3 o más** invasores `idle` de la misma especie. Todos los invasores implicados (una cruz cuenta como un solo grupo) pasan a `flashing` 0,4 s y luego explotan.
4. **Cadenas:** si la compactación posterior a una explosión crea nuevas coincidencias, es una cadena; el contador de cadena sube (×2, ×3…). Vuelve a ×1 cuando el tablero queda estable sin coincidencias pendientes.
5. **Descenso:** cada `T(nivel)` segundos se inserta la fila siguiente en la fila 0 de cada columna, empujando todo una celda hacia abajo. Visualmente, la formación baja de forma continua (`offset = progreso × 44 px`) y se ajusta al insertar. El temporizador **se congela** mientras haya invasores en `flashing` o `rising` (recompensa por limpiar).
6. **PROVOCAR:** `X`/`Shift` inserta la fila siguiente de inmediato y reinicia el temporizador. Solo si no hay animaciones de limpieza en curso.
7. **Generación de filas:** especie aleatoria entre las activas del nivel, rechazando la elección si crea 3 iguales en horizontal dentro de la fila o 3 iguales en vertical con las 2 celdas que quedarán debajo. Al empezar se generan **5 filas** iniciales sin coincidencias.
8. **Ruptura de la línea de defensa:** si al insertar una fila alguna columna supera 11 invasores, se pierde 1 escudo (`lives`). El escudo detona: elimina los **3 invasores inferiores de cada columna** (sin puntos) y concede **2 s** de gracia con el temporizador congelado. Las columnas con 10 u 11 invasores parpadean en rojo como aviso.

### Puntuación

| Evento                                  | Puntos                                                   |
| --------------------------------------- | -------------------------------------------------------- |
| Invasor eliminado en un grupo           | `10 × nivel × cadena`                                    |
| Bonus de grupo grande (por invasor > 3) | `+20 × nivel × cadena` por cada invasor a partir del 4.º |
| Fila provocada con `X`/`Shift`          | `+5 × nivel`                                             |
| Formación limpia (tablero vacío)        | `+1000 × nivel`                                          |
| Intercambio, ruptura de defensa         | 0                                                        |

Ejemplo: grupo de 5 en nivel 3 con cadena ×2 → `5×10×3×2 + 2×20×3×2 = 300 + 240 = 540`. La puntuación se trunca a entero y se limita a 99.999.999.

### Progresión

- **Nivel** = `1 + floor(invasoresEliminados / 30)`, sin tope.
- **Intervalo de descenso** `T(nivel) = max(2,0 s, 8,0 − 0,6 × (nivel − 1))` (8,0 s en nivel 1, mínimo 2,0 s desde el nivel 11).
- **Especies activas:** 4 en niveles 1–2, 5 en niveles 3–5, 6 desde el nivel 6.

### Fin de partida

- Escudos a 0 → `phase = "gameover"` y `onGameOver(score)` una sola vez. No hay victoria: el juego es infinito.

### Constantes iniciales

| Constante                 | Valor                                              |
| ------------------------- | -------------------------------------------------- |
| `W × H`                   | 800 × 600                                          |
| `COLS × ROWS`             | 8 × 11                                             |
| `CELL`                    | 44 px                                              |
| `BOARD_X, BOARD_Y`        | 224, 88                                            |
| `INITIAL_ROWS`            | 5                                                  |
| `LIVES`                   | 3                                                  |
| `SWAP_TIME`               | 0,10 s                                             |
| `FLASH_TIME`              | 0,40 s                                             |
| `RISE_TIME`               | 0,12 s por celda                                   |
| `GRACE_TIME`              | 2,0 s                                              |
| `T_BASE / T_STEP / T_MIN` | 8,0 / 0,6 / 2,0 s                                  |
| `KILLS_PER_LEVEL`         | 30                                                 |
| `ANIM_FRAME`              | 0,5 s (alternancia de los 2 fotogramas del sprite) |
| `MAX_DT`                  | 0,05 s                                             |

## Modelo de datos

- Fila nueva en `public.games`: `id = 'formacion'`, `title = 'FORMACIÓN'`, `short = 'Reordena la flota alienígena antes de que aterrice.'`, `long` según la propuesta, `cat = 'PUZZLE'`, `cover = 'cover-formacion'`, `color = 'cyan'`, `playable = true`, `sort_order = 9` (1–8 ocupados por la semilla; si otra migración lo ocupa antes, usar el siguiente libre).
- HUD: `{ score, lives, level }`. Puntuación enviada: entero 0–99.999.999.
- Sin cambios de esquema → no se regeneran tipos.

## Archivos

```
lib/games/formacion/{types,constants,entities,engine}.ts   nuevo
components/games/FormacionCanvas.tsx                       nuevo
components/games/registry.tsx                              entrada nueva
app/globals.css                                            .formacion-canvas + .cover-formacion
supabase/migrations/<timestamp>_formacion_playable.sql     nuevo (insert)
references/implemented-games/implemented-games.md          fila nueva
CLAUDE.md                                                  lista de juegos jugables
specs/11-formacion.md                                      este spec
```

## Plan de implementación

1. Leer docs de Next 16.3.3 (Client Components) y como referencia `lib/games/serpentina/` y `SerpentinaCanvas.tsx`.
2. `types.ts` (`FormacionHud`, `FormacionCallbacks`, `FormacionGame`, `Cell`, `Species`) y `constants.ts` (tamaños, tiempos, paleta copiada de los tokens, bitmaps 8×8 de las 6 especies × 2 fotogramas).
3. `entities.ts`: funciones puras de rejilla (`findMatches`, `compact`, `generateRow`, `insertRow`) y de dibujo (`drawInvader`, `drawCursor`, `drawBoard`, `drawParticles`) con `ctx` por parámetro.
4. `engine.ts`: estado en closure, `phase`, máquina de estados del tablero (`stable` → `swapping` → `resolving` [flash → explosión → compactación → recomprobación]), temporizador de descenso congelable, teclas en `start()`/`destroy()` con `preventDefault` para flechas y Espacio, `onHud` solo al cambiar.
5. `FormacionCanvas.tsx` con el mapeo de transiciones de `status`.
6. Registry + CSS (`.formacion-canvas`, `.cover-formacion`) con `/frontend-design`.
7. Migración `insert ... playable = true` aplicada con el MCP + `get_advisors`.
8. Actualizar `implemented-games.md` y `CLAUDE.md`.
9. Verificación manual (invitado, con sesión, detalle, Salón, otros juegos intactos) y `npm run build` / `npm run lint`.

## Criterios de aceptación

- [ ] El juego no arranca hasta pulsar EMPEZAR/Espacio; pausa (P/Esc/botón y automática) y fin funcionan.
- [ ] El cursor se mueve dentro de los límites (col 0–6, fila 0–10); el intercambio funciona invasor↔invasor e invasor↔vacío y respeta los estados bloqueados.
- [ ] Las líneas de 3+ (horizontales, verticales y en cruz) se eliminan; las columnas se compactan hacia arriba y las cadenas multiplican la puntuación según la tabla.
- [ ] La formación baja una fila cada `T(nivel)`; el temporizador se congela durante limpiezas; PROVOCAR suma `5 × nivel`.
- [ ] Las filas generadas nunca contienen coincidencias inmediatas.
- [ ] Al romper la línea de defensa se pierde 1 escudo, se eliminan los 3 invasores inferiores de cada columna y hay 2 s de gracia; con 0 escudos se llama a `onGameOver` una vez.
- [ ] `onHud` solo al cambiar `score`, `lives` o `level`.
- [ ] Sin `any`/`@ts-ignore`, sin globals mutables, sin acceso a DOM/`window` en el cuerpo del módulo.
- [ ] Sin rAF ni listeners residuales al salir de la página; canvas 4:3 nítido en HiDPI.
- [ ] Flechas y Espacio no hacen scroll ni activan botones durante la partida; teclas no quedan pegadas tras pausar.
- [ ] Fila `formacion` en el proyecto remoto con `playable = true`; aparece en Home, Biblioteca (filtro PUZZLE) y Salón con la portada `.cover-formacion`; `get_advisors` sin avisos nuevos.
- [ ] Invitado: "INICIA SESIÓN PARA GUARDAR TU MARCA" → `/auth`. Con sesión: se guarda y aparece en `/juegos/formacion` y `/salon?juego=formacion`.
- [ ] ROCAS, CAÍDA, BLOQUE BUSTER, SERPENTINA y los simulados no cambian.
- [ ] `npm run build` y `npm run lint` sin errores; consola sin errores.

## Decisiones tomadas y descartadas

- **Gravedad hacia arriba (columnas colgando de la nave nodriza).** Hace que la formación "descienda" como la de los invasores clásicos y que la línea de defensa sea el suelo. _Descartado:_ gravedad normal con filas que suben desde abajo (pierde la lectura de invasión).
- **Cursor doble con intercambio horizontal.** Una sola acción, fácil con teclado y sin selección en dos pasos. _Descartado:_ selección libre de dos celdas (más lenta, se parece a `gemas`).
- **Sin relleno automático:** el tablero solo crece por el descenso. Así el jugador controla la presión y PROVOCAR tiene sentido. _Descartado:_ relleno tipo match-3 clásico.
- **Escudos (`lives`) en lugar de muerte súbita.** Partidas algo más largas y perdón al primer error. _Descartado:_ fin inmediato al tocar la línea.
- **Temporizador congelado durante limpiezas.** Premia las cadenas y da respiro. _Descartado:_ reloj continuo (demasiado castigador en niveles altos).
- **Sprites procedurales (bitmaps 8×8 en constantes).** Sin assets ni carga asíncrona. _Descartado:_ PNG en `public/games/formacion/`.
- **Id `formacion` con insert nuevo.** `invasores` queda para el SHOOTER clásico. _Descartado:_ reutilizar la fila `invasores`.

## Riesgos identificados

- StrictMode (doble montaje), Espacio compartido con la página, foco en botones, callbacks obsoletos, rendimiento de `shadowBlur` (88 invasores con brillo: cachear sprites en un canvas offscreen por especie y fotograma), teclas pegadas al pausar.
- Máquina de estados de animaciones: intercambios durante compactaciones o cadenas pueden dejar estados inconsistentes; resolver siempre sobre celdas `idle` y recomprobar tras cada compactación.
- Detección de cadenas: decidir con claridad cuándo se reinicia el contador (solo cuando no queda ninguna celda `flashing`/`rising`).
- Equilibrio: con 4 especies en una rejilla de 8 columnas puede haber demasiadas coincidencias fortuitas; ajustar `T_BASE` y especies activas tras probar.
- `sort_order = 9` puede chocar si otra propuesta de la jam o un juego nuevo se migra antes; comprobar el catálogo remoto antes de aplicar.
- Diferenciación con `caida` (también PUZZLE): la portada y el color cyan deben distinguirlo visualmente en la Biblioteca.
