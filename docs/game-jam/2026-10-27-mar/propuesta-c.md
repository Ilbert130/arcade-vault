# Propuesta C — BATISCAFO

**Tema:** fondo del mar · **Ángulo:** Wildcard / versus

| Campo | Valor                                                                                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------- |
| id    | `batiscafo`                                                                                                            |
| title | BATISCAFO                                                                                                              |
| cat   | VERSUS                                                                                                                 |
| color | magenta                                                                                                                |
| cover | `cover-batiscafo` (nueva: fondo azul abisal con dos siluetas de submarino enfrentadas, una cian y una magenta, un arrecife entre ambas y una estela de torpedo y burbujas) |
| short | Duelo submarino: controla tu flotabilidad y torpedea.        |

**Long:** Dos batiscafos se acechan en el abismo, separados por un arrecife. No hay timón: solo lastre. Inunda tanques para hundirte, purga para subir y lanza torpedos justo cuando el rival se cruza en tu línea. Cada victoria baja el listón de la CPU.

**Pitch:** Eres el piloto de un batiscafo que solo se mueve en vertical, controlando la flotabilidad con inercia (mantén ABAJO para inundar el lastre, ARRIBA para purgarlo). Con un botón sueltas un torpedo en línea recta contra un submarino CPU que esquiva, apunta y aprende (más rápido y preciso en cada nivel). El arrecife central bloquea torpedos, así que el duelo es de posicionamiento y de timing: ¿te escondes tras la roca, o te arriesgas a subir y disparar? Rejugable porque la física de inercia cuesta dominarla, y porque cada nivel cambia el terreno (arrecife más alto, techo rocoso, corrientes).

**Por qué encaja con el tema:** la mecánica núcleo es la flotabilidad y la presión bajo el agua (lastre, hundirse, emerger), no un decorado: sin ese control con inercia no hay juego. El enfrentamiento sorprendente del mar es una guerra silenciosa entre submarinos.

### Autoevaluación (1–5)

| Criterio                | Nota | Motivo                                                                                                           |
| ----------------------- | ---- | ---------------------------------------------------------------------------------------------------------------- |
| Estética                | 4    | Azul abisal, neón magenta/cian, burbujas y estelas; todo procedural, encaja con CRT.                              |
| Puntuación              | 4    | Impactos, hundimientos, bonus sin daño y de rapidez; clara y escalable por nivel.                                |
| Viabilidad técnica      | 4    | Canvas 2D, física 1D, colisiones AABB y una IA con reglas simples; sin assets.                                    |
| Controles               | 4    | Dos teclas de eje + un botón; la inercia añade curva de aprendizaje pero es legible.                              |
| Equilibrio del catálogo | 5    | Primer VERSUS jugable, color magenta (solo `caida`), mecánica de física/flotabilidad inédita.                     |
| Esfuerzo (5 = poco)     | 3    | Motor medio: física, torpedos, IA reactiva y terrenos por nivel. Afinar la IA requiere iteración.                 |
| Identidad               | 4    | "Duelo de lastre" es reconocible y distinto de Pong, tanques o ciclos de luz.                                     |

<!-- SPEC -->

# 13 — BATISCAFO: duelo submarino vs CPU con física de flotabilidad

**Estado:** Borrador
**Depende de:** SPEC 05-asteroides-rocas, SPEC 06-leaderboard-tabla-juegos, SPEC 12 (mando táctil)
**Fecha:** 2026-10-27

**Objetivo:** Crear BATISCAFO desde cero como motor TS jugable en el CRT de `/juegos/batiscafo/jugar` (duelo VERSUS contra la CPU) y activar su leaderboard (insert en `public.games` con `playable = true`).

## Alcance

**Incluye:**

- Motor `lib/games/batiscafo/` (types, constants, entities, ai, engine) con contrato `{ start, pause, resume, reset, destroy }`, `press/release/releaseAll` y callbacks `onHud`/`onGameOver`.
- Componente `components/games/BatiscafoCanvas.tsx` (patrón de `SerpentinaCanvas`).
- Entrada `batiscafo` en `components/games/registry.tsx` (HUD: Puntuación, Vidas, Nivel; controles; overlay `BATISCAFO`; `touch` con D-pad vertical + botón A).
- Migración `supabase/migrations/20261027120000_batiscafo_playable.sql` (insert con `playable = true`), aplicada con el MCP de Supabase + `get_advisors`.
- Portada `.cover-batiscafo` y estilos `.batiscafo-canvas` en `app/globals.css` (diseñados con `/frontend-design`, tokens CRT existentes).
- Dibujo 100% procedural en canvas (sin assets externos).

