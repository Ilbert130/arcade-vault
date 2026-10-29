# 17 — Auth: confirmación de correo y recuperación de contraseña

**Estado:** Pausado (implementación en la rama `spec-17-confirmacion-correo-recuperar-password`, sin fusionar; "Confirm email" desactivado en Supabase porque el SMTP de Resend no entrega a terceros sin dominio verificado)
**Depende de:** SPEC 04-supabase-auth
**Fecha:** 2026-10-28

**Objetivo:** Hacer obligatoria la confirmación de correo para las cuentas nuevas y añadir el flujo "¿Olvidaste tu contraseña?" (correo → `/auth/reset` → nueva contraseña), enviando los correos por SMTP propio con Resend.

## Alcance

**Incluye:**

- Configuración manual en el Dashboard de Supabase (documentada en el spec y verificada en la implementación):
  - Authentication → Providers → Email: activar **Confirm email**.
  - Authentication → SMTP Settings: SMTP custom con Resend (`smtp.resend.com`, puerto 465, usuario `resend`, contraseña = `RESEND_API_KEY`, remitente de un dominio verificado en Resend).
  - Authentication → URL Configuration: `Site URL` y `Redirect URLs` con `http://localhost:3000/**` y la URL de producción.
  - Authentication → Email Templates (Confirm signup y Reset password) en español, apuntando a `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<type>&next=<ruta>`.
- Ruta `app/auth/confirm/route.ts` (GET): recibe `token_hash`, `type` (`signup` | `recovery`) y `next`, llama a `supabase.auth.verifyOtp` y redirige:
  - `signup` OK → `/biblioteca` con sesión iniciada.
  - `recovery` OK → `/auth/reset` con sesión de recuperación.
  - Token inválido o caducado → `/auth?error=enlace` (la tarjeta muestra "El enlace no es válido o ha caducado.").
  - `next` solo se acepta si es una ruta interna conocida (`/biblioteca`, `/auth/reset`); cualquier otro valor se ignora.
- Server Actions nuevas en `app/auth/actions.ts`: `requestPasswordReset`, `updatePassword`, `resendConfirmation`. `signUp` pasa a devolver `{ ok: true, needsConfirmation: true }` cuando Supabase no devuelve sesión.
- `components/auth/Auth.tsx`:
  - Tras `signUp` con `needsConfirmation`, la tarjeta cambia a un estado **"REVISA TU CORREO"** (muestra el correo usado, botón "REENVIAR CORREO" con enfriamiento de 60 s y enlace "VOLVER").
  - Tab "Iniciar sesión": enlace **"¿Olvidaste tu contraseña?"** que cambia la tarjeta a un formulario de un solo campo (correo) → estado de éxito neutro ("Si el correo existe, te enviamos un enlace.").
  - Mensaje específico en `signIn` cuando el correo no está confirmado: "Confirma tu correo para entrar." con acceso a "REENVIAR CORREO".
  - Lee `?error=enlace` de la URL y lo muestra como error inicial.
- Página `app/auth/reset/page.tsx` + `components/auth/ResetPassword.tsx`: formulario nueva contraseña + repetir contraseña (≥ 6 caracteres, deben coincidir); solo accesible con sesión de recuperación (sin sesión → redirige a `/auth`); éxito → `/biblioteca`. Mismo estilo visual de `.auth-card` (clases en `app/styles/auth.css`).
- Ajuste en `proxy.ts` (raíz): el guard "con sesión en `/auth` → `/biblioteca`" sigue aplicando solo a `pathname === "/auth"`; `/auth/confirm` y `/auth/reset` quedan excluidos explícitamente (con sesión de recuperación debe poder abrirse `/auth/reset`).
- Actualizar `CLAUDE.md` (sección Routes: `/auth/confirm`, `/auth/reset`) y `.env.example` si se añade alguna variable.

**No incluye (fuera de alcance de este spec):**

- OAuth Google/GitHub y pantalla de elección de username → spec 18 (los botones siguen decorativos).
- Cambio de correo, cambio de contraseña desde el Nav estando logueado, edición de perfil, borrado de cuenta.
- Doble factor (MFA), magic link, login anónimo.
- Confirmar retroactivamente cuentas existentes: las creadas con "Confirm email" desactivado ya tienen `email_confirmed_at` y no se tocan.
- Plantillas HTML elaboradas de correo (solo texto/HTML mínimo en español).
- Migraciones de base de datos: no se cambia el esquema.

