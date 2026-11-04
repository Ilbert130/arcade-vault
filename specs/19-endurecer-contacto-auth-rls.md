# 19 — Endurecer contacto, contraseñas y función RLS

**Estado:** Aprobado
**Depende de:** SPEC 02-about-contact-email, SPEC 04-supabase-auth
**Fecha:** 2026-11-04

**Objetivo:** Cerrar los tres hallazgos de la revisión de seguridad del 2026-11-04: formulario de contacto sin límites, contraseñas débiles (mínimo 6 y sin protección contra filtradas) y la función `public.rls_auto_enable()` ejecutable por `anon` y `authenticated`.

## Por qué existe este spec

La revisión con el plugin Security Guidance no encontró fallos críticos, pero sí tres puntos corregibles con poco código:

- `sendContactMessage` (`app/about/actions.ts`) la puede llamar cualquiera sin sesión, sin tope de tamaño y metiendo el nombre tal cual en el `subject` del correo. Un bot puede inundar la bandeja y gastar la cuota de Resend.
- `signUp` acepta contraseñas de 6 caracteres y Supabase avisa de que la protección contra contraseñas filtradas (HaveIBeenPwned) está desactivada.
- Supabase marca (`get_advisors`, lints 0028 y 0029) que `public.rls_auto_enable()` es `SECURITY DEFINER` y se puede invocar por `/rest/v1/rpc/rls_auto_enable`. Su cuerpo solo activa RLS en tablas nuevas, así que hoy no es explotable, pero no debería ser llamable por RPC. La función no está en `supabase/migrations/` (la creó Supabase en el proyecto remoto).

## Alcance

**Incluye:**

- `app/about/actions.ts`:
  - Límites de longitud tras el `trim()`: nombre ≤ 100, correo ≤ 254, mensaje ≤ 2000 caracteres. Si se superan, `{ ok: false, error }` con mensaje en español.
  - Sanear el nombre antes de usarlo en el `subject` y en el cuerpo: sustituir `\r` y `\n` por un espacio.
  - Honeypot: `ContactPayload` gana el campo opcional `website?: string`. Si llega con contenido, la acción devuelve `{ ok: true }` sin enviar correo (el bot cree que funcionó).
- `components/about/About.tsx`: campo honeypot oculto en el formulario, `maxLength` en los tres campos reales (mismos valores que el servidor) y envío de `website` en el payload.
- `app/styles/about.css`: regla `.hp-field` que saca el campo de la vista sin `display: none`.
- `app/auth/actions.ts`: `MIN_PASSWORD` pasa de 6 a 8 y `ERR.weakPassword` pasa a decir "al menos 8 caracteres". `signIn` no cambia.
- `components/auth/Auth.tsx`: texto de ayuda bajo el campo de contraseña solo en la pestaña de registro ("Mínimo 8 caracteres").
- Migración `supabase/migrations/20261104120000_revoke_rls_auto_enable.sql`: `revoke execute on function public.rls_auto_enable() from public, anon, authenticated;`, aplicada al proyecto remoto con la Supabase MCP.
- Configuración manual en el dashboard de Supabase (Authentication → Sign In / Providers → Email, y Password security): longitud mínima 8 y "Prevent use of leaked passwords" activado. Queda documentada como paso del plan y como criterio de aceptación.
- Actualizar `specs/README.md` (fila 19, siguiente número libre 20) y la línea de specs de `CLAUDE.md`.

**No incluye:**

- Rate limit real por IP o por usuario en el contacto (tabla en Supabase, Upstash, contador en memoria). Se decidió honeypot + límites de longitud; un spec futuro puede añadir tabla `contact_attempts`.
- Límite de frecuencia o topes por juego en `saveScore` (hallazgo de severidad baja). Va en su propio spec de anti-trampas.
- Exigir letras y números en la contraseña ni cambiar `signIn`: los usuarios existentes con contraseña de 6–7 caracteres siguen pudiendo entrar.
- Resolver la enumeración de usuarios/correos en `signUp` (aceptado por UX).
- CAPTCHA (Turnstile, hCaptcha) en el contacto o en el registro.
- Recuperar contraseña, confirmación de correo u OAuth (specs 17 y 18).

