# Propuesta A — INVASORES

**Tema:** Invasores · **Ángulo:** A — Acción arcade

| Campo | Valor                                     |
| ----- | ----------------------------------------- |
| id    | `invasores`                               |
| title | INVASORES                                 |
| cat   | SHOOTER                                   |
| color | green                                     |
| cover | `cover-invaders` (existente)              |
| short | Defiende el planeta de filas alienígenas. |

**Long:** Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie. (Se mantiene el texto sembrado; ver "Decisiones" para la variante opcional que menciona la racha y la nave nodriza.)

**Pitch:** Eres el último cañón de neón en la superficie. Una formación de 5×11 alienígenas avanza en zigzag, baja un escalón cada vez que toca un borde y acelera a medida que la diezmas. El giro propio es la **RACHA**: cada impacto consecutivo sin fallar sube un multiplicador (hasta ×5) y cualquier disparo perdido lo resetea, así que la puntería vale más que disparar a ciegas. Los alienígenas abatidos sueltan a veces **cápsulas** que caen y hay que atrapar bajo el fuego enemigo (doble cañón, reparar escudos, bonus), y una **nave nodriza** cruza el cielo cada pocos segundos como premio de riesgo. Oleadas infinitas, cada una más baja y más rápida: partidas de 2–5 minutos con un techo de puntuación que siempre se puede superar.

**Por qué encaja con el tema:** Es literalmente la invasión: se dispara a la formación invasora, se esquiva su fuego y se pierde si tocan la superficie. Reutiliza la fila `invasores` que el usuario quiere activar.

### Autoevaluación (1–5)

| Criterio                | Nota | Motivo                                                                                                               |
| ----------------------- | ---- | -------------------------------------------------------------------------------------------------------------------- |
| Estética                | 5    | Sprites de pixeles procedurales en neón verde/magenta/cian sobre CRT; encaja con la portada existente.               |
| Puntuación              | 5    | Valor por fila + multiplicador de racha + nodriza + bonus de oleada: mucha diferencia entre jugador medio y experto. |
| Viabilidad técnica      | 5    | Colisiones AABB, formación como rejilla, escudos como bitmap de celdas; nada exótico.                                |
| Controles               | 5    | ←/→ y un botón de disparo.                                                                                           |
| Equilibrio del catálogo | 3    | SHOOTER ya tiene `rocas`, y green ya tiene `serpentina`; pero es el juego sembrado que el usuario quiere.            |
| Esfuerzo (5 = poco)     | 4    | Desde cero, sin assets; solo `update playable`, portada y fila ya existen.                                           |
| Identidad               | 4    | Clásico reconocible con giro propio (racha, cápsulas atrapables) sin copiar marca.                                   |

<!-- SPEC -->

# 11 — INVASORES: shooter de formaciones alienígenas con racha y cápsulas

**Estado:** Borrador
**Depende de:** SPEC 05-asteroides-rocas, SPEC 06-leaderboard-tabla-juegos, SPEC 10-snake-serpentina
**Fecha:** 2026-10-18

**Objetivo:** Crear desde cero un shooter de formaciones como motor TS jugable en el CRT de `/juegos/invasores/jugar` y activar su leaderboard (`playable = true` sobre la fila ya sembrada).

## Alcance

**Incluye:**

- Motor `lib/games/invasores/` (types, constants, entities, engine) con contrato `{ start, pause, resume, reset, destroy }` y callbacks `onHud`/`onGameOver`.
- Componente `components/games/InvasoresCanvas.tsx` (patrón de `SerpentinaCanvas`).
- Entrada `invasores` en `components/games/registry.tsx`: `hud: ["score", "lives", "level"]`, `controls: "← → / A D MOVER · ESPACIO / Z DISPARAR · P PAUSA"`, `startTitle: "INVASORES"`, `startHint: "PULSA ESPACIO PARA EMPEZAR"`.
- Migración `supabase/migrations/<timestamp>_invasores_playable.sql` (`update public.games set playable = true where id = 'invasores';`), aplicada con el MCP de Supabase + `get_advisors`.
- Estilos `.invasores-canvas` en `app/globals.css` (diseñados con `/frontend-design`, tokens CRT existentes; la portada `.cover-invaders` ya existe y no se toca).
- Dibujo 100 % procedural en canvas (sprites de alienígenas definidos como matrices de bits en `constants.ts`, dos fotogramas de animación).
- Controles, reglas y puntuación detallados en **Reglas del juego**.
- Actualizar `references/implemented-games/implemented-games.md` y `CLAUDE.md` (juegos jugables).

