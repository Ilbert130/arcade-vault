# 13 — GAMEPAD MK-II: mando táctil con acabado de consola profesional

**Estado:** Aprobado
**Depende de:** SPEC 12-controles-tactiles-movil
**Fecha:** 2026-10-20

**Objetivo:** Sustituir el aspecto actual del mando táctil (`TouchPad`) por el diseño "Gamepad MK-II" de `references/gamepad-assets/`, con silueta fija (cruz completa + A/B), serigrafía discreta, medias carcasas en horizontal y paleta que sigue la skin del juego (clasico/neon/retro).

## Alcance

**Incluye:**

- Rediseño visual de `components/games/TouchPad.tsx` y de su CSS en `app/globals.css` siguiendo `references/gamepad-assets/gamepad.html` y `gamepad-neon.png` (diseñado con `/frontend-design`):
  - **Carcasa**: gradiente `#1c1c28 → #0c0c14`, borde `--line`, filete interior a 4 px, textura de puntos de 8 px, sombra exterior con halo y sombras internas (bisel superior/inferior).
  - **Cruceta**: 4 teclas independientes (gradiente oscuro, radio 10 px, sombra de base `0 4px 0`), flechas en SVG (no glifos de texto) y **hub central** con gema en rombo que pulsa (`pulse-led`, 2 s).
  - **A/B**: redondos, lado a lado (B a la izquierda, A a la derecha), con brillo especular, letra en `--pixel`, anillo discontinuo que aparece al pulsar. A magenta, **B cyan** (deja de ser amarillo).
  - **Estado pulsado** (`[data-pressed]`): la tecla baja 3–4 px, pierde la sombra de base y se ilumina con el color de acento (equivalente a `.on` / `:active` del MK-II).
- **Silueta fija en todos los juegos**: siempre se pintan las 4 teclas de la cruceta y los botones A y B. Los slots sin entrada en `entry.touch` se renderizan **inertes** (apagados, `aria-disabled`, sin handlers ni glow) para que el mando tenga la misma forma en todos los juegos.
- **Serigrafía**: el `label` de A y B se muestra como texto pequeño "grabado" en la carcasa bajo cada botón (sin texto en la cruceta). Los botones inertes no llevan serigrafía. Los `label` de la cruceta solo quedan en el `aria-label`.
- **Layouts** (manteniendo los breakpoints y `--key` de SPEC 12):
  - Tableta (`pointer: coarse`, ancho): carcasa única bajo el CRT, cruceta a la izquierda y A/B a la derecha.
  - Móvil vertical: carcasa única bajo el CRT a todo el ancho.
  - Móvil horizontal: **dos medias carcasas** ("grips") a los lados del CRT: la izquierda con la cruceta y la derecha con A/B, cada una con su propia carcasa MK-II.
- **Skins del mando**: `TouchPad` recibe la skin activa del reproductor (`skin: SkinId`) y la expone como `data-skin` en `.touch-pad`. Tres paletas con variables CSS:
  - `clasico` — MK-II exacto (cyan/magenta, glow moderado). Es la de por defecto.
  - `neon` — MK-II con más glow, borde y filete más saturados, halo exterior más intenso.
  - `retro` — consola tipo NES: carcasa gris/beige, cruceta negra, A/B rojos, sin glow ni halo; la gema del hub en rojo sin animación de glow.
- Mismo comportamiento de entrada que SPEC 12 (Pointer Events, multitoque, `repeat`, `releaseAll`, inactivo fuera de `playing`, `touch-action: none`, bloqueo de `contextmenu`).
- Actualizar `CLAUDE.md` (sección Games: mando MK-II, silueta fija, `skin` en `TouchPad`), `.claude/skills/add-game/references/game-registry.md` (los slots no declarados se ven inertes; solo A/B muestran `label`) y `.claude/agents/mobile-porter.md` (referencia visual MK-II y medias carcasas en horizontal).

**No incluye:**

- Mostrar el mando en escritorio (con ratón sigue oculto; solo `@media (pointer: coarse)`).
- Reflejar en el mando las teclas pulsadas con el teclado.
- Interruptor para mostrar/ocultar el mando o persistir esa preferencia.
- Vibración háptica (`navigator.vibrate`).
- Paletas del mando definidas por juego (las 3 paletas son comunes a todos).
- Cambios en `TouchSlot`, `TouchButton`, `TouchLayout`, `GameInput`, motores, `registry.tsx` (mapeos), reglas, puntuación, `saveScore` o Supabase.
- Gestos sobre el canvas, pantalla completa, Gamepad API (siguen fuera, como en SPEC 12).
- Selector de skin nuevo: se reutiliza el `SkinSwitch` existente de `GamePlayer`.

## Modelo de datos

Sin cambios en base de datos ni en `lib/games/touch.ts`. Únicos cambios de datos:

```ts
// components/games/TouchPad.tsx
type TouchPadProps = {
  layout: TouchLayout;
  status: GameStatus;
  inputRef: RefObject<GameInput | null>;
  skin: SkinId; // nuevo: skin activa del reproductor (lib/games/skins.ts)
};
```

```html
<!-- DOM resultante (esquema) -->
<div class="touch-pad" data-skin="clasico|neon|retro">
  <div class="touch-shell touch-shell--dpad">
    <div class="touch-dpad">
      <button class="touch-btn touch-btn--up">…svg…</button>
      <!-- slot sin acción: -->
      <button class="touch-btn touch-btn--down" aria-disabled="true" data-inert>
        …
      </button>
      …
      <span class="touch-dpad-hub" aria-hidden="true"
        ><span class="touch-dpad-gem"></span
      ></span>
    </div>
  </div>
  <div class="touch-shell touch-shell--actions">
    <div class="touch-actions">
      <!-- B a la izquierda, A a la derecha; serigrafía bajo cada uno -->
    </div>
  </div>
</div>
```

En vertical/tableta las dos `.touch-shell` se funden visualmente en una sola carcasa (la carcasa la pinta `.touch-pad`); en horizontal cada `.touch-shell` pinta su propia carcasa.

Variables CSS por skin (en `.touch-pad[data-skin="…"]`): `--pad-shell-top`, `--pad-shell-bottom`, `--pad-line`, `--pad-halo`, `--pad-key-top`, `--pad-key-bottom`, `--pad-key-ink`, `--pad-accent` (cruceta pulsada, gema), `--pad-a`, `--pad-b`, `--pad-glow` (multiplicador/intensidad del glow; 0 en `retro`).

## Archivos

```
components/games/TouchPad.tsx              silueta fija, slots inertes, SVG, hub, carcasas, prop skin
components/GamePlayer.tsx                  pasa skin={skin} a TouchPad
app/globals.css                            CSS del mando MK-II + 3 paletas + medias carcasas en horizontal
.claude/skills/add-game/references/game-registry.md   slots inertes y serigrafía solo en A/B
.claude/agents/mobile-porter.md            referencia visual MK-II
CLAUDE.md                                  sección Games
specs/13-gamepad-mk2.md                    este spec
```

## Plan de implementación

1. Leer `references/gamepad-assets/gamepad.html` como referencia de medidas y sombras, e invocar `/frontend-design` para adaptar el MK-II a los tokens de `app/globals.css` y a `--key`.
2. `TouchPad.tsx`: renderizar siempre los 6 slots (los no declarados como botón inerte con `aria-disabled="true"` y `data-inert`, sin handlers ni `inputRef`); flechas SVG en lugar de glifos `▲▼◀▶`; hub con gema; orden A/B lado a lado (B, A); serigrafía solo en A/B con acción. El comportamiento de entrada no cambia. Compila y funciona con el CSS antiguo.
3. Añadir la prop `skin` a `TouchPad` (`data-skin`) y pasarla desde `GamePlayer.tsx`.
4. CSS base MK-II (skin `clasico`): carcasa, filete, textura, teclas de cruceta, hub, A/B, estado pulsado, estado inerte. Sustituye las reglas actuales de `.touch-btn*` / `.touch-actions`.
5. Layouts: carcasa única en tableta y móvil vertical; medias carcasas en móvil horizontal. Respetar `100dvh`, `--key` por container query y el resto del layout del reproductor de SPEC 12.
6. Paletas `neon` y `retro` como overrides de variables en `.touch-pad[data-skin]`.
7. Actualizar `CLAUDE.md`, `game-registry.md` de `/add-game` y `mobile-porter.md`.
8. Verificación: `npm run lint`, `npm run build` y auditoría del agente `mobile-porter` (Chrome DevTools, emulación táctil) en 390×844, 844×390, tableta (p. ej. 820×1180) y escritorio sin táctil, con los 4 juegos y las 3 skins.

## Criterios de aceptación

