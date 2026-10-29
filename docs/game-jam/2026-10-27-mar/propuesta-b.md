# Propuesta B — LONJA

**Tema:** fondo del mar · **Ángulo:** Puzzle / estrategia

| Campo | Valor                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------- |
| id    | `lonja`                                                                                           |
| title | LONJA                                                                                             |
| cat   | PUZZLE                                                                                            |
| color | cyan                                                                                              |
| cover | `cover-lonja` (nueva: degradado abisal azul-negro con burbujas y tres nasas de neón en el fondo) |
| short | Clasifica la pesca en las nasas antes de que desborde.                                            |

**Long:** La cinta de la lonja no para: peces, medusas, estrellas y erizos llegan mezclados y tú decides en qué nasa cae cada uno. Apila tres iguales para cobrar el banco, encadena cascadas y no dejes que la cinta se desborde. Cada nivel, la marea trae más prisa y más especies.

**Pitch:** Eres el clasificador de una lonja submarina. Una cinta trae criaturas de colores y formas distintas; eliges entre 4 nasas (pilas) y sueltas el pez de la cabeza. Si las tres de arriba de una nasa son de la misma especie, se cobran; si dejas pasar muchas piezas, la cinta se desborda y pierdes vidas. Es un puzzle de apilar y planear el orden (como una torre de clasificación) con presión de ritmo creciente, cascadas multiplicadoras y una acción de "liberar" con cooldown para rectificar. Rejugable porque la secuencia es aleatoria y la tensión entre limpiar rápido y construir combos cambia cada partida.

**Por qué encaja con el tema:** Lo que se organiza en el fondo del mar es la fauna: clasificar especies en nasas es la mecánica central, no un adorno; las criaturas son entidades de juego con forma y color propios.

### Autoevaluación (1–5)

| Criterio                | Nota | Motivo                                                                                              |
| ----------------------- | ---- | --------------------------------------------------------------------------------------------------- |
| Estética                | 4    | Cian/abisal con burbujas, criaturas procedurales con silueta distinta (apto para daltonismo).      |
| Puntuación              | 4    | Banco, cascada ×2, nasa limpia, racha y multiplicador por nivel; entero, muy por debajo del tope.  |
| Viabilidad técnica      | 5    | Solo pilas, cola y temporizadores; sin física ni IA; canvas 2D con formas simples.                  |
| Controles               | 5    | ←/→ y dos botones; mapea directo a D-pad + A/B táctil.                                              |
| Equilibrio del catálogo | 4    | PUZZLE pasa a 2 (CAÍDA magenta); color cyan ya tiene BLOQUE BUSTER, pero la mecánica es distinta.   |
| Esfuerzo (5 = poco)     | 4    | Motor pequeño; la mayor parte del trabajo es dibujo y ajuste de ritmo.                              |
| Identidad               | 4    | Clasificación por pilas con cinta que desborda: no es match-3 ni cae-piezas.                        |

<!-- SPEC -->

# 13 — LONJA: clasifica la pesca en las nasas antes de que la cinta desborde

**Estado:** Borrador
**Depende de:** SPEC 05-asteroides-rocas, SPEC 06-leaderboard-tabla-juegos, SPEC 12 (mando táctil)
**Fecha:** 2026-10-27

**Objetivo:** Crear LONJA desde cero como motor TS jugable en el CRT de `/juegos/lonja/jugar` y activar su leaderboard (juego nuevo, `insert` con `playable = true`).

## Alcance

**Incluye:**

- Motor `lib/games/lonja/` (types, constants, entities, engine) con contrato `{ start, pause, resume, reset, destroy }`, `press/release/releaseAll` y callbacks `onHud`/`onGameOver`.
- Componente `components/games/LonjaCanvas.tsx` (patrón de `SerpentinaCanvas`).
- Entrada `lonja` en `components/games/registry.tsx` (HUD: `score`, `lives`, `level`; controles; overlay `LONJA`; layout `touch` con D-pad izquierda/derecha y botones A/B).
- Estilos `.lonja-canvas` y portada `.cover-lonja` en `app/globals.css` (diseñados con `/frontend-design`, tokens CRT existentes).
- Migración `supabase/migrations/20261027000000_lonja_playable.sql` con `insert` en `public.games` (`playable = true`), aplicada con el MCP de Supabase + `get_advisors`.
- Actualizar `references/implemented-games/implemented-games.md` y CLAUDE.md al terminar.
- Reglas, controles y puntuación descritos en "Reglas del juego".

