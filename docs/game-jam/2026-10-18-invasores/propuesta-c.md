# Propuesta C — NODRIZA

**Tema:** Invasores · **Ángulo:** C — Wildcard / versus

| Campo | Valor                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------ |
| id    | `nodriza`                                                                                                                |
| title | NODRIZA                                                                                                                  |
| cat   | VERSUS                                                                                                                   |
| color | magenta                                                                                                                  |
| cover | `cover-nodriza` (nueva: platillo nodriza magenta arriba, haz de luz y rejilla de invasores sobre un cañón cyan diminuto) |
| short | Esta vez los invasores son tuyos. Aplasta al cañón.                                                                      |

**Long:** Por fin te toca el otro lado de la pantalla. Comanda una flota de invasores desde la nave nodriza, bombardea los búnkeres y acorrala al cañón terrestre que dispara sin descanso. Aterriza o destrúyelo antes de que te deje sin flota.

**Pitch:** El clásico de las filas alienígenas, pero al revés: tú mueves la formación completa (←/→), sueltas bombas desde la columna marcada por el haz de la nodriza (Espacio) y decides cuándo lanzarte en picado (↓) para acercarte al suelo. Enfrente, una CPU controla el cañón: esquiva tus bombas, apunta a tu columna más baja y dispara cada vez más rápido. Cada alien que pierdes hace a la flota más rápida pero más frágil, así que cada ronda es una apuesta entre bombardear con calma o arriesgarlo todo para aterrizar. Rondas de 40–90 s y una IA que se endurece por nivel hacen que siempre apetezca "una más".

**Por qué encaja con el tema:** Es el tema de los invasores visto desde dentro: la invasión es la mecánica (marcha en formación, descenso, aterrizaje como victoria) y el defensor es tu rival VERSUS.

### Autoevaluación (1–5)

| Criterio                | Nota | Motivo                                                                                                                  |
| ----------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------- |
| Estética                | 5    | Aliens pixel magenta, haz de tracción, cañón cyan y búnkeres que se desmoronan: CRT/neón puro, todo procedural.         |
| Puntuación              | 4    | Puntos por impacto, búnker, picado y bonus de ronda escalados por nivel; premia el riesgo. Fórmula con varios términos. |
| Viabilidad técnica      | 4    | Colisiones AABB, rejilla fija, sin assets. La IA del cañón (esquivar + apuntar) es la parte delicada.                   |
| Controles               | 5    | ←/→, Espacio y ↓. Se entiende en 5 segundos.                                                                            |
| Equilibrio del catálogo | 5    | Primer VERSUS jugable (hoy 0) y en magenta; no compite con el SHOOTER `invasores` ni con `duelo-pixel`.                 |
| Esfuerzo (5 = poco)     | 3    | Un motor nuevo con IA, búnkeres destructibles y transiciones de ronda; similar a BLOQUE BUSTER.                         |
| Identidad               | 5    | Giro de rol reconocible al instante ("¡soy los marcianitos!"), sin equivalente en el catálogo.                          |

<!-- SPEC -->

# 11 — NODRIZA: invasión al revés contra un cañón CPU

**Estado:** Borrador
**Depende de:** SPEC 05-asteroides-rocas, SPEC 06-leaderboard-tabla-juegos, SPEC 10-snake-serpentina
**Fecha:** 2026-10-18

**Objetivo:** Crear desde cero NODRIZA (el jugador comanda la formación de invasores contra un cañón defensor controlado por la CPU) como motor TS jugable en el CRT de `/juegos/nodriza/jugar` y activar su leaderboard con una fila nueva en `games` (`playable = true`).

## Alcance

**Incluye:**

- Motor `lib/games/nodriza/` (types, constants, entities, ai, engine) con contrato `{ start, pause, resume, reset, destroy }` y callbacks `onHud`/`onGameOver`.
- Componente `components/games/NodrizaCanvas.tsx` (patrón de `SerpentinaCanvas`).
- Entrada `nodriza` en `components/games/registry.tsx` (HUD: Puntuación, Flotas (`lives`), Nivel; controles; overlay de inicio `NODRIZA` con hint "ESTA VEZ LOS INVASORES SON TUYOS").
- Migración `supabase/migrations/<timestamp>_nodriza_playable.sql` con `insert` de la fila nueva (`playable = true`, `sort_order = 11`), aplicada con el MCP de Supabase + `get_advisors`.
- Portada nueva `.cover-nodriza` y estilos `.nodriza-canvas` en `app/globals.css` (diseñados con `/frontend-design`, tokens CRT existentes).
- Fila `nodriza` en `references/implemented-games/implemented-games.md`.
- Controles:
  - `←`/`→` y `A`/`D`: mover la flota completa en horizontal.
  - `Espacio`: soltar una bomba desde el alien más bajo de la **columna activa** (la marcada por el haz de la nodriza).
  - `↓`/`S`: **picado**, la flota baja una fila de golpe (con enfriamiento).
  - Pausa con `P`/`Esc`/botón (la gestiona `GamePlayer`).
