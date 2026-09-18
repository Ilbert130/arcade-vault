# 03 — Biblioteca, Salón de la Fama y Autenticación reales

**Estado:** Implementado
**Depende de:** SPEC 01-home-landing-nav
**Fecha:** 2026-09-18

**Objetivo:** Reemplazar los placeholders "PRÓXIMAMENTE" de `/biblioteca`, `/salon` y `/auth` por sus pantallas reales (usando `lib/data.ts` y `lib/session.ts`, ya existentes en el repo), y hacer que el `Nav` refleje la sesión real del usuario en vez de mostrar siempre "Iniciar Sesión".

## Alcance

**Incluye:**
- Página `/biblioteca`: hero, buscador por texto (filtra por título, case-insensitive) y chips de categoría (`CATS`), grid de `GameCard` (ya existe el componente, navega a `/juegos/[id]`), y estado vacío "NO HAY RESULTADOS" cuando el filtro no encuentra nada. Portado de `references/templates/biblioteca.jsx`.
- Página `/auth`: tarjeta con tabs "Iniciar sesión" / "Crear cuenta", formulario (usuario, contraseña, y correo solo en la tab "Crear cuenta"), botón "JUGAR COMO INVITADO", botones sociales decorativos (Google/GitHub, sin funcionalidad real). Portado de `references/templates/auth.jsx`.
  - Al enviar el formulario (cualquiera de las dos tabs) o pulsar "Jugar como invitado": guarda la sesión vía `setUser()` de `lib/session.ts` (el nombre ingresado en mayúsculas, máx. 10 caracteres, o `null` para invitado) y redirige a `/biblioteca`.
  - Sin validación real de credenciales contra ningún backend (igual que el template): cualquier usuario/contraseña no vacíos "inician sesión".
- Página `/salon`: tabs por juego (uno por cada `GAMES[i].id`), podio top 3 (oro/plata/bronce) y tabla completa de puntuaciones generadas con `seededScores`, más la fila "tu mejor marca" si `getUser()` retorna una sesión activa. Portado de `references/templates/salon.jsx`. Botón "VOLVER A LA BIBLIOTECA" → `/biblioteca`.
- `components/Nav.tsx` deja de mostrar siempre "Iniciar Sesión": lee la sesión con `getUser()` (client-side, en un `useEffect`/estado para evitar mismatch de hidratación) y:
  - Sin sesión: se comporta igual que hoy (botón "Iniciar Sesión" → `/auth`).
  - Con sesión: el botón muestra el nombre del usuario (o "INVITADO" si la sesión es de invitado) y, junto a él (o en un dropdown/botón adicional simple), una opción "Cerrar sesión" que llama `setUser(null)` y refresca el estado del Nav (sin necesariamente redirigir).
  - Este mismo comportamiento aplica en el panel móvil del Nav.
- Reemplazo de los tres `<ComingSoon />` actuales (`app/biblioteca/page.tsx`, `app/salon/page.tsx`, `app/auth/page.tsx`) por las páginas reales.

**No incluye (fuera de alcance de este spec):**
- Validación real de credenciales, backend de autenticación, o proveedores OAuth reales (los botones de Google/GitHub siguen siendo decorativos).
- Guards de ruta: `/auth`, `/biblioteca` y `/salon` funcionan igual con o sin sesión activa; no hay redirecciones automáticas por tener/no tener sesión.
- Sistema de créditos funcional — el contador "CRÉDITOS · 03" del Nav sigue siendo decorativo y fijo.
- Cualquier cambio a `/juegos/[id]`, `/juegos/[id]/jugar`, `/`, `/about`, `lib/data.ts` o `lib/session.ts` — ya están implementados y funcionando; este spec solo los consume.
- Registro de usuarios persistente más allá de `localStorage` (`av_user`), o recuperación de contraseña.

## Modelo de datos

No se introduce ningún modelo de datos nuevo. Este spec consume exclusivamente lo que ya existe:

- `lib/data.ts`: `GAMES`, `CATS`, `seededScores` (ya implementados, sin cambios).
- `lib/session.ts`: `getUser()`, `setUser()` (ya implementados, sin cambios).

## Plan de implementación