**No incluye:**

- Sonido, multijugador, anti-trampas, guardado de partida, modos extra.
- Overlays de pausa/game over en canvas (los pinta `GamePlayer`).
- Skins (las crea después el `skin-designer`).
- Assets externos: todo es dibujo procedural en canvas.
- Cambios en `saveScore`, vistas o modal.

## Reglas del juego

**Controles** (`LonjaAction = "left" | "right" | "drop" | "release"`):

| Acción  | Teclado                    | Táctil       | Efecto                                                                 |
| ------- | -------------------------- | ------------ | ---------------------------------------------------------------------- |
| left    | `←` / `A`                  | D-pad izq.   | Mueve la selección una nasa a la izquierda (sin dar la vuelta).        |
| right   | `→` / `D`                  | D-pad der.   | Mueve la selección una nasa a la derecha.                              |
| drop    | `Espacio` / `↓` / `S`      | Botón A      | Suelta el pez de la cabeza de la cinta en la nasa seleccionada.        |
| release | `Z` / `X` / `Shift`        | Botón B      | Libera el pez de arriba de la nasa seleccionada y lo devuelve a la cinta (cooldown 4 s). |

Todas son acciones de una pulsación (sin estado mantenido); el mando táctil usa `repeat: true` solo en left/right.

**Entidades:**

- **Especie** (`Species`): 4 tipos, distinguibles por forma y color:
  - `pez` (cyan `#00f5ff`, óvalo con cola),
  - `medusa` (magenta `#ff006e`, cúpula con tentáculos),
  - `estrella` (yellow `#f5ff00`, estrella de 5 puntas),
  - `erizo` (green `#00ff88`, círculo con púas).
- **Cinta** (`belt`): cola FIFO de hasta 6 peces; la cabeza (índice 0) es la próxima en soltarse; entran por la derecha, avanzan a la izquierda.
- **Nasa** (`trap`): pila de capacidad 5; solo importa el orden de apilado (tope = último). 4 nasas fijas.
- **Selección** (`cursor`): índice 0–3 de la nasa elegida (empieza en 1).

**Reglas:**

1. Cada `spawnInterval` segundos entra un pez aleatorio al final de la cinta. Si la cinta ya tiene 6 peces, hay **desborde**: se pierde 1 vida y se elimina el pez de la cabeza (que se pierde) para dejar espacio al nuevo; el temporizador de entrada se reinicia.
2. `drop`: si la nasa seleccionada tiene hueco, el pez de la cabeza se apila en ella y los de la cinta avanzan. Si la nasa está llena (5) no hace nada (la nasa parpadea; sin penalización). Si la cinta está vacía, no hace nada.
3. **Banco:** tras cada apilado, si los `n ≥ 3` peces consecutivos del tope son de la misma especie, se cobran los `n` (se retiran todos los iguales consecutivos del tope).
4. **Cascada:** tras retirar un banco, si el nuevo tope vuelve a formar ≥ 3 iguales consecutivos, se cobra también, con multiplicador de cascada acumulado ×2 por cada paso adicional (×1, ×2, ×4…).
5. **Nasa limpia:** si tras un banco la nasa queda vacía, bonus fijo.
6. **Racha:** si el banco se cobra dentro de los 5 s del anterior, `streak += 1`; si no, `streak = 1`. La racha da bonus (cap en 10).
7. `release`: toma el pez del tope de la nasa seleccionada (si hay) y lo añade al final de la cinta; si la cinta está llena, el pez se pierde sin penalización. Cooldown 4 s (se muestra como barra en la nasa/HUD interno del canvas). No se puede usar en cooldown.
8. **Especies por nivel:** niveles 1–2 solo usan `pez`, `medusa`, `estrella` (3 especies); desde el nivel 3 entra `erizo` (4 especies).
9. **Nivel:** `level = 1 + floor(bancos / 6)`, máximo efectivo 15 para la velocidad (el nivel sigue contando para el multiplicador, tope 99 para evitar desbordes de puntuación).
10. **Fin de partida:** `lives = 0` → fase `gameover` y `onGameOver(score)` una sola vez.