- Reglas, puntuación y constantes: ver **Reglas del juego**.

**No incluye:**

- Sonido, música, partículas costosas, modo dos jugadores local, mando táctil.
- Platillo bonus clásico que cruza la pantalla, power-ups.
- Overlays de pausa/fin en canvas (los pinta `GamePlayer`).
- Anti-trampas ni cambios en `saveScore`, vistas o modal.
- Cambios a otros juegos ni a la fila `invasores`.

## Reglas del juego

### Mundo y entidades

- Mundo lógico 800×600 (4:3). Línea de suelo en `GROUND_Y = 528` (franja verde fina); el cañón vive debajo.
- **Nodriza** (avatar del jugador, decorativa e invulnerable): platillo magenta de 96×20 dibujado 28 px por encima de la fila superior de la flota, centrado en la formación. Proyecta un **haz** (trapecio magenta translúcido) hasta la columna activa.
- **Flota:** rejilla de 8 columnas × 5 filas = 40 aliens de 32×24, paso 48×36 px. Tres diseños pixel-art procedurales por fila (fila 0 tipo "calamar", filas 1–2 "cangrejo", filas 3–4 "pulpo"), animación de 2 frames que alterna cada vez que la flota se desplaza 16 px. Colores: magenta, con la columna activa en blanco/rosa brillante.
- **Columna activa:** la columna con algún alien vivo cuyo centro x está más cerca del centro de la nodriza. Si hay empate, la de la izquierda.
- **Bomba** (jugador): 4×12, zigzag magenta, cae en vertical.
- **Cañón** (CPU): 44×20 cyan con torreta, en `y = 548`. Tiene **3 escudos** por nivel (pips cyan dibujados junto al cañón, fuera del HUD genérico).
- **Bala** (CPU): 3×12 cyan, sube en vertical.
- **Búnkeres:** 4, cada uno de 6×4 celdas de 10 px (60×40), base en `y = 470`, centrados en x = 160, 320, 480, 640. Cada celda se destruye con un impacto (bomba o bala, que también desaparece). Un alien que solapa una celda la borra.

### Movimiento de la flota

- Velocidad horizontal: `FLEET_SPEED = 120 + 3 × aliensDestruidosEnLaFlota` px/s (máx. 240): cuantos menos aliens, más rápida (guiño al original).
- La flota se limita a `[16, 784]` según su caja de aliens vivos (columnas vacías no cuentan).
- **Descenso automático:** cada `DESCENT_INTERVAL = max(3, 7 − 0.5 × (nivel − 1))` s baja `ROW_DROP = 24` px.
- **Picado (↓):** baja 24 px al instante y reinicia el temporizador de descenso automático; enfriamiento `DIVE_COOLDOWN = 2.5` s.
- Posición inicial de la flota en cada ronda: fila superior en `y = 90`, centrada.

### Disparo

- Bombas: velocidad `240 + 15 × (nivel − 1)` px/s, máximo 3 en pantalla, enfriamiento 0,5 s.
- Una bomba que toca el cañón (AABB) le quita 1 escudo si no está en invulnerabilidad (1,2 s tras cada impacto, con parpadeo).

### IA del cañón (CPU)

Cada frame, con un "tiempo de reacción" (la IA recalcula su objetivo cada `reaction` s, no cada frame):

1. **Esquivar:** si alguna bomba cae sobre la franja x del cañón (± 6 px) y su tiempo hasta `y = 548` es menor que `reaction + 0.15` s, se desplaza hacia el lado libre más cercano.
2. **Apuntar:** si no hay peligro, se mueve hacia la x de la columna con el alien vivo más bajo (más amenazante), con un error aleatorio `±aimError` px fijado al recalcular.
3. **Disparar:** dispara si está a ≤ 10 px de su objetivo, tiene balas disponibles y pasó el enfriamiento.

| Parámetro (nivel `L`, tope `L = 8`) | Fórmula                           | L1   | L8    |
| ----------------------------------- | --------------------------------- | ---- | ----- |
| Velocidad del cañón (px/s)          | `200 + 25 × (L − 1)`              | 200  | 375   |
| `reaction` (s)                      | `max(0.12, 0.45 − 0.045 × (L−1))` | 0,45 | 0,135 |
| Enfriamiento de disparo (s)         | `max(0.35, 0.9 − 0.08 × (L − 1))` | 0,90 | 0,35  |
| Balas simultáneas                   | 1 si `L ≤ 3`, 2 si `L ≥ 4`        | 1    | 2     |
| Velocidad de bala (px/s)            | `480 + 20 × (L − 1)`              | 480  | 620   |
| `aimError` (px)                     | `max(4, 28 − 3 × (L − 1))`        | 28   | 7     |