1. **Componente Library.** Crear `components/Library.tsx` (client component) portando `biblioteca.jsx`: hero, buscador (`useState` para `q`), chips de categoría (`useState` para `cat`), grid filtrado (`useMemo`) usando el `GameCard` ya existente, y el estado vacío "NO HAY RESULTADOS".
2. **Página Biblioteca.** Reemplazar `app/biblioteca/page.tsx` (hoy `<ComingSoon title="BIBLIOTECA" />`) para renderizar `<Library />`.
3. **Componente HallOfFame.** Crear `components/HallOfFame.tsx` (client component) portando `salon.jsx`: tabs por juego (`useState` para `tab`, inicializado en `GAMES[0].id`), podio top 3 y tabla completa vía `seededScores(tab.length * 23 + 7, 12)`, fila "tu mejor marca" leyendo `getUser()` en un `useEffect`/estado (para evitar mismatch de hidratación con `localStorage`), botón "VOLVER A LA BIBLIOTECA" → `/biblioteca` con `next/link`.
4. **Página Salón.** Reemplazar `app/salon/page.tsx` (hoy `<ComingSoon title="SALÓN DE LA FAMA" />`) para renderizar `<HallOfFame />`.
5. **Componente Auth.** Crear `components/Auth.tsx` (client component) portando `auth.jsx`: tabs "in"/"up" (`useState`), campos usuario/contraseña (y correo solo en "up"), `onSubmit` que llama `setUser({ name: (user || "PLAYER1").toUpperCase().slice(0, 10) })` y redirige a `/biblioteca` con `useRouter().push`; botón "JUGAR COMO INVITADO" que llama `setUser(null)` y redirige igual a `/biblioteca`; botones sociales decorativos sin `onClick` funcional.
6. **Página Auth.** Reemplazar `app/auth/page.tsx` (hoy `<ComingSoon title="INICIAR SESIÓN" />`) para renderizar `<Auth />`.
7. **Nav consciente de sesión.** En `components/Nav.tsx`: agregar estado local (`useState<SessionUser | null>`) inicializado en `null` y actualizado en un `useEffect` que llama `getUser()` al montar (evita error de hidratación por leer `localStorage` durante el render inicial). Reemplazar el botón fijo "Iniciar Sesión" por: si no hay sesión, el botón actual sin cambios; si hay sesión, mostrar el nombre (o "INVITADO") y un botón/enlace "Salir" que llama `setUser(null)` y actualiza el estado local del Nav a `null` (sin redirigir). Aplicar el mismo patrón en el panel móvil.
8. **Verificación manual.** Levantar `npm run dev`:
   - En `/biblioteca`: confirmar que el buscador filtra por texto, los chips filtran por categoría, y que una búsqueda sin resultados muestra "NO HAY RESULTADOS"; hacer click en una tarjeta y confirmar que navega a `/juegos/[id]`.
   - En `/auth`: alternar entre las dos tabs, enviar el formulario de "Iniciar sesión" con un nombre y confirmar que redirige a `/biblioteca` y que el Nav ahora muestra ese nombre; cerrar sesión desde el Nav y confirmar que vuelve a mostrar "Iniciar Sesión"; repetir con "JUGAR COMO INVITADO" y confirmar que el Nav muestra "INVITADO".
   - En `/salon`: cambiar entre tabs de juego, confirmar que el podio y la tabla cambian; con sesión activa, confirmar que aparece la fila "tu mejor marca"; sin sesión, confirmar que no aparece; pulsar "VOLVER A LA BIBLIOTECA" y confirmar que navega a `/biblioteca`.
   - Confirmar que ninguna de las tres rutas muestra ya el texto "PRÓXIMAMENTE".
   - `npm run build` debe completar sin errores.

## Criterios de aceptación

- [ ] `/biblioteca` ya no muestra "PRÓXIMAMENTE"; muestra hero, buscador funcional, chips de categoría funcionales, grid de `GameCard` con los datos de `GAMES`, y el estado vacío cuando no hay resultados.
- [ ] Cada `GameCard` en `/biblioteca` navega a `/juegos/[id]` al hacer click.
- [ ] `/auth` ya no muestra "PRÓXIMAMENTE"; permite alternar entre "Iniciar sesión" y "Crear cuenta", enviar el formulario guarda la sesión en `localStorage` (`av_user`) y redirige a `/biblioteca`; "JUGAR COMO INVITADO" limpia la sesión (`av_user` a `null`) y redirige igual a `/biblioteca`.
- [ ] `/salon` ya no muestra "PRÓXIMAMENTE"; muestra tabs por juego, podio top 3, tabla completa de puntuaciones, y la fila "tu mejor marca" solo si hay una sesión activa en `localStorage`. El botón "VOLVER A LA BIBLIOTECA" navega a `/biblioteca`.
- [ ] El `Nav` muestra "Iniciar Sesión" cuando no hay sesión, y el nombre del usuario (o "INVITADO") junto con una opción para cerrar sesión cuando sí la hay, tanto en desktop como en el panel móvil.
- [ ] Cerrar sesión desde el Nav actualiza el Nav inmediatamente a "Iniciar Sesión" sin recargar la página.
- [ ] `npm run dev` inicia sin errores y la consola del navegador no muestra errores en `/biblioteca`, `/salon` ni `/auth`.
- [ ] `npm run build` completa exitosamente.

## Decisiones tomadas y descartadas

- **Nav refleja la sesión real** en vez de mantenerse siempre en "sin sesión" (decisión original del spec 01-home-landing-nav, tomada quel entonces porque no existía auth real). *Motivo del cambio:* ahora sí hay una sesión real gestionada por `lib/session.ts`, y dejar el Nav estático se sentiría roto justo después de loguearse.
- **Redirección post-auth a `/biblioteca`** (no a `/`), igual que el template original (`auth.jsx` navega a `biblioteca`), porque `/biblioteca` es ahora la pantalla real de juegos y es el destino natural tras autenticarse.
- **Sin guards de ruta:** `/auth`, `/biblioteca` y `/salon` se comportan igual con o sin sesión activa, replicando el comportamiento del template original y evitando lógica de redirección no solicitada.
- **Sin validación real de credenciales:** se mantiene el comportamiento del template (cualquier usuario/contraseña no vacíos autentican), ya que no existe backend de auth y no es parte de este spec.
- **Contador de créditos permanece decorativo:** no se introduce lógica de créditos; fuera de alcance de este spec.
- **Reutilización de `lib/data.ts`, `lib/session.ts` y `GameCard` ya existentes**, sin modificarlos, porque ya implementan exactamente lo que estas tres pantallas necesitan (quedaron del trabajo previo de la SPEC 01-mvp-pantallas-visuales).

## Riesgos identificados

- Leer `localStorage` en `Nav.tsx` (client component compartido por todas las páginas) requiere inicializar el estado de sesión en `null` y poblarlo en un `useEffect`, no directamente en el render, para evitar un mismatch de hidratación entre servidor y cliente.
- `components/Nav.tsx` ya tiene una estructura fija (desktop + panel móvil) portada en el spec 01-home-landing-nav; agregar el estado "con sesión" debe integrarse sin romper el layout ni la clase `active` de los links existentes.