**Puntuación exacta:**

| Evento                         | Puntos (antes del multiplicador de nivel)                         |
| ------------------------------ | ----------------------------------------------------------------- |
| Pez colocado en una nasa       | +5                                                                |
| Banco de 3 peces               | +100                                                              |
| Banco de 4 peces               | +250                                                              |
| Banco de 5 peces               | +500                                                              |
| Cascada (paso k, k ≥ 2)        | puntos del banco × 2^(k−1)                                        |
| Nasa limpia                    | +200                                                              |
| Racha de `s` bancos seguidos   | +25 × min(s, 10) al cobrar el banco                               |

Todo evento suma `puntos × level` (el multiplicador de nivel es `level`, mínimo 1). Puntuación entera, 0–99.999.999 (se hace `Math.min(score, 99_999_999)` al sumar).

**Progresión (constantes):**

| Concepto                    | Fórmula                                                      |
| --------------------------- | ------------------------------------------------------------ |
| `spawnInterval` (s)         | `max(0.8, 2.6 - 0.12 * (min(level, 15) - 1))`                |
| Vidas iniciales             | 3 (no hay vidas extra)                                       |
| Capacidad de cinta          | 6                                                            |
| Capacidad de nasa           | 5                                                            |
| Cooldown de `release`       | 4 s                                                          |
| Ventana de racha            | 5 s                                                          |
| Primer pez                  | aparece a los 0,6 s del `start()`; la cinta empieza con 3 peces |

**Constantes del mundo (800×600 lógico):**

- Cinta: franja y 56–136; 6 huecos de 76 px, cabeza en x = 60..136 (izquierda); fondo `#06101f`.
- Nasas: 4 columnas de 140 px, separación 40 px, x inicial 60 (60, 240, 420, 600); base en y = 560, altura útil 5 huecos de 56 px (y 280–560); selección con marco neón del color de la especie del tope (o cyan si vacía).
- Interior del canvas: título pequeño "LONJA" no necesario; el HUD sale por `onHud`, pero la barra de cooldown y el contador de cinta (n/6) se dibujan dentro.
- Fondo: degradado vertical `#001a33 → #000a14`, burbujas ascendentes decorativas (≤ 24, puramente visuales, no ligadas a `dt` de lógica).

## Modelo de datos

- Fila nueva en `public.games`: `id = 'lonja'`, `title = 'LONJA'`, `short = 'Clasifica la pesca en las nasas antes de que desborde.'`, `long` = texto de la propuesta, `cat = 'PUZZLE'`, `cover = 'cover-lonja'`, `color = 'cyan'`, `playable = true`, `sort_order = 32` (libre al 2026-10-27: la semilla ocupa 1–8; verificar con `select max(sort_order)` antes de aplicar y usar el siguiente libre si ya lo tomó otro juego de la jam).
- HUD: `{ score, lives, level }`. Puntuación enviada: entero 0–99.999.999.
- Sin cambios de esquema → no se regeneran tipos.

## Archivos

```
lib/games/lonja/{types,constants,entities,engine}.ts      nuevo
components/games/LonjaCanvas.tsx                          nuevo
components/games/registry.tsx                             entrada nueva
app/globals.css                                           .lonja-canvas + .cover-lonja
supabase/migrations/20261027000000_lonja_playable.sql     nuevo (insert, playable = true)
references/implemented-games/implemented-games.md         fila nueva
specs/13-lonja.md                                         este spec
CLAUDE.md                                                 juegos jugables / specs implementados
```

## Plan de implementación