Una bala que toca un alien lo destruye (sin puntos para nadie).

### Puntuación

| Evento                                                     | Puntos                            |
| ---------------------------------------------------------- | --------------------------------- |
| Bomba impacta al cañón (quita 1 escudo)                    | `300 × nivel`                     |
| Bomba destruye una celda de búnker                         | `10`                              |
| Picado manual (↓)                                          | `25 × nivel`                      |
| Cañón destruido (3.er escudo) — gana el nivel              | `1000 × nivel + 20 × aliensVivos` |
| Aterrizaje (un alien vivo toca `GROUND_Y`) — gana el nivel | `2000 × nivel + 30 × aliensVivos` |
| Flota aniquilada                                           | 0 (pierdes 1 flota)               |

- Flota extra cada 15.000 puntos (máximo 5 flotas).
- Puntuación entera, se limita a 99.999.999.

### Progresión y fin

- **Ganar el nivel** (cañón destruido o aterrizaje): pausa interna de 1,5 s con texto "NIVEL N" dibujado en canvas; `nivel + 1`, nueva flota completa de 40, cañón con 3 escudos, búnkeres regenerados.
- **Perder una flota** (los 40 aliens destruidos): `lives − 1`. Si quedan flotas, entra una nueva flota completa **en el mismo nivel**; el cañón **conserva** sus escudos perdidos y los búnkeres su daño (el progreso persiste).
- **Fin de partida:** `lives = 0` → `onGameOver(score)` una sola vez. No hay victoria final: el nivel sigue subiendo (la IA tope en `L = 8`, el descenso tope en 3 s).

### Constantes iniciales

| Constante           | Valor                                           |
| ------------------- | ----------------------------------------------- |
| `W × H`             | 800 × 600                                       |
| `MAX_DT`            | 0,05 s                                          |
| Flotas iniciales    | 3                                               |
| Flota               | 8 × 5, alien 32×24, paso 48×36                  |
| `ROW_DROP`          | 24 px                                           |
| `GROUND_Y`          | 528                                             |
| Cañón               | 44×20, `y = 548`, 3 escudos, invulnerable 1,2 s |
| Bombas              | 3 máx., 0,5 s de enfriamiento                   |
| `DIVE_COOLDOWN`     | 2,5 s                                           |
| Búnkeres            | 4 × (6×4 celdas de 10 px), base `y = 470`       |
| Interludio de nivel | 1,5 s                                           |

## Modelo de datos

- Fila nueva en `public.games`:
  - `id = 'nodriza'`, `title = 'NODRIZA'`, `short = 'Esta vez los invasores son tuyos. Aplasta al cañón.'`
  - `long = 'Por fin te toca el otro lado de la pantalla. Comanda una flota de invasores desde la nave nodriza, bombardea los búnkeres y acorrala al cañón terrestre que dispara sin descanso. Aterriza o destrúyelo antes de que te deje sin flota.'`
  - `cat = 'VERSUS'`, `cover = 'cover-nodriza'`, `color = 'magenta'`, `playable = true`, `sort_order = 11`.
- HUD: `{ score, lives, level }` (`lives` = flotas). Puntuación enviada: entero 0–99.999.999.
- Sin cambios de esquema → no se regeneran tipos.

## Archivos

```
lib/games/nodriza/{types,constants,entities,ai,engine}.ts   nuevo
components/games/NodrizaCanvas.tsx                          nuevo
components/games/registry.tsx                               entrada nueva
app/globals.css                                             .cover-nodriza + .nodriza-canvas
supabase/migrations/<timestamp>_nodriza_playable.sql        nuevo (insert)
references/implemented-games/implemented-games.md           fila nueva
CLAUDE.md                                                   lista de juegos jugables
specs/11-nodriza.md                                         este spec
```

## Plan de implementación

1. Leer docs de Next 16.3.3 (Client Components) y como ejemplo `lib/games/serpentina/` y `components/games/SerpentinaCanvas.tsx`.
2. `types.ts` (Hud, Callbacks, Game, estados de entidades) y `constants.ts` (mundo, paleta copiada de los tokens de `globals.css`, tabla de la IA por nivel, puntuación).
3. `entities.ts`: flota (rejilla, columna activa, caja viva, dibujo pixel-art de 3 tipos × 2 frames), nodriza y haz, bombas, balas, búnkeres por celdas, cañón con escudos.
4. `ai.ts`: función pura `stepCannon(state, dt, level, rng)` que devuelve movimiento y disparo (esquivar → apuntar → disparar).
5. `engine.ts`: `phase` `idle | playing | interlude | paused | gameover`, bucle rAF con `MAX_DT`, teclas en `start()`/`destroy()` (con `preventDefault` para flechas/Espacio), colisiones AABB, puntuación, flotas extra, `onHud` solo al cambiar, `onGameOver` una vez.
6. `NodrizaCanvas.tsx` con el mapeo de transiciones de `status`.
7. Registry + `.cover-nodriza` + `.nodriza-canvas` con `/frontend-design`.
8. Migración `insert` + `get_advisors`.
9. Verificación manual (invitado, con sesión, detalle, Salón, otros juegos intactos) y `npm run build` / `npm run lint`.

