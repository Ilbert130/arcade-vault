# 16 — ANZUELO: Pesca de riesgo en la sima

**Estado:** Borrador
**Depende de:** SPEC 05-asteroides-rocas, SPEC 06-leaderboard-tabla-juegos, SPEC 10-snake-serpentina
**Fecha:** 2026-10-27

**Objetivo:** Crear ANZUELO desde cero como motor TS jugable en el CRT de `/juegos/anzuelo/jugar` y activar su leaderboard (fila nueva en `games` con `playable = true`).

## Alcance

**Incluye:**

- Motor `lib/games/anzuelo/` (types, constants, entities, engine) con contrato `{ start, pause, resume, reset, destroy, press, release, releaseAll }` y callbacks `onHud`/`onGameOver`.
- Componente `components/games/AnzueloCanvas.tsx` (patrón de `SerpentinaCanvas`).
- Entrada `anzuelo` en `components/games/registry.tsx` (HUD: `score`, `lives`, `level`; controles; overlay `ANZUELO`; layout táctil obligatorio con `touchLayout<AnzueloAction>()`).
- Migración `supabase/migrations/<timestamp>_anzuelo_playable.sql` (insert con `playable = true`), aplicada con el MCP de Supabase + `get_advisors`, y regeneración de tipos si procede.
- Clase `.cover-anzuelo` y estilos `.anzuelo-canvas` en `app/globals.css` (diseñados con `/frontend-design`).
- Actualizar `references/implemented-games/implemented-games.md` y `CLAUDE.md` al hacerlo jugable.
- Controles, reglas y puntuación descritos en "Reglas del juego".

**No incluye:**

- Sonido, multijugador, guardado de partida, tienda de mejoras, anti-trampas ni cambios en `saveScore`, vistas o modal.
- Assets externos: todo (peces, medusas, minas, barco) se dibuja proceduralmente en canvas.
- Overlays de pausa/game over en canvas (los pinta `GamePlayer`).

## Reglas del juego

**Mundo lógico:** 800×600. Superficie en `SURFACE_Y = 90`; el barco se dibuja en `y = 64`. Fondo del mar `FLOOR_Y = 580`. El anzuelo se mueve en `x ∈ [16, 784]`, `y ∈ [SURFACE_Y, 570]`.

**Entidades**

- **Anzuelo:** círculo de radio 8. Estado `descending` (valor por defecto) o `reeling` (ESPACIO mantenido). Deja un rastro de hasta 40 posiciones muestreadas cada 30 px recorridos; los peces enganchados se dibujan siguiendo ese rastro (cadena).
- **Sardina** (cyan, 28×14): cardúmenes de 3–5, velocidad 90 px/s, valor 10, aparece a cualquier profundidad.
- **Dorada** (amarillo, 40×18): velocidad 140 px/s, valor 25, solo en `y > 250`.
- **Pez linterna** (magenta, 36×16 con luz): velocidad 210 px/s, valor 60, solo en `y > 420`.
- **Medusa** (peligro, radio 22 + tentáculos hasta 40 px): deriva vertical senoidal (amplitud 40 px) a 40 px/s en horizontal. Contacto con el anzuelo: pierdes toda la captura enganchada y el anzuelo queda aturdido 0,6 s (sin mover x; sigue en su dirección vertical).
- **Mina de erizo** (peligro, radio 16, púas): fija en y, deriva a 30 px/s en horizontal. Contacto: pierdes una vida y la captura; el anzuelo reaparece en `SURFACE_Y` con 1,5 s de invulnerabilidad (parpadeo).
- Los peces y peligros que salen por un lado reaparecen por el opuesto con nueva `y` aleatoria dentro de su zona.

**Enganche:** al solaparse el círculo del anzuelo con un pez (rectángulo) en `descending` o `reeling`, el pez se engancha (se quita del mundo y entra en la cadena) si la cadena tiene menos de 6 peces; con 6, los peces nuevos se ignoran (se muestra "LÍNEA LLENA").

**Aire:** cada inmersión tiene `airTime = max(10, 18 - 0,5·(level-1))` segundos, mostrado como barra en el canvas. Al llegar a 0, el anzuelo sube solo a 1,5× la velocidad de recogida (puedes seguir moviéndote en x). Sin penalización adicional.

**Ciclo de inmersión:**