## Modelo de datos

No introduce tablas ni columnas. Cambios de contrato y constantes:

```ts
// app/about/actions.ts
export type ContactPayload = {
  name: string;
  email: string;
  message: string;
  website?: string; // honeypot: siempre vacío en un envío humano
};

const LIMITS = { name: 100, email: 254, message: 2000 } as const;
```

```ts
// app/auth/actions.ts
const MIN_PASSWORD = 8; // antes 6
```

Convenciones:

- El honeypot se llama `website` (nombre atractivo para un bot). El input usa `tabIndex={-1}`, `autoComplete="off"` y `aria-hidden`, sin `label` visible.
- Los límites del servidor son la fuente de verdad; los `maxLength` del cliente solo evitan frustración.

## Archivos

```
app/about/actions.ts                                   límites, saneo del nombre, honeypot
components/about/About.tsx                             campo honeypot, maxLength, envía website
app/styles/about.css                                   .hp-field
app/auth/actions.ts                                    MIN_PASSWORD = 8 y mensaje
components/auth/Auth.tsx                               ayuda "Mínimo 8 caracteres" en registro
supabase/migrations/20261104120000_revoke_rls_auto_enable.sql
specs/README.md, CLAUDE.md                             fila del spec y siguiente número
specs/19-endurecer-contacto-auth-rls.md                este spec
```

## Plan de implementación

1. Leer en `node_modules/next/dist/docs/` lo relativo a Server Actions (validación de entrada) de Next 16.3.3.
2. Migración `20261104120000_revoke_rls_auto_enable.sql` y aplicarla con la Supabase MCP. Prueba: `get_advisors` (security) ya no lista los lints 0028 ni 0029; `select has_function_privilege('anon', 'public.rls_auto_enable()', 'execute')` devuelve `false`.
3. `app/about/actions.ts`: constante `LIMITS`, comprobación de longitud, saneo de saltos de línea en `name` y honeypot `website`. Prueba: llamar a la acción con un mensaje de 2001 caracteres devuelve `ok: false`; con `website` relleno devuelve `ok: true` y no llega correo.
4. `components/about/About.tsx` y `app/styles/about.css`: campo honeypot, `maxLength` y `website` en el payload. Prueba: el formulario se ve igual que antes, un envío normal llega al correo, el campo no aparece en pantalla ni en el orden de tabulación.
5. `app/auth/actions.ts` y `components/auth/Auth.tsx`: mínimo 8, mensaje nuevo y texto de ayuda solo en registro. Prueba: registrar con 7 caracteres muestra el error; iniciar sesión con una cuenta de 6 caracteres sigue funcionando.
6. Configurar en el dashboard de Supabase la longitud mínima 8 y "Prevent use of leaked passwords". Prueba: `get_advisors` ya no lista `auth_leaked_password_protection`.
7. Actualizar `specs/README.md` y `CLAUDE.md`. Ejecutar `npm run check` y `npm run build`.

## Criterios de aceptación

- [x] `sendContactMessage` devuelve `{ ok: false }` si el nombre supera 100, el correo 254 o el mensaje 2000 caracteres.
- [x] Un nombre con `\r` o `\n` produce un `subject` de una sola línea.
- [x] Una llamada a `sendContactMessage` con `website` no vacío devuelve `{ ok: true }` y no invoca a Resend.
- [x] Un envío normal desde `/about` (sin `website`) sigue llegando a la bandeja de contacto.
- [x] El campo `website` no es visible, no recibe foco con Tab y no lo anuncia un lector de pantalla.
- [x] Los inputs de nombre, correo y mensaje de `/about` tienen `maxLength` igual a los límites del servidor.
- [x] `signUp` rechaza contraseñas de menos de 8 caracteres con el mensaje "La contraseña debe tener al menos 8 caracteres".
- [ ] `signIn` con una cuenta existente de 6 o 7 caracteres sigue funcionando.
- [x] La pestaña de registro de `/auth` muestra "Mínimo 8 caracteres" y la de inicio de sesión no.
- [x] `has_function_privilege` de `anon` y `authenticated` sobre `public.rls_auto_enable()` es `false`.
- [x] Crear una tabla nueva en `public` sigue activando RLS automáticamente (el event trigger no se rompe).
- [ ] `get_advisors` (security) no devuelve los lints `anon_security_definer_function_executable`, `authenticated_security_definer_function_executable` ni `auth_leaked_password_protection`.
- [x] `npm run check` y `npm run build` sin errores.