**No incluye:**

- Sonido, multijugador (ni local ni online), modos extra, power-ups, guardado de partida.
- Overlays de pausa/game over en canvas (los pinta `GamePlayer`).
- Anti-trampas ni cambios en `saveScore`, vistas o modal.
- Skins adicionales (las diseña después el `skin-designer`; solo `clasico`).

## Reglas del juego

**Entidades**

- **Batiscafo jugador**: fijo en x = 110; solo se mueve en vertical. Hitbox 72×30.
- **Batiscafo CPU**: fijo en x = 690; mismas físicas. Hitbox 72×30, mira a la izquierda.
- **Lastre** (`ballast` ∈ [-1, 1]): estado interno de cada submarino. ABAJO lo sube hacia +1 a 2.5/s (hundirse), ARRIBA lo baja hacia −1 a 2.5/s (emerger). Sin tecla vuelve a 0 a 1.5/s. Aceleración vertical = `ballast × 520` px/s², con arrastre `1.6·vy` (velocidad terminal ≈ 325 px/s). Resultado: respuesta con inercia, nunca instantánea.
- **Superficie** (y = 60) y **lecho** (y = 540): al tocar, `vy` se invierte con factor −0.3 y el submarino se queda dentro del rango.
- **Torpedo**: rectángulo 22×6, horizontal, velocidad 380 px/s; lo dispara el que pulsa/decide. Dura hasta salir del mundo, chocar con un submarino, con el terreno o con otro torpedo (ambos se destruyen).
- **Munición**: 3 torpedos por submarino; recarga 1 cada 1.4 s (para el jugador, mostrada como 3 puntos bajo el casco). Cadencia mínima entre disparos 0.35 s.
- **Terreno**: arrecife central (x 370–430) que sube desde el lecho; su altura crece con el nivel. Desde nivel 4 se añade una roca colgante del techo. Los torpedos que lo tocan se destruyen con una ráfaga de burbujas; los submarinos no lo tocan (están a los lados).
- **Corriente** (desde nivel 5): aceleración vertical extra ±140 px/s² sobre ambos submarinos, que alterna de signo cada 4 s (indicada con flechas de burbujas).
- **Casco**: el jugador tiene vidas (HUD `lives`); la CPU tiene `cpuHull` puntos de casco.

**Controles**

- `↑`/`W`: purgar lastre (emerger). `↓`/`S`: inundar lastre (hundirse). Las dos mantenidas.
- `Espacio` (o `J`): disparar torpedo. `P`/`Esc`: pausa (gestionada por `GamePlayer`).
- Acciones del motor: `"up" | "down" | "fire"`. `←`/`→` se ignoran.

**Progresión (por nivel)**

| Nivel | Casco CPU | Altura arrecife | Roca colgante | Corriente | Reacción CPU | Error de puntería CPU | Cooldown CPU |
| ----- | --------- | --------------- | ------------- | --------- | ------------ | --------------------- | ------------ |
| 1     | 2         | 120 px          | no            | no        | 450 ms       | ±70 px                | 2.2 s        |
| 2     | 3         | 140 px          | no            | no        | 400 ms       | ±60 px                | 2.0 s        |
| 3     | 3         | 160 px          | no            | no        | 360 ms       | ±52 px                | 1.8 s        |
| 4     | 3         | 180 px          | sí (110 px)   | no        | 320 ms       | ±44 px                | 1.6 s        |
| 5     | 4         | 200 px          | sí (130 px)   | sí        | 280 ms       | ±36 px                | 1.4 s        |
| 6+    | 4         | 220 px          | sí (150 px)   | sí        | `max(120, 280−25·(n−5))` | `max(10, 36−5·(n−5))` | `max(0.8, 1.4−0.1·(n−5))` |

Casco CPU: +1 cada 3 niveles a partir del 7, máx. 6. Al ganar un nivel: el jugador recupera 1 vida si tiene menos de 3 (nunca más de 5; +1 extra en niveles múltiplo de 3 hasta el máximo de 5), ambos submarinos reaparecen en el centro vertical y hay 1.5 s de cuenta atrás en canvas ("3…2…1") sin disparos.

**IA de la CPU** (`ai.ts`, función pura `decide(state, level, rng, now) → {up, down, fire}`)