**No incluye:**

- Sonido.
- Alienígenas que rompen formación en picado, jefes, o modo dos jugadores.
- Mando táctil / controles en pantalla.
- Overlays de pausa/game over en canvas (los pinta `GamePlayer`).
- Anti-trampas ni cambios en `saveScore`, vistas o modal.
- Cambios de esquema (no se regeneran tipos).

## Reglas del juego

### Mundo y constantes iniciales

| Constante                      | Valor                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Mundo lógico                   | 800×600 (4:3), `MAX_DT = 0.05` s                                                                                                            |
| Suelo (línea de invasión)      | y = 560 (línea verde dibujada)                                                                                                              |
| Cañón del jugador              | 44×20 px, y = 530, velocidad 320 px/s, límites x ∈ [24, 776]                                                                                |
| Disparo del jugador            | 3×14 px, 560 px/s hacia arriba; máx. 1 en pantalla (2 con DOBLE)                                                                            |
| Formación                      | 5 filas × 11 columnas, alien 32×24 px, separación 48×40 px                                                                                  |
| Origen formación               | x = 136, y = 90 en oleada 1; +16 px por oleada (tope +80 px)                                                                                |
| Descenso al tocar borde        | 16 px; margen lateral 20 px                                                                                                                 |
| Velocidad horizontal           | `v = 28 × (1 + 2.5 × (1 − vivos/55)) × (1 + 0.12 × (oleada − 1))` px/s, tope 260 px/s                                                       |
| Animación alien                | alterna 2 fotogramas cada 0.5 s × (vivos/55), mínimo 0.08 s                                                                                 |
| Disparo enemigo                | 4×12 px, 220 px/s (+15 por oleada, tope 380)                                                                                                |
| Cadencia enemiga               | intervalo `max(0.35, 1.1 − 0.08 × (oleada − 1))` s; dispara un alien inferior de columna aleatoria (60 % la columna más cercana al jugador) |
| Disparos enemigos simultáneos  | `min(6, 2 + floor(oleada/2))`                                                                                                               |
| Escudos                        | 4 búnkeres, centro x = 160/320/480/640, y = 450; rejilla 12×8 celdas de 6 px (72×48 px) con muesca inferior                                 |
| Nave nodriza                   | 48×20 px, y = 50, 150 px/s, aparece cada 18–28 s (aleatorio) cruzando de un lado a otro                                                     |
| Cápsula                        | 16×16 px, cae a 130 px/s; probabilidad 8 % por alien abatido; máx. 1 en pantalla                                                            |
| Vidas iniciales                | 3 (máx. 5)                                                                                                                                  |
| Invulnerabilidad al reaparecer | 1.5 s (cañón parpadea)                                                                                                                      |

### Entidades

- **Cañón:** se mueve en horizontal con ←/→ o A/D; dispara con Espacio o Z (mantener pulsado dispara en cuanto el disparo anterior desaparece).
- **Alienígenas:** 3 tipos por fila: fila superior _calamar_ (magenta), filas 2–3 _cangrejo_ (cian), filas 4–5 _pulpo_ (verde). Se mueven en bloque; solo disparan los de la fila inferior viva de cada columna.
- **Escudos:** bitmap de celdas; cada disparo (propio o enemigo) que toca una celda la destruye junto con 1 celda vecina aleatoria y desaparece. Un alien que toca un escudo borra las celdas que solapa. Se restauran completos al empezar cada oleada.
- **Nave nodriza:** cruza la parte alta; si sale de la pantalla sin ser alcanzada, se pierde.
- **Cápsulas:** caen desde la posición del alien abatido; se atrapan tocando el cañón; desaparecen al llegar al suelo. Tipos (equiprobables):
  - **DOBLE:** permite 2 disparos simultáneos durante 10 s.
  - **REPARA:** restaura todas las celdas de los 4 escudos.
  - **BONUS:** +500 puntos (multiplicados por la racha).
- **Racha:** contador de impactos consecutivos sobre aliens o nodriza. Multiplicador `x = min(5, 1 + floor(racha / 5))`. Se resetea a 0 si un disparo propio sale por arriba o choca con un escudo, o si el jugador pierde una vida. Se dibuja en el canvas (esquina superior derecha, "RACHA ×3") porque el HUD genérico no tiene ese campo.