1. Documentación de Next 16.3.3 (Client Components) y lectura de `lib/games/serpentina/` como patrón de motor.
2. `types.ts` (`Species`, `LonjaAction`, `LonjaHud`, `LonjaCallbacks`, `LonjaGame`) y `constants.ts` (mundo, paleta, tuning).
3. `entities.ts`: dibujo procedural de cada especie (`drawFish(ctx, species, x, y, size)`), nasa, cinta, burbujas.
4. `engine.ts`: estado en closure (`phase`, `belt`, `traps`, `cursor`, `lives`, `score`, `bancos`, `streak`, `cooldown`, `spawnTimer`); funciones puras `resolveTrap(trap)` (banco + cascada) y `spawnFish(level)`; bucle rAF con `MAX_DT = 0.05`; `KEY_ACTIONS` → `press/release/releaseAll`; `onHud` solo al cambiar; pausa automática.
5. `LonjaCanvas.tsx` según el contrato (transiciones de `status`, `inputRef`).
6. Registry (`touch` con `touchLayout<LonjaAction>()`) + CSS y portada con `/frontend-design`.
7. Migración `insert` + `get_advisors`.
8. Ajuste de ritmo (jugar 10 partidas: nivel 5 alcanzable en ~3 min).
9. Verificación manual y `npm run build` / `npm run lint`.

## Criterios de aceptación

- [ ] El juego no arranca hasta pulsar EMPEZAR/Espacio; pausa (P/Esc/botón y automática) y fin funcionan.
- [ ] Mover la selección, soltar, banco de ≥ 3, cascada, nasa limpia y racha puntúan exactamente según la tabla.
- [ ] Desborde de cinta quita 1 vida; con 0 vidas se llama a `onGameOver` una sola vez.
- [ ] `release` respeta el cooldown de 4 s y devuelve el pez a la cinta (o lo pierde si está llena).
- [ ] El cuarto tipo (`erizo`) solo aparece desde el nivel 3; `spawnInterval` baja con el nivel hasta 0,8 s.
- [ ] `onHud` solo al cambiar valores; sin `any`/`@ts-ignore`, sin globals mutables, sin DOM/`window` en el cuerpo del módulo.
- [ ] Sin rAF ni listeners residuales al salir; canvas 4:3 nítido en HiDPI; flechas/Espacio no hacen scroll.
- [ ] Mando táctil funcional (izq./der. con repetición, A = soltar, B = liberar).
- [ ] `games.playable = true` para `lonja` en el proyecto remoto; `get_advisors` sin avisos nuevos.
- [ ] Invitado: "INICIA SESIÓN PARA GUARDAR TU MARCA" → `/auth`. Con sesión: se guarda y aparece en `/juegos/lonja` y `/salon?juego=lonja`.
- [ ] Los demás juegos no cambian.
- [ ] `npm run build` y `npm run lint` sin errores; consola sin errores.

## Decisiones tomadas y descartadas

- **Pilas con cinta que desborda** como fuente de presión (no cronómetro global): el ritmo sube con el nivel y el error cuesta vidas, lo que da un score arcade. _Descartado:_ tiempo límite fijo (partidas no rejugables por habilidad).
- **Nasa llena rechaza el pez sin penalizar:** la penalización ya llega por el desborde. _Descartado:_ vaciar la nasa al llenarse (demasiado punitivo).
- **Formas distintas además del color** para que las especies sean legibles. _Descartado:_ solo color.
- **Multiplicador = nivel** para que la progresión recompense sobrevivir. _Descartado:_ multiplicador temporal.
- **Selección con ←/→ en vez de teclas 1–4:** consistente con el mando táctil. _Descartado:_ atajos numéricos.
- **Dibujo procedural:** sin assets, coherente con la estética neón.

## Riesgos identificados

- StrictMode (doble montaje), Espacio compartido con la página, foco en botones, callbacks obsoletos, teclas pegadas al pausar.
- Equilibrio: con 4 nasas y 3 especies el juego puede ser demasiado fácil al principio y caótico después; ajustar `spawnInterval` y la ventana de racha tras playtest.
- Cascadas: la suma de peces de especies repetidas puede producir bucles de puntuación grandes; el tope `99_999_999` y el cap de nivel lo acotan.
- Legibilidad de las especies a 56 px por hueco: verificar siluetas en pantallas pequeñas.
- Colisión de `sort_order` con las otras propuestas de la jam: comprobar el siguiente libre antes de aplicar la migración.
- Solapamiento de color cyan con BLOQUE BUSTER; si el jurado prefiere variedad, cambiar `color` a otro no usado.