1. Cada `reacción` ms toma una "foto" del estado del jugador (retraso humano) y lo usa para decidir.
2. Esquiva: si hay un torpedo del jugador cuyo `y` solape ±24 px el casco y esté a menos de 320 px, pulsa hacia el lado de mayor distancia al torpedo hasta salir de la línea (con 20% de fallo en nivel 1, decreciente a 0% en nivel 6).
3. Apunta: si no esquiva, intenta poner su `y` a `y_jugador + errorAleatorio` (el error se resortea cada 1.2 s); controla el lastre con un PD simple para no pasarse.
4. Dispara si tiene munición, pasó su cooldown, `|y_cpu − y_jugador| < 26 + error/2` y el torpedo no choca con el arrecife (la línea de tiro libre de terreno, comprobada por `ai.ts`).
5. Aleatoriedad desde un RNG inyectado (`mulberry32`) por partida, para poder depurar con semilla.

**Puntuación exacta**

| Evento                                                  | Puntos                              |
| ------------------------------------------------------- | ----------------------------------- |
| Torpedo impacta en la CPU (quita 1 de casco)            | 100 × nivel                         |
| Hundir la CPU (último punto de casco)                   | 500 × nivel                         |
| Torpedo del jugador destruye un torpedo de la CPU       | 50                                  |
| Nivel superado sin recibir impactos                     | 1000 (fijo)                         |
| Bonus de rapidez al hundir la CPU                       | `max(0, 60 − segundos_del_nivel) × 10` |
| Esquivar: torpedo de la CPU sale del mundo (jugador vivo) | 10                               |

Puntuación = suma entera; techo práctico muy inferior a 99.999.999 (limitada con `Math.min(score, 99_999_999)`).

**Condiciones de fin**

- El jugador recibe un impacto: pierde 1 vida y reaparece 1.5 s después (invulnerable 1.5 s, parpadeo); torpedos en vuelo se eliminan. Si `lives` llega a 0 → `onGameOver(score)` una sola vez.
- No hay victoria final; el juego continúa mientras se sobreviva. Límite de 60 niveles (a partir de ahí los parámetros se estabilizan).
- Anti-bucle: si pasan 90 s en un nivel sin impactos, ambos submarinos reciben una corriente de 200 px/s² durante 5 s y la CPU reduce su cooldown a la mitad (evita duelos eternos).

**Constantes iniciales**

- Mundo lógico 800×600, 4:3. Zona jugable y ∈ [60, 540]. Posiciones iniciales y = 300.
- Vidas iniciales 3 (máx. 5). Casco CPU, nivel 1: 2. Munición inicial 3.
- `MAX_DT = 0.05`, paso fijo interno de física 1/120 s.
- Paleta (tokens CRT): fondo azul abisal `#02121f→#061a2e`, jugador `--cyan`, CPU `--magenta`, torpedos `--yellow`, burbujas blanco 30%.

## Modelo de datos

- Fila nueva en `public.games`: `id = 'batiscafo'`, `title = 'BATISCAFO'`, `short = 'Duelo submarino: controla tu flotabilidad y torpedea.'`, `long` (texto de la propuesta), `cat = 'VERSUS'`, `cover = 'cover-batiscafo'`, `color = 'magenta'`, `playable = true`, `sort_order = 9` (se comprueba que siga libre al aplicar; si no, usar el siguiente).
- HUD: `{ score, lives, level }`. Puntuación enviada: entero 0–99.999.999.
- Sin cambios de esquema → no se regeneran tipos.

## Archivos

```
lib/games/batiscafo/{types,constants,entities,ai,engine}.ts   nuevo
components/games/BatiscafoCanvas.tsx                          nuevo
components/games/registry.tsx                                 entrada nueva
app/globals.css                                               .cover-batiscafo + .batiscafo-canvas
supabase/migrations/20261027120000_batiscafo_playable.sql     nuevo (insert)
references/implemented-games/implemented-games.md             nueva fila
specs/13-batiscafo.md                                         este spec
CLAUDE.md                                                     juegos jugables
```

## Plan de implementación