## Criterios de aceptación

- [ ] El juego no arranca hasta pulsar EMPEZAR/Espacio; pausa (P/Esc/botón y automática) y fin funcionan.
- [ ] ←/→ mueven la flota con los límites de la caja viva; Espacio suelta bombas desde la columna activa (máx. 3); ↓ hace picado con enfriamiento de 2,5 s.
- [ ] La flota acelera al perder aliens y desciende sola según el nivel.
- [ ] El cañón CPU esquiva, apunta y dispara según la tabla por nivel; se nota más difícil en nivel 4+ (dos balas).
- [ ] Búnkeres se desmoronan por celdas con bombas, balas y aliens.
- [ ] Puntuación exacta según la tabla; flota extra cada 15.000 (máx. 5).
- [ ] Cañón destruido o aterrizaje suben de nivel con interludio de 1,5 s; flota aniquilada resta una vida conservando el daño del cañón.
- [ ] `onHud` solo al cambiar valores; `onGameOver` una vez al quedarse sin flotas.
- [ ] Sin `any`/`@ts-ignore`, sin globals mutables, sin acceso a DOM/`window` en el cuerpo del módulo.
- [ ] Sin rAF ni listeners residuales al salir de la página; canvas 4:3 nítido en HiDPI.
- [ ] Flechas y Espacio no hacen scroll ni activan botones durante la partida.
- [ ] Fila `nodriza` en el proyecto remoto con `playable = true`; `get_advisors` sin avisos nuevos; aparece en Home, Biblioteca (filtro VERSUS) y Salón con su portada.
- [ ] Invitado: "INICIA SESIÓN PARA GUARDAR TU MARCA" → `/auth`. Con sesión: se guarda y aparece en `/juegos/nodriza` y `/salon?juego=nodriza`.
- [ ] ROCAS, CAÍDA, BLOQUE BUSTER, SERPENTINA y los no jugables no cambian.
- [ ] `npm run build` y `npm run lint` sin errores; consola sin errores.

## Decisiones tomadas y descartadas

- **Rol invertido (el jugador es la flota) como VERSUS contra CPU.** Llena la categoría VERSUS (0 jugables) con un giro del tema. _Descartado:_ otro shooter de filas (lo cubre `invasores`) y Pong temático (solapa con `duelo-pixel`).
- **Mover la flota entera y disparar desde la columna activa** (más cercana a la nodriza). Apuntar = posicionar la flota; un solo botón de disparo. _Descartado:_ seleccionar columna con teclas extra (más controles) y disparo desde todas las columnas (sin habilidad).
- **Picado manual con bonus** como decisión de riesgo/recompensa. _Descartado:_ descenso solo automático (rondas pasivas).
- **El daño al cañón persiste al perder una flota.** Evita frustración y da sensación de progreso. _Descartado:_ reiniciar el cañón por flota.
- **`lives` del HUD = flotas; escudos del cañón dibujados en canvas.** El HUD genérico no tiene campo para la vida del rival. _Descartado:_ abusar de `lines` para los escudos (confunde).
- **IA en módulo aparte (`ai.ts`) y pura**, con RNG inyectado, para poder ajustarla sin tocar el motor.
- **Todo procedural, sin assets.** _Descartado:_ sprites externos.
- **Color magenta** (A va con el verde de `invasores`) y `cover` nueva para no reutilizar `cover-invaders`.

## Riesgos identificados

- StrictMode (doble montaje), Espacio compartido con la página, foco en botones, callbacks obsoletos, rendimiento de `shadowBlur` (40 aliens + haz: cachear sprites en un canvas offscreen por instancia), teclas pegadas al pausar.
- Equilibrio de la IA: demasiado buena en esquivar hace imposible dañar al cañón; demasiado mala hace trivial el aterrizaje. Ajustar `reaction`/`aimError` jugando; el aterrizaje debe costar al menos ~45 s en nivel 1.
- La regla de columna activa puede sentirse "mágica" al vaciarse columnas: el haz debe dejar muy claro de dónde sale la bomba.
- `sort_order = 11` se eligió libre (sembrados 1–8); si otra propuesta de la jam ya lo tomó al implementarse, usar el siguiente libre (la columna es `unique`).
- `id` `nodriza` no está en catálogo ni memoria; confirmar que no coincide con las otras dos propuestas de esta jam.