- [ ] Con emulación táctil, `/juegos/<id>/jugar` muestra el mando MK-II en ROCAS, CAÍDA, BLOQUE BUSTER y SERPENTINA; en escritorio con ratón no se ve.
- [ ] En los 4 juegos el mando tiene la misma silueta: 4 teclas de cruceta, hub con gema y botones B (izquierda) y A (derecha).
- [ ] Los slots sin acción en `entry.touch` se ven apagados, tienen `aria-disabled="true"`, no se iluminan al tocarlos y no llaman a `press`/`release` (p. ej. ▼ en ROCAS, ▲ en CAÍDA, ▲▼/A/B en BLOQUE BUSTER, A/B en SERPENTINA).
- [ ] Las flechas de la cruceta son SVG; no quedan glifos `▲▼◀▶` como texto en el mando.
- [ ] Bajo A y B con acción aparece su `label` como serigrafía en la carcasa; la cruceta no muestra texto y su `aria-label` conserva la acción.
- [ ] B es cyan y A magenta en `clasico`; al pulsar, la tecla baja, pierde la sombra de base y se ilumina; A/B muestran el anillo discontinuo.
- [ ] La gema del hub pulsa en `clasico` y `neon`.
- [ ] Cambiar la skin con `SkinSwitch` cambia el mando al momento: `neon` con más glow, `retro` gris/beige con A/B rojos y sin glow.
- [ ] En 390×844 vertical: HUD + CRT + carcasa única caben sin scroll durante la partida.
- [ ] En 844×390 horizontal: media carcasa con la cruceta a la izquierda, CRT al centro, media carcasa con A/B a la derecha, sin scroll ni solapes con el CRT.
- [ ] En tableta: carcasa única bajo el CRT.
- [ ] Siguen cumpliéndose los criterios de entrada de SPEC 12 (multitoque en ROCAS, repetición en CAÍDA, nada pegado al pausar, sin zoom/selección/menú contextual, mando inactivo fuera de `playing`).
- [ ] Con teclado los 4 juegos se comportan igual que antes.
- [ ] `npm run lint` y `npm run build` sin errores; consola del navegador sin errores.
- [ ] El informe de `mobile-porter` no reporta desbordes, scroll o solapes en los 4 viewports para los 4 juegos.
- [ ] `CLAUDE.md`, `game-registry.md` y `mobile-porter.md` describen el mando MK-II, los slots inertes y la prop `skin`.

## Decisiones tomadas y descartadas

- **Sí: `references/gamepad-assets/` (MK-II) es la referencia visual oficial del mando.** Es un componente ya diseñado con los tokens del portal (cyan/magenta, `--pixel`).
- **Sí: solo táctil (`pointer: coarse`).** **No:** mostrarlo en escritorio ni reflejar el teclado; añade layout de desktop sin necesidad y SPEC 12 ya resolvió la visibilidad.
- **Sí: silueta fija con slots inertes.** Un mando real no cambia de forma; el layout es estable entre juegos. **No:** ocultar los slots no usados (comportamiento de SPEC 12, que este spec reemplaza; el criterio "exactamente los slots de su fila" de SPEC 12 deja de aplicar en lo visual).
- **Sí: serigrafía discreta solo en A/B.** Mantiene la ayuda sin ensuciar el diseño. **No:** quitar todas las etiquetas (se pierde qué hace cada botón) ni mantenerlas en cada tecla (no es MK-II).
- **Sí: dos medias carcasas en horizontal** (estilo grips). Aprovecha el alto. **No:** carcasa única debajo (el CRT pierde alto en pantallas bajas) ni botones sin carcasa.
- **Sí: paletas por skin común** (MK-II + `neon` + `retro`) con variables CSS. **No:** paleta definida por juego (más trabajo por juego y para `/add-game`) ni solo cambiar el acento.
- **Sí: B pasa de amarillo a cyan**, como en el MK-II.
- **Sí: flechas SVG** en vez de glifos de texto: nitidez y alineación consistentes entre fuentes y dispositivos.
- **No: vibración háptica** (no existe en iOS; se mantiene la decisión de SPEC 12).
- **No: cambiar tipos de `lib/games/touch.ts` ni mapeos del registry.** El rediseño es solo de presentación.

## Riesgos identificados

| Riesgo                                                                          | Mitigación                                                                                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Las medias carcasas restan ancho al CRT en móviles horizontales estrechos       | Medidas derivadas de `--key`; carcasa con padding mínimo en `max-height: 480px`; criterio de aceptación en 844×390. |
| Glow, `box-shadow` múltiples y la animación de la gema penalizan el rendimiento | Animación solo de `opacity`/`transform`; sin `filter` en elementos animados; `prefers-reduced-motion` la desactiva. |
| Un toque sobre un slot inerte se confunde con un fallo del mando                | Estado inerte claramente apagado y sin respuesta visual; `aria-disabled` para lectores de pantalla.                 |
| La carcasa más alta rompe el "sin scroll" de 390×844                            | Padding de carcasa proporcional a `--key`; validar con `mobile-porter` antes de cerrar.                             |
| Regresión de entrada al reestructurar el DOM del `TouchPad`                     | `PadButton` conserva su lógica; los inertes son otro componente sin handlers; re-verificar criterios de SPEC 12.    |
| `retro` con carcasa clara contrasta mal con el fondo oscuro del reproductor     | Revisar contraste en `/frontend-design`; borde oscuro alrededor de la carcasa clara.                                |

## Lo que **no** entra en este spec

- Mando visible en escritorio o reflejo del teclado.
- Interruptor del mando y su persistencia.
- Vibración háptica.
- Paletas del mando por juego.
- Gestos, pantalla completa y Gamepad API.

Cada uno de esos, si llega, va en su propio spec.
