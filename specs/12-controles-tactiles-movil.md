# 12 — CONTROLES TÁCTILES: jugar desde el móvil con mando virtual

**Estado:** Aprobado
**Depende de:** SPEC 05-asteroides-rocas, SPEC 07-tetris-caida, SPEC 08-arkanoid-bloque-buster, SPEC 10-snake-serpentina, SPEC 11-invasores
**Fecha:** 2026-10-19

**Objetivo:** Que todos los juegos jugables se puedan jugar en un dispositivo táctil mediante un mando virtual en pantalla (cruceta + botones A/B) definido por juego en el registry y conectado a una API de entrada común en cada motor.

## Alcance

**Incluye:**

- API de entrada en los motores: cada motor expone `press(action)`, `release(action)` y `releaseAll()`, y su manejo de teclado pasa a traducir teclas a acciones y llamar a esas mismas funciones (el comportamiento con teclado no cambia).
- Tipos comunes en `lib/games/touch.ts`: `TouchSlot`, `TouchButton`, `TouchLayout`, `GameInput` y el helper `touchLayout<A>()`.
- Campo **obligatorio** `touch: TouchLayout` en `GameEntry` (`components/games/registry.tsx`) y prop `inputRef` en `GameRenderProps`.
- Componente `components/games/TouchPad.tsx`: cruceta (slots `up`/`down`/`left`/`right`) y botones de acción (slots `a`/`b`) con Pointer Events, multitoque y repetición al mantener.
- Integración en `components/GamePlayer.tsx`: crea `inputRef`, renderiza `TouchPad` solo para juegos con entrada en el registry, y llama a `releaseAll()` al salir de `playing`.
- Los 4 Canvas actuales (`AsteroidsCanvas`, `TetrisCanvas`, `BloqueBusterCanvas`, `SerpentinaCanvas`) asignan el motor a `inputRef.current` al montar y lo limpian al desmontar.
- Visibilidad solo en dispositivos táctiles: `@media (pointer: coarse)`. En escritorio con ratón el mando no se renderiza visualmente (oculto por CSS) y nada cambia.
- Layout móvil en `app/globals.css` (diseñado con `/frontend-design`, tokens CRT existentes):
  - Vertical: HUD compacto, CRT a todo el ancho, mando debajo (cruceta a la izquierda, A/B a la derecha), sin scroll de página en un móvil de 390×844.
  - Horizontal: cruceta a la izquierda, CRT al centro limitado por `100dvh`, botones A/B a la derecha.
  - En `pointer: coarse` se oculta `.crt-controls` (las pistas de teclado no aplican).
- Botones con `touch-action: none`, `user-select: none`, `-webkit-touch-callout: none` y `contextmenu` bloqueado, para evitar zoom por doble toque, selección y menú contextual.
- Actualizar las referencias de `/add-game` (`.claude/skills/add-game/references/engine-contract.md` y `game-registry.md`) para que todo juego nuevo declare `press/release/releaseAll` y su `touch`.
- Actualizar `specs/11-invasores.md` (borrador): quitar "Mando táctil" de **No incluye** y añadir su `touch` (ver mapeo).
- Actualizar `CLAUDE.md` (sección Games: `touch`, `inputRef`, `TouchPad`).

**No incluye:**

- Gestos (swipe, tap o arrastre sobre el canvas), incluido arrastrar la pala de BLOQUE BUSTER con el dedo.
- Pantalla completa (Fullscreen API).
- Vibración háptica (`navigator.vibrate`).
- Interruptor manual para mostrar/ocultar el mando, ni persistencia de esa preferencia.
- Mando para los juegos simulados (sin entrada en `GAME_REGISTRY`).
- Rediseño de otras páginas (Home, Biblioteca, Salón) para móvil.
- Soporte de mandos físicos (Gamepad API).
- Cambios en reglas, puntuación, `saveScore`, Supabase o esquema (no se regeneran tipos).
- Implementar INVASORES (solo se actualiza su spec).

## Modelo de datos