## Modelo de datos

Sin cambios de esquema (no hay migración ni regeneración de `database.types.ts`). Solo cambian los tipos de las Server Actions:

```ts
// app/auth/actions.ts
export type AuthResult =
  | { ok: true; needsConfirmation?: boolean }
  | { ok: false; error: string; code?: "email_not_confirmed" };

export async function signUp(input: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResult>; // ok + needsConfirmation: true si no hay sesión
export async function resendConfirmation(email: string): Promise<AuthResult>;
export async function requestPasswordReset(email: string): Promise<AuthResult>; // siempre ok si el correo es válido (no revela existencia)
export async function updatePassword(input: {
  password: string;
  confirm: string;
}): Promise<AuthResult>;
```

```ts
// components/auth/Auth.tsx
type View = "in" | "up" | "check-email" | "forgot" | "forgot-sent";
```

Mensajes nuevos (español): "Confirma tu correo para entrar.", "El enlace no es válido o ha caducado.", "Las contraseñas no coinciden.", "Si el correo existe, te enviamos un enlace.", "Espera unos segundos antes de reenviar.".

## Plan de implementación

1. **Documentación.** Leer en `node_modules/next/dist/docs/` la guía de route handlers (`route.ts`), `redirect` y `proxy.ts`; y `search_docs` del MCP de Supabase para `verifyOtp`, `resetPasswordForEmail` y SMTP custom.
2. **Configuración manual.** Configurar Resend como SMTP, URL Configuration y plantillas de correo (ver Alcance); **no** activar todavía "Confirm email" hasta el paso 7.
3. **Route handler.** Crear `app/auth/confirm/route.ts` con `verifyOtp({ type, token_hash })`, validación de `next` por lista blanca y redirecciones descritas.
4. **Server Actions.** Añadir `resendConfirmation` (`supabase.auth.resend({ type: "signup", email })`), `requestPasswordReset` (`resetPasswordForEmail` con `redirectTo` al flujo de `/auth/confirm?type=recovery&next=/auth/reset`) y `updatePassword` (`updateUser({ password })` exigiendo sesión). Ajustar `signUp` para detectar `data.session === null` y `signIn` para mapear `email_not_confirmed`. Añadir los códigos de error nuevos a `mapAuthError`.
5. **Auth.tsx.** Introducir `View`, el estado "revisa tu correo" con reenvío y enfriamiento de 60 s (temporizador con cleanup), el formulario "olvidé mi contraseña" y la lectura de `?error=enlace` (con `useSearchParams` envuelto en `Suspense` en `app/auth/page.tsx`).
6. **Reset.** Crear `app/auth/reset/page.tsx` (Server Component: sin sesión → `redirect("/auth")`) y `components/auth/ResetPassword.tsx`; estilos en `app/styles/auth.css` diseñados con `/frontend-design`, reutilizando `.auth-card`, `.field`, `.auth-error`.
7. **Proxy y activación.** Verificar que `proxy.ts` no redirige `/auth/confirm` ni `/auth/reset`; activar **Confirm email** en el dashboard.
8. **Verificación manual** (`npm run dev`, correos reales vía Resend):
   - Registrar `nuevo@…` → tarjeta "REVISA TU CORREO"; no hay sesión; en `auth.users` `email_confirmed_at` es `null`.
   - Intentar entrar antes de confirmar → "Confirma tu correo para entrar." + reenviar.
   - "REENVIAR CORREO" deshabilitado 60 s y luego envía otro; abrir el enlace → `/biblioteca` con sesión y `email_confirmed_at` no nulo.
   - Abrir el enlace de confirmación dos veces → la segunda vez `/auth` con "El enlace no es válido o ha caducado."
   - "¿Olvidaste tu contraseña?" con correo existente e inexistente → mismo mensaje neutro; solo el existente recibe correo.
   - Enlace de recuperación → `/auth/reset`; contraseñas distintas → error; válida → `/biblioteca` y se puede entrar con la nueva y no con la vieja.
   - `/auth/reset` sin sesión → redirige a `/auth`. Con sesión normal también muestra el formulario sin romper nada.
   - Cuenta anterior al spec (ya confirmada) sigue entrando sin cambios.
   - `get_advisors` (security) sin avisos nuevos; `npm run check` y `npm run build` sin errores.

## Criterios de aceptación