### Puntuación

| Evento                       | Puntos                    |
| ---------------------------- | ------------------------- |
| Pulpo (filas 4–5)            | 10 × multiplicador        |
| Cangrejo (filas 2–3)         | 20 × multiplicador        |
| Calamar (fila 1)             | 30 × multiplicador        |
| Nave nodriza                 | 300 × multiplicador       |
| Atrapar cápsula (cualquiera) | 50 (sin multiplicador)    |
| Cápsula BONUS (adicional)    | 500 × multiplicador       |
| Oleada completada            | 100 × oleada              |
| Oleada sin perder vida       | +1.000 × oleada adicional |

- El multiplicador se aplica con el valor vigente **antes** de sumar el impacto actual a la racha.
- Vida extra al cruzar 10.000 puntos y cada 25.000 después (máx. 5 vidas).
- Score acotado con `Math.min(score, 99_999_999)` y siempre entero.

### Progresión

- **Nivel = oleada** (HUD `level`). Al eliminar los 55 alienígenas: bonus, pausa interna de 1.5 s (texto "OLEADA N" dibujado en canvas), se limpian disparos y cápsulas, se restauran escudos y aparece una formación nueva más baja y más rápida (ver constantes).
- Dentro de una oleada la formación acelera al quedar menos alienígenas (el último alien vuela a ~3.5× la velocidad base).

### Condiciones de fin

- Disparo enemigo impacta al cañón (fuera de invulnerabilidad): −1 vida, se borran disparos enemigos, racha a 0, reaparece en el centro tras 1 s. Con 0 vidas → `onGameOver(score)`.
- Cualquier alienígena alcanza y ≥ 560 (suelo) o colisiona con el cañón: **fin inmediato** → `onGameOver(score)` (sin importar las vidas).
- `onGameOver` se llama exactamente una vez (bandera `ended`).

## Modelo de datos

- Fila en `public.games`: `id = 'invasores'` ya sembrada (SHOOTER, `cover-invaders`, green, `sort_order = 5`, `playable = false`); la migración solo cambia `playable = true`.
- HUD: `{ score, lives, level }`. Puntuación enviada: entero 0–99.999.999 (una partida de 10 oleadas ronda 40.000–80.000).
- Sin cambios de esquema → no se regeneran tipos.

## Archivos

```
lib/games/invasores/{types,constants,entities,engine}.ts   nuevo
components/games/InvasoresCanvas.tsx                        nuevo
components/games/registry.tsx                               entrada nueva
app/globals.css                                             estilos .invasores-canvas
supabase/migrations/<timestamp>_invasores_playable.sql      nuevo
references/implemented-games/implemented-games.md           fila nueva
CLAUDE.md                                                   juegos jugables / specs implementados
specs/11-invasores.md                                       este spec
```

## Plan de implementación

1. Leer docs de Next 16.3.3 (Client Components) y el contrato del motor; no hay referencia en `references/started-games/`, se diseña desde cero.
2. `types.ts` (`InvasoresHud`, `InvasoresCallbacks`, `InvasoresGame`, tipos de alien/cápsula) y `constants.ts` (tabla de constantes, `PALETTE` copiada de los tokens de `globals.css`, sprites como matrices de bits 11×8 con 2 fotogramas).
3. `entities.ts`: cañón, formación (rejilla 5×11 con offset compartido), disparos, escudos (bitmap), nodriza, cápsulas, partículas de explosión; funciones `draw(ctx, …)` por parámetro.
4. `engine.ts`: `createInvasoresGame(canvas, callbacks)`; estado en closure, `phase` `idle | playing | paused | respawn | wave-clear | gameover`; bucle rAF con `dt` limitado; colisiones AABB (y por celda en escudos); racha y multiplicador; `onHud` solo al cambiar; teclas en `start()`/`destroy()` con `preventDefault` para flechas/Espacio y limpieza de teclas al pausar.
5. `InvasoresCanvas.tsx` con refs de callbacks y mapa de transiciones de `status`.
6. Registry + CSS con `/frontend-design`.
7. Migración `playable` aplicada con el MCP + `get_advisors`.
8. Actualizar `implemented-games.md` y `CLAUDE.md`.
9. Verificación manual y `npm run build` / `npm run lint`.