Sin cambios en base de datos. Estructuras nuevas en `lib/games/touch.ts`:

```ts
export type TouchSlot = "up" | "down" | "left" | "right" | "a" | "b";
export type TouchButton<A extends string = string> = {
  slot: TouchSlot;
  action: A; // acción del motor que dispara
  label: string; // texto corto bajo/sobre el botón, p. ej. "ROTAR"
  repeat?: boolean; // true: repite press() mientras se mantiene
};
export type TouchLayout = TouchButton[];
// Lo que GamePlayer/TouchPad ve de un motor.
export type GameInput = {
  press(action: string): void;
  release(action: string): void;
  releaseAll(): void;
};
```

- `touchLayout<A>(buttons: TouchButton<A>[])` tipa las acciones contra la unión del motor, así una acción mal escrita falla en `tsc`.
- Cada motor exporta en su `types.ts` su unión de acciones (`AsteroidsAction`, `TetrisAction`, `BloqueBusterAction`, `SerpentinaAction`) y en su objeto devuelto `press/release/releaseAll`. Acciones desconocidas se ignoran.
- Semántica: `press` = keydown, `release` = keyup. Las acciones solo tienen efecto con `phase === "playing"` (igual que el teclado).
- Repetición (solo botones con `repeat: true`): `press` inmediato, espera de 170 ms y luego `press` cada 50 ms hasta soltar. Constantes `REPEAT_DELAY_MS = 170` y `REPEAT_INTERVAL_MS = 50` en `TouchPad.tsx`.
- `GameRenderProps.inputRef: RefObject<GameInput | null>`.

### Mapeo por juego

| Juego                 | Slot                       | Acción                     | Etiqueta  | Repite        |
| --------------------- | -------------------------- | -------------------------- | --------- | ------------- |
| `rocas`               | `left`                     | `rotateLeft`               | GIRAR     | no (mantener) |
| `rocas`               | `right`                    | `rotateRight`              | GIRAR     | no (mantener) |
| `rocas`               | `up`                       | `thrust`                   | PROPULSAR | no (mantener) |
| `rocas`               | `a`                        | `fire`                     | DISPARAR  | no (mantener) |
| `caida`               | `left`                     | `moveLeft`                 | MOVER     | sí            |
| `caida`               | `right`                    | `moveRight`                | MOVER     | sí            |
| `caida`               | `down`                     | `softDrop`                 | BAJAR     | sí            |
| `caida`               | `a`                        | `rotate`                   | ROTAR     | no            |
| `caida`               | `b`                        | `hardDrop`                 | SOLTAR    | no            |
| `bloque-buster`       | `left`                     | `left`                     | MOVER     | no (mantener) |
| `bloque-buster`       | `right`                    | `right`                    | MOVER     | no (mantener) |
| `serpentina`          | `up`/`down`/`left`/`right` | `up`/`down`/`left`/`right` | —         | no            |
| `invasores` (SPEC 11) | `left`/`right`             | `left`/`right`             | MOVER     | no (mantener) |
| `invasores` (SPEC 11) | `a`                        | `fire`                     | DISPARAR  | no (mantener) |

Los slots no usados por un juego no se pintan (BLOQUE BUSTER muestra solo ◀ ▶; SERPENTINA no muestra A/B).

## Archivos