1. Leer docs de Next 16.3.3 (Client Components) y `lib/games/serpentina/` + `lib/games/touch.ts` como patrón.
2. `types.ts` (`BatiscafoHud`, `BatiscafoCallbacks`, `BatiscafoGame`, `BatiscafoAction = "up" | "down" | "fire"`) y `constants.ts` (mundo, física, tabla de niveles, paleta).
3. `entities.ts`: submarino (lastre, física, munición), torpedo, terreno y partículas de burbujas con `draw(ctx)` por parámetro; fondo con gradiente y rayos de luz procedurales.
4. `ai.ts`: `decide` puro con RNG inyectado.
5. `engine.ts`: bucle con `MAX_DT`, `phase` (`idle | countdown | playing | paused | gameover`), `KEY_ACTIONS` → `press/release`, colisiones AABB (torpedo vs submarino, torpedo vs terreno, torpedo vs torpedo), puntuación, niveles, `onHud` solo al cambiar, pausa automática al perder foco.
6. `BatiscafoCanvas.tsx` según el contrato (refs de callbacks, `inputRef`, transiciones de `status`).
7. Registry (`touch`: D-pad con `up`/`down` mantenidos y botón A `fire`) + CSS con `/frontend-design`.
8. Migración + `get_advisors`.
9. Verificación manual (invitado, con sesión, detalle, Salón, otros juegos intactos, táctil) y `npm run build` / `npm run lint`.

## Criterios de aceptación

- [ ] El juego no arranca hasta pulsar EMPEZAR/Espacio; pausa (P/Esc/botón y automática) y fin funcionan.
- [ ] El lastre produce movimiento con inercia (ABAJO hunde, ARRIBA emerge, sin tecla se frena) y los submarinos rebotan suavemente en superficie y lecho.
- [ ] Torpedos: munición de 3 con recarga, destruidos por arrecife, torpedo contra torpedo y impactos puntúan según la tabla.
- [ ] La CPU esquiva, apunta y dispara con dificultad creciente; el nivel 1 es ganable por un jugador nuevo.
- [ ] Perder todas las vidas llama a `onGameOver` una sola vez; `onHud` solo al cambiar valores.
- [ ] Sin `any`/`@ts-ignore`, sin globals mutables, sin acceso a DOM/`window` en el cuerpo del módulo.
- [ ] Sin rAF ni listeners residuales al salir de la página; canvas 4:3 nítido en HiDPI.
- [ ] Flechas y Espacio no hacen scroll ni activan botones durante la partida; teclas no quedan pegadas tras pausar.
- [ ] Mando táctil funcional (`press/release/releaseAll`), con `releaseAll` al salir de `playing`.
- [ ] `games.playable = true` para `batiscafo` en el proyecto remoto; `get_advisors` sin avisos nuevos.
- [ ] Invitado: "INICIA SESIÓN PARA GUARDAR TU MARCA" → `/auth`. Con sesión: se guarda y aparece en `/juegos/batiscafo` y `/salon?juego=batiscafo`.
- [ ] ROCAS, CAÍDA, BLOQUE BUSTER, SERPENTINA y los simulados no cambian.
- [ ] `npm run build` y `npm run lint` sin errores; consola sin errores.

## Decisiones tomadas y descartadas

- **Solo movimiento vertical con física de flotabilidad.** Es la mecánica inesperada y encaja con el tema; reduce además controles a 3 acciones. _Descartado:_ submarino con movimiento libre 2D (se parecería a un tank-shooter).
- **VERSUS solo contra CPU, a vidas.** Cumple la regla del catálogo y da score acumulable en niveles. _Descartado:_ partidas a rondas "mejor de 3" (score poco granular).
- **Arrecife central que bloquea torpedos.** Crea decisión táctica (esconderse o arriesgar) y evita el simple tiro directo. _Descartado:_ campo abierto.
- **IA con retraso de reacción y error de puntería parametrizados.** Dificultad legible y ajustable. _Descartado:_ IA perfecta con handicap de velocidad.
- **Dibujo procedural.** Sin assets, coherente con el estilo CRT.
- **Color magenta.** Solo lo usa `caida`; VERSUS no tiene ningún jugable.

## Riesgos identificados

- StrictMode (doble montaje), Espacio compartido con la página, foco en botones, callbacks obsoletos, rendimiento de `shadowBlur` (limitarlo a torpedos y submarinos), teclas pegadas al pausar.
- Equilibrio de la IA: demasiado precisa frustra, demasiado torpe aburre; tener los parámetros en una tabla en `constants.ts` permite afinarlos rápido.
- La inercia del lastre puede sentirse "flotante" con teclado; ajustar `ACCEL` y arrastre tras probar.
- `sort_order = 9` podría colisionar si otro juego se activa antes; comprobar al migrar.
- Mando táctil: mantener dos botones de eje a la vez con el pulgar exige que el D-pad sea cómodo.