## Criterios de aceptación

- [ ] El juego no arranca hasta pulsar EMPEZAR/Espacio; pausa (P/Esc/botón y automática) y fin funcionan.
- [ ] La formación se mueve en bloque, baja 16 px al tocar un borde y acelera al quedar menos alienígenas y con cada oleada.
- [ ] Puntuación por fila (10/20/30), nodriza (300), multiplicador de racha (×1…×5, se resetea al fallar) y bonus de oleada según la tabla.
- [ ] Escudos se erosionan celda a celda y se restauran en cada oleada; las 3 cápsulas funcionan.
- [ ] Perder vida con disparo enemigo; fin inmediato si un alien toca el suelo o el cañón; vida extra a 10.000 y cada 25.000.
- [ ] `onHud` solo al cambiar valores; `onGameOver` una vez.
- [ ] Sin `any`/`@ts-ignore`, sin globals mutables, sin acceso a DOM/`window` en el cuerpo del módulo.
- [ ] Sin rAF ni listeners residuales al salir de la página; canvas 4:3 nítido en HiDPI.
- [ ] Flechas y Espacio no hacen scroll ni activan botones durante la partida; teclas no quedan pegadas tras pausar.
- [ ] `games.playable = true` para `invasores` en el proyecto remoto; `get_advisors` sin avisos nuevos.
- [ ] Invitado: "INICIA SESIÓN PARA GUARDAR TU MARCA" → `/auth`. Con sesión: se guarda y aparece en `/juegos/invasores` y `/salon?juego=invasores`.
- [ ] ROCAS, CAÍDA, BLOQUE BUSTER, SERPENTINA y los simulados no cambian.
- [ ] `npm run build` y `npm run lint` sin errores; consola sin errores.

## Decisiones tomadas y descartadas

- **Reutilizar la fila `invasores` (update, no insert).** El usuario quiere ese juego y la fila, portada y `sort_order = 5` ya existen. _Descartado:_ id nuevo con insert.
- **Mantener `short`/`long` sembrados.** Siguen describiendo el juego con fidelidad; opcionalmente la migración puede actualizar `long` a: "Olas de pixeles hostiles descienden formación tras formación. Encadena impactos para multiplicar tu racha, atrapa las cápsulas que sueltan y derriba la nave nodriza antes de que toquen la superficie." _Descartado:_ cambiar el `short`.
- **Racha con multiplicador** como giro principal: premia la puntería y diferencia el leaderboard. _Descartado:_ puntos fijos por alien (techo de score demasiado plano).
- **Nodriza con valor fijo × racha** en lugar de valor aleatorio o por número de disparos (truco del original): más legible. _Descartado:_ valor misterioso.
- **Alien en el suelo = fin inmediato**, como en el clásico; da tensión real a la "invasión". _Descartado:_ restar solo una vida.
- **Sprites procedurales** (matrices de bits) sin assets externos. _Descartado:_ PNG de sprites.
- **Disparo con Espacio y Z**: Espacio es el estándar del género; Z como alternativa por si Espacio da problemas con el foco. _Descartado:_ ↑/W para disparar (confunde con mover).
- **Carpeta `lib/games/invasores/`** (slug del id). _Descartado:_ `invaders/`.

## Riesgos identificados

- StrictMode (doble montaje), Espacio compartido con la página (empezar vs. disparar: el primer Espacio no debe disparar), foco en botones, callbacks obsoletos, rendimiento de `shadowBlur` con 55 aliens (dibujar glow en una pasada o cachear sprites en `OffscreenCanvas` por instancia), teclas pegadas al pausar.
- Equilibrio: cadencia enemiga y velocidad tope pueden hacer las oleadas 6+ injustas; ajustar constantes tras probar.
- Colisión de disparos rápidos (560 px/s) con aliens de 24 px: con `dt` ≤ 0.05 el disparo avanza 28 px por frame; usar barrido (segmento) para no atravesar sin impactar.
- El multiplicador no cabe en el HUD genérico: se dibuja en el canvas; debe ser legible sin tapar la formación.
- Catálogo: SHOOTER y green ya tienen un jugable cada uno; se acepta porque es la petición explícita del usuario.
- Dato deducido: la carpeta `game-jam/2026-10-18-invasores/` no existía; se crea con este archivo.