```
lib/games/touch.ts                                   nuevo
components/games/TouchPad.tsx                        nuevo
components/games/registry.tsx                        touch obligatorio + inputRef
components/GamePlayer.tsx                            inputRef, TouchPad, releaseAll
components/games/{Asteroids,Tetris,BloqueBuster,Serpentina}Canvas.tsx   asignan inputRef
lib/games/{asteroids,tetris,bloque-buster,serpentina}/types.ts         unión de acciones
lib/games/{asteroids,tetris,bloque-buster,serpentina}/engine.ts        press/release/releaseAll
app/globals.css                                      .touch-pad + layout móvil
.claude/skills/add-game/references/engine-contract.md
.claude/skills/add-game/references/game-registry.md
specs/11-invasores.md                                mando táctil en alcance
CLAUDE.md                                            sección Games
specs/12-controles-tactiles-movil.md                 este spec
```

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/` lo relativo a Client Components y a `viewport` (confirmar que Next ya emite `width=device-width, initial-scale=1`; no se desactiva el zoom).
2. Crear `lib/games/touch.ts` con los tipos y `touchLayout<A>()`. Sin uso todavía; compila.
3. Añadir `touch` como campo **opcional** a `GameEntry` e `inputRef` opcional a `GameRenderProps`. Nada cambia en ejecución.
4. ROCAS: unión `AsteroidsAction` en `types.ts`; en `engine.ts` mapa tecla→acción, `press/release/releaseAll` (el teclado llama a estas funciones; `releaseAll` reutiliza `clearKeys`); `AsteroidsCanvas` asigna `inputRef`; entrada `touch` en el registry. Prueba manual con teclado: igual que antes.
5. CAÍDA: ídem (`TetrisAction`; `rotate` y `hardDrop` ignoran repetición igual que `e.repeat`).
6. BLOQUE BUSTER: ídem (`BloqueBusterAction`; el ratón sigue igual).
7. SERPENTINA: ídem (`SerpentinaAction`; `press(dir)` llama a `queueTurn`).
8. Hacer `touch` e `inputRef` **obligatorios**; `tsc` confirma que los 4 juegos los tienen.
9. `TouchPad.tsx`: Pointer Events con `setPointerCapture`; `pointerup`/`pointercancel`/`lostpointercapture` → `release`; un temporizador de repetición por botón; estado visual pulsado; `releaseAll` y limpieza de temporizadores al desmontar o cuando `status !== "playing"`.
10. `GamePlayer.tsx`: `inputRef`, pasar a `entry.Canvas`, renderizar `<TouchPad layout={entry.touch} status={status} inputRef={inputRef} />` y `releaseAll()` al pausar/terminar/autopausa.
11. CSS con `/frontend-design`: `.touch-pad` oculto por defecto y visible en `@media (pointer: coarse)`; layout vertical y horizontal; HUD compacto; ocultar `.crt-controls` en táctil.
12. Actualizar referencias de `/add-game`, `specs/11-invasores.md` y `CLAUDE.md`.
13. Verificación con Chrome DevTools MCP (emulación táctil 390×844 vertical y 844×390 horizontal, y escritorio sin táctil), `npm run build` y `npm run lint`.

## Criterios de aceptación

- [ ] Con emulación táctil (`pointer: coarse`), `/juegos/<id>/jugar` muestra el mando en los 4 juegos jugables; en escritorio con ratón no se ve.
- [ ] Cada juego muestra exactamente los slots de su fila en el mapeo y ninguno más.
- [ ] ROCAS: mantener GIRAR + PROPULSAR + DISPARAR a la vez (multitoque) gira, acelera y dispara simultáneamente; soltar detiene cada acción.
- [ ] CAÍDA: un toque en ◀/▶ mueve una columna; mantener repite tras ~170 ms; ROTAR y SOLTAR actúan una vez por toque.
- [ ] BLOQUE BUSTER: mantener ◀/▶ mueve la pala de forma continua y se detiene al soltar.
- [ ] SERPENTINA: los 4 botones giran la serpiente, sin giro de 180° (misma cola de giros que el teclado).
- [ ] Los botones del mando no tienen efecto en estado `ready`, `paused` u `over`.
- [ ] Pausar, perder el foco u ocultar la pestaña con un botón mantenido no deja la acción pegada al reanudar.
- [ ] Deslizar el dedo fuera del botón o un `pointercancel` suelta la acción.
- [ ] Mantener o tocar dos veces un botón no hace zoom, no selecciona texto ni abre menú contextual.
- [ ] En 390×844 vertical, HUD + CRT + mando caben sin scroll vertical durante la partida; en 844×390 horizontal, la cruceta queda a la izquierda, el CRT al centro y A/B a la derecha, sin scroll.
- [ ] Con teclado, los 4 juegos se comportan igual que antes (controles, pausa, Espacio para empezar).
- [ ] Los juegos simulados no muestran mando.
- [ ] Quitar `touch` de una entrada del registry hace fallar `npm run build`.
- [ ] Las referencias de `/add-game` documentan `press/release/releaseAll` y `touch`; SPEC 11 incluye su mapeo táctil.
- [ ] `npm run build` y `npm run lint` sin errores; consola del navegador sin errores.

## Decisiones tomadas y descartadas

- **Sí: mando virtual** (cruceta + A/B) configurado por juego. Predecible, fiel al estilo arcade y preciso en ROCAS.
- **No: gestos ni híbrido.** Swipe/tap son imprecisos para ROCAS y añaden un segundo sistema de entrada; arrastrar la pala queda para otro spec.
- **Sí: API de entrada en el motor** (`press/release/releaseAll`), con el teclado pasando por la misma vía. Tipado y sin eventos falsos.
- **No: `KeyboardEvent` sintéticos.** Frágil con `e.repeat`, `preventDefault`, foco y `isTrusted`.
- **Sí: `inputRef` en `GameRenderProps`.** El Canvas ya posee el motor; exponerlo por ref evita un bus de eventos adicional.
- **Sí: `@media (pointer: coarse)`** para mostrar el mando. **No:** por ancho de pantalla (aparecería en escritorios estrechos) ni interruptor manual (más estado sin necesidad).
- **Sí: repetición en el mando** (170 ms / 50 ms) para acciones marcadas `repeat`. Sustituye el auto-repeat del teclado que el táctil no tiene.
- **Sí: vertical y horizontal.** **No:** forzar una sola orientación.
- **No: Fullscreen API.** iOS Safari no la soporta para elementos que no son vídeo; se compacta el layout en su lugar.
- **No: vibración.** `navigator.vibrate` no existe en iOS.
- **No: desactivar el zoom del viewport** (`user-scalable=no`), por accesibilidad; el zoom se evita solo sobre el mando con `touch-action: none`.
- **Sí: `touch` obligatorio** en `GameEntry` y skill `/add-game` actualizada, para que ningún juego futuro (empezando por INVASORES) salga sin mando.
- **Sí: EMPEZAR y PAUSA siguen siendo los botones existentes** de `GamePlayer`; el mando no arranca ni pausa.

## Riesgos identificados

| Riesgo                                                                    | Mitigación                                                                                                             |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Acción pegada si se pierde el `pointerup` (notificación, cambio de app)   | `pointercancel`/`lostpointercapture` sueltan; `releaseAll()` al salir de `playing`, en `blur` y `visibilitychange`.    |
| Regresión del teclado al refactorizar la entrada de los motores           | Un juego por paso, prueba manual con teclado en cada uno; el mapa tecla→acción conserva `preventDefault` y `e.repeat`. |
| iOS Safari: zoom por doble toque, lupa o selección al mantener            | `touch-action: none`, `user-select: none`, `-webkit-touch-callout: none`, `contextmenu` bloqueado en el mando.         |
| El CRT 4:3 + mando no caben en móviles bajos en horizontal                | CRT limitado por `100dvh` y mando lateral; criterio de aceptación en 844×390.                                          |
| `pointer: coarse` en portátiles táctiles con ratón                        | Aceptado: el mando se ve pero no estorba al teclado.                                                                   |
| StrictMode (doble montaje) deja `inputRef` apuntando a un motor destruido | El Canvas pone `inputRef.current = null` en la limpieza antes de `destroy()`.                                          |
| Emulación de DevTools no equivale a un móvil real                         | Prueba manual adicional en un dispositivo real si está disponible (`npm run dev` en la LAN).                           |

## Lo que **no** entra en este spec

- Gestos sobre el canvas y arrastre de la pala.
- Pantalla completa y vibración.
- Interruptor manual del mando.
- Mando en juegos simulados.
- Versión móvil de Home, Biblioteca o Salón.
- Gamepad API.
- Implementar INVASORES.

Cada uno de esos, si llega, va en su propio spec.