## Decisiones tomadas y descartadas

- **Sí:** honeypot + límites de longitud para el contacto. No añade infraestructura y frena el spam automático básico. _Descartado:_ tabla de intentos en Supabase (esquema, RLS y limpieza para un formulario de bajo tráfico), contador en memoria (se reinicia en cada cold start y no se comparte entre instancias serverless) y Upstash (dependencia y cuenta externa nuevas).
- **Sí:** el honeypot responde `ok: true` sin enviar. Un error le diría al bot que fue detectado. _Descartado:_ devolver un error explícito.
- **Sí:** fuera de pantalla con `.hp-field` en lugar de `display: none`. Algunos bots ignoran los campos con `display: none`.
- **Sí:** mínimo de 8 caracteres solo para registros nuevos. No obliga a nadie a cambiar su contraseña. _Descartado:_ exigir letras y números (fricción alta para un portal de arcade) y dejar el mínimo en 6.
- **Sí:** el mínimo se configura en dos sitios, `MIN_PASSWORD` en el código (mensaje claro al usuario) y el dashboard de Supabase (el servidor es la garantía final).
- **Sí:** `revoke execute` en lugar de borrar `rls_auto_enable()`. La función es un event trigger de Supabase que protege las tablas nuevas; se quita el acceso por RPC, no la función.
- **No:** `saveScore` en este spec. El anti-trampas necesita su propio diseño (topes por juego, frecuencia) y no comparte archivos con estos cambios.
- **No:** automatizar los ajustes de Auth con la Management API. Requiere un token que el proyecto no tiene; se documenta como paso manual con criterio verificable por `get_advisors`.

## Riesgos identificados

| Riesgo                                                                                               | Mitigación                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El gestor de contraseñas o el autocompletado del navegador rellena `website` y bloquea a un humano   | `autoComplete="off"`, `tabIndex={-1}`, nombre `website`; probar en Chrome y Firefox. Un humano afectado ve éxito falso, por lo que se verifica a mano. |
| "Prevent use of leaked passwords" puede no estar disponible en el plan actual de Supabase            | Comprobarlo en el paso 6. Si no está disponible, dejar el aviso documentado y quitar ese criterio de aceptación; el resto del spec se mantiene.        |
| `revoke` falla por no ser el propietario de la función o rompe el event trigger                      | Aplicar primero con la MCP y verificar creando y borrando una tabla de prueba en `public`; si falla, revertir con `grant` y revisar el propietario.    |
| Subir el mínimo a 8 deja a los usuarios existentes con contraseñas más débiles                       | Aceptado: la política solo aplica a registros nuevos. Un spec futuro puede forzar cambio de contraseña.                                                |
| El honeypot y los límites no frenan a un humano o bot que respeta las reglas y envía muchos mensajes | Riesgo aceptado y registrado; la tabla de intentos queda como siguiente paso si aparece abuso.                                                         |

## Qué **no** está en este spec

- Rate limit por IP o por usuario del contacto.
- Límites o anti-trampas en `saveScore`.
- Requisitos de composición de contraseña, forzar cambio de contraseña a usuarios existentes o cambios en `signIn`.
- CAPTCHA.
- Recuperar contraseña, confirmación de correo y OAuth.
- Cualquier cambio de esquema distinto del `revoke` de `rls_auto_enable()`.