- [ ] "Confirm email" está activo y los correos salen por SMTP de Resend (recibidos en una bandeja real).
- [ ] Registrarse no inicia sesión; la tarjeta muestra "REVISA TU CORREO" con el correo usado.
- [ ] Entrar con una cuenta sin confirmar muestra "Confirma tu correo para entrar." y permite reenviar.
- [ ] "REENVIAR CORREO" queda deshabilitado 60 s tras cada envío.
- [ ] El enlace de confirmación válido deja al usuario en `/biblioteca` con sesión; uno usado o caducado lleva a `/auth` con "El enlace no es válido o ha caducado."
- [ ] `/auth/confirm` ignora cualquier `next` fuera de la lista blanca (no hay redirección abierta).
- [ ] "¿Olvidaste tu contraseña?" responde igual para correos existentes e inexistentes y solo envía correo al existente.
- [ ] El enlace de recuperación abre `/auth/reset`; con contraseñas distintas o < 6 caracteres se muestra el error en español sin perder lo escrito.
- [ ] Tras cambiar la contraseña el usuario queda en `/biblioteca` y solo la nueva funciona para iniciar sesión.
- [ ] `/auth/reset` sin sesión redirige a `/auth`.
- [ ] Las cuentas creadas antes de este spec siguen iniciando sesión sin pasos extra.
- [ ] Los botones Google/GitHub siguen decorativos y no hay cambios de esquema en la BD.
- [ ] `npm run check` y `npm run build` completan sin errores y la consola no muestra errores en `/auth` ni `/auth/reset`.

## Decisiones tomadas y descartadas

- **Un spec para correo, OAuth aparte.** Confirmación y recuperación comparten ruta `/auth/confirm`, SMTP y plantillas. _Descartado:_ tres specs separados (excesivo) y todo junto (OAuth añade apps externas y pantalla de username).
- **Confirmación obligatoria solo para cuentas nuevas.** Las existentes ya tienen `email_confirmed_at`. _Descartado:_ confirmación opcional con aviso (más lógica, menos garantía).
- **SMTP custom con Resend.** El SMTP por defecto de Supabase limita envíos y destinatarios. _Descartado:_ dejar el por defecto (solo válido para dev).
- **Flujo `token_hash` + `verifyOtp` en `/auth/confirm`** (patrón SSR de Supabase), no el redirect implícito con hash en la URL, porque funciona con cookies del servidor y `proxy.ts`.
- **Respuesta neutra en recuperación.** No revela si un correo está registrado. _Descartado:_ mensajes distintos (permite enumerar usuarios).
- **Reenvío con enfriamiento de 60 s en el cliente** y rate limit de Supabase como garantía real.
- **Lista blanca para `next`** en lugar de aceptar cualquier ruta, para evitar open redirect.
- **Sin migración.** El esquema de `profiles` no cambia; el trigger `handle_new_user` sigue creando el perfil al insertarse el usuario (aunque no esté confirmado), por lo que el `username` queda reservado desde el registro.
- **Rediseño visual mínimo:** se extiende la tarjeta `/auth` existente en lugar de rehacerla desde cero.

## Riesgos identificados

- **Enumeración vía `signUp` con "Confirm email" activo.** Supabase devuelve un usuario "ofuscado" sin error si el correo ya existe; el usuario verá "REVISA TU CORREO" sin recibir nada. Se asume aceptable (evita enumerar correos) y el reenvío no hará nada para ese caso.
- **Username reservado por cuentas sin confirmar.** Un registro abandonado bloquea el `username`. Limpieza de cuentas sin confirmar queda para un spec futuro.
- **Dominio y DNS de Resend.** Sin dominio verificado, Resend solo envía a la dirección del propietario; bloquea la verificación con correos de terceros.
- **Límites de Auth** (rate limit de correos por hora) pueden aparecer en pruebas repetidas y se muestran como error genérico "No se pudo conectar. Inténtalo de nuevo."
- **Prefetch y guard.** Enlaces a `/auth/*` con sesión pueden ser redirigidos por `proxy.ts` y dar 404 en consola (ver `prefetch={false}` en spec 04); los nuevos enlaces deben usar `prefetch={false}`.
- **Plantillas de correo fuera del repo.** Viven en el dashboard; se documentan en el spec para poder reproducirlas, pero un cambio manual puede romper el enlace (`token_hash`/`type`).
- **Next.js 16.** `route.ts`, `redirect` y `cookies()` asíncrono deben verificarse contra `node_modules/next/dist/docs/` antes de escribir código.