1. El anzuelo aparece en la superficie y desciende solo (110 px/s; ↓ mantenida lo hace bajar a 220 px/s).
2. ESPACIO mantenido = recoger (sube a 300 px/s). Al soltar vuelve a descender.
3. Al tocar `FLOOR_Y` el descenso se detiene; sigue disponible solo recoger.
4. Al llegar a `SURFACE_Y` subiendo con ≥ 1 pez en la cadena se **cobra** la captura (ver tabla), la cadena se vacía y empieza la siguiente inmersión (aire reiniciado). Si llega sin peces, solo se reinicia el aire.

**Puntuación (exacta)**

| Evento                                              | Puntos                                                          |
| --------------------------------------------------- | --------------------------------------------------------------- |
| Cobrar captura de n peces                           | `suma de valores × n`                                           |
| Bonus de profundidad al cobrar                      | `+ floor(maxDepth / 50) × 5`, con `maxDepth = max(y) - SURFACE_Y` de esa inmersión |
| REDADA (cobrar 5 o 6 peces)                         | `+ 100 × level`                                                 |
| Inmersión limpia (sin perder captura ni vida) × 3 seguidas | `+ 50 × level` (racha se reinicia al cobrarlo)           |
| Medusa / mina / expirar aire                        | 0 (solo se pierde lo enganchado)                                |

Ejemplo máximo por inmersión: 6 linternas = 360 × 6 = 2160 + profundidad ~50 + redada 100×level. Tope realista de partida: muy por debajo de 99.999.999.

**Progresión**

- `level = 1 + floor(inmersiones cobradas / 3)`.
- Velocidad de peces y peligros: `× (1 + 0,08 · (level-1))` hasta ×2,2.
- Población objetivo: peces `8 + level` (máx. 16); medusas `1 + floor(level / 2)` (máx. 5); minas `floor((level + 1) / 2)` (máx. 5).
- Cardúmenes deep más frecuentes con el nivel (probabilidad de linterna +3 % por nivel hasta 35 %).

**Condiciones de fin**

- Vidas = 3 al inicio. Perder la última vida → `onGameOver(score)` una sola vez. No hay victoria; partidas esperadas de 2–5 minutos.

**Constantes iniciales (`constants.ts`)**

```
W = 800, H = 600, SURFACE_Y = 90, FLOOR_Y = 580
HOOK_R = 8, HOOK_STEER = 260, DESCEND = 110, DESCEND_FAST = 220, REEL = 300
CHAIN_MAX = 6, AIR_BASE = 18, AIR_MIN = 10, STUN = 0.6, INVULN = 1.5
MAX_DT = 0.05, LIVES = 3, DIVES_PER_LEVEL = 3
```

**Controles**

| Acción  | Teclas                        | Tipo      |
| ------- | ----------------------------- | --------- |
| `left`  | ← / A                         | mantenida |
| `right` | → / D                         | mantenida |
| `down`  | ↓ / S (descenso rápido)       | mantenida |
| `reel`  | ESPACIO (recoger)             | mantenida |

Táctil: cruceta ← → ↓ y botón A = `reel` (mantenido, sin `repeat`). `AnzueloAction = "left" | "right" | "down" | "reel"`.

## Modelo de datos

- Fila nueva en `public.games`: `id = 'anzuelo'`, `title = 'ANZUELO'`, `short = 'Pesca en la sima y esquiva medusas eléctricas.'`, `long` del apartado Long, `cat = 'ARCADE'`, `cover = 'cover-anzuelo'`, `color = 'magenta'`, `playable = true`, `sort_order = 21` (comprobar que esté libre al implementar; si no, el siguiente libre).
- HUD: `{ score, lives, level }`. Puntuación enviada: entero 0–99.999.999.
- Sin cambios de esquema.

## Archivos

```
lib/games/anzuelo/{types,constants,entities,engine}.ts      nuevo
components/games/AnzueloCanvas.tsx                          nuevo
components/games/registry.tsx                               entrada nueva
app/globals.css                                             .cover-anzuelo + .anzuelo-canvas
supabase/migrations/<timestamp>_anzuelo_playable.sql        nuevo (insert)
references/implemented-games/implemented-games.md           fila nueva
specs/16-anzuelo.md                                         este spec
CLAUDE.md                                                   juegos jugables / specs implementados
```

## Plan de implementación

1. Leer documentación de Next 16.3.3 (Client Components) y `engine-contract.md`.
2. `types.ts` (`AnzueloHud`, `AnzueloCallbacks`, `AnzueloGame`, `AnzueloAction`) y `constants.ts` (mundo, paleta, tuning).
3. `entities.ts`: fábricas y `draw(ctx)` de anzuelo con cadena, peces (3 tipos), medusa, mina, barco, fondo con gradiente y burbujas.
4. `engine.ts`: bucle rAF con `MAX_DT`, `phase`, spawner/despoblador, colisiones, cobro, aire, vidas, `onHud` solo al cambiar, `KEY_ACTIONS` → `press/release/releaseAll`, pausa automática por `blur`.
5. `AnzueloCanvas.tsx` con las transiciones de estado del contrato.
6. Registry + CSS (`.cover-anzuelo`, `.anzuelo-canvas`) con `/frontend-design`.
7. Migración (insert, `playable = true`) + `get_advisors`.
8. Verificación manual y `npm run build` / `npm run lint`.

## Criterios de aceptación

- [ ] El juego no arranca hasta pulsar EMPEZAR/Espacio; pausa (P/Esc/botón y automática) y fin funcionan.
- [ ] El anzuelo desciende solo, ESPACIO mantenido lo sube y al llegar arriba cobra la captura según la tabla.
- [ ] Medusa quita la captura y aturde; mina quita captura y una vida; con 0 vidas `onGameOver` se llama una sola vez.
- [ ] La cadena admite máximo 6 peces y el aire agotado sube el anzuelo automáticamente.
- [ ] Nivel sube cada 3 inmersiones cobradas y aumenta velocidad/población según las fórmulas.
- [ ] `onHud` solo al cambiar valores; sin `any`/`@ts-ignore`, sin globals mutables, sin acceso a DOM/`window` en el cuerpo del módulo.
- [ ] Sin rAF ni listeners residuales al salir de la página; canvas 4:3 nítido en HiDPI; teclas no quedan pegadas al pausar.
- [ ] Mando táctil funcional (cruceta + botón A) y `releaseAll` al salir de `playing`.
- [ ] `games.playable = true` para `anzuelo` en el proyecto remoto; `get_advisors` sin avisos nuevos.
- [ ] Invitado: "INICIA SESIÓN PARA GUARDAR TU MARCA" → `/auth`. Con sesión: se guarda y aparece en `/juegos/anzuelo` y `/salon?juego=anzuelo`.
- [ ] Los demás juegos y los simulados no cambian.
- [ ] `npm run build` y `npm run lint` sin errores; consola sin errores.

## Decisiones tomadas y descartadas

- **El jugador controla solo el anzuelo, no el barco.** Mantiene la acción centrada en una entidad y el control en 4 acciones. _Descartado:_ mover barco y anzuelo por separado.
- **Enganche automático por contacto.** Evita un botón de acción extra y sostiene el ritmo. _Descartado:_ botón de "picar".
- **Multiplicador = número de peces.** Incentiva arriesgarse a seguir enganchando antes de subir. _Descartado:_ puntos planos por pez.
- **Medusa quita captura, mina quita vida.** Dos niveles de castigo con lectura visual distinta. _Descartado:_ un solo peligro.
- **Aire como temporizador de inmersión, no como vida.** Presiona sin añadir otra métrica al HUD (HUD ⊂ score/lives/level/lines). _Descartado:_ barra de oxígeno global.
- **Dibujo procedural.** Sin assets que cargar ni licenciar.

## Riesgos identificados

- StrictMode (doble montaje), Espacio compartido con la página (preventDefault y foco en botones), callbacks obsoletos, teclas pegadas al pausar, rendimiento de `shadowBlur` con muchos peces (usar glow barato o limitar).
- Equilibrio: el multiplicador por n puede dominar la puntuación; ajustar `CHAIN_MAX` o el factor si las marcas se disparan.
- Cadena visual: el rastro debe verse legible con velocidades de reel altas; limitar longitud y espaciado.
- `sort_order = 21` puede colisionar con otra propuesta de la jam; confirmar al implementar.
- Dos pulsaciones simultáneas (← + ESPACIO) en teclados con ghosting: no se espera problema con solo 2–3 teclas.
