# Specs

Specs de Spec Driven Design (`/spec`, `/spec-impl`, `/spec-impl-game`). Cada spec se implementa en su rama `spec-NN-slug` (`.spec-config.yml`). El siguiente número libre es **19**.

| NN  | Spec                                                                                      | Tema                                                              | Estado       |
| --- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------ |
| 01  | [01-mvp-pantallas-visuales](01-mvp-pantallas-visuales.md)                                 | Pantallas visuales del MVP                                        | Implementado |
| 01  | [01-home-landing-nav](01-home-landing-nav.md)                                             | Home (landing) y Nav                                              | Implementado |
| 02  | [02-about-contact-email](02-about-contact-email.md)                                       | About y correo de contacto (Resend)                               | Implementado |
| 03  | [03-biblioteca-salon-auth](03-biblioteca-salon-auth.md)                                   | Biblioteca, Salón de la Fama y Auth                               | Implementado |
| 04  | [04-supabase-auth](04-supabase-auth.md)                                                   | Infraestructura Supabase y autenticación                          | Implementado |
| 05  | [05-asteroides-rocas](05-asteroides-rocas.md)                                             | ROCAS (Asteroids)                                                 | Implementado |
| 06  | [06-leaderboard-tabla-juegos](06-leaderboard-tabla-juegos.md)                             | Leaderboard y catálogo en Supabase                                | Implementado |
| 07  | [07-tetris-caida](07-tetris-caida.md)                                                     | CAÍDA (Tetris)                                                    | Implementado |
| 08  | [08-arkanoid-bloque-buster](08-arkanoid-bloque-buster.md)                                 | BLOQUE BUSTER (Arkanoid)                                          | Implementado |
| 09  | [09-ocultar-juegos-no-implementados](09-ocultar-juegos-no-implementados.md)               | Ocultar juegos no jugables                                        | Implementado |
| 10  | [10-snake-serpentina](10-snake-serpentina.md)                                             | SERPENTINA (Snake)                                                | Implementado |
| 11  | [11-invasores](11-invasores.md)                                                           | INVASORES (shooter de formaciones)                                | Borrador     |
| 12  | [12-controles-tactiles-movil](12-controles-tactiles-movil.md)                             | Controles táctiles en móvil                                       | Implementado |
| 13  | [13-gamepad-mk2](13-gamepad-mk2.md)                                                       | Mando táctil Gamepad MK-II                                        | Implementado |
| 14  | [14-performance-efectos-crt](14-performance-efectos-crt.md)                               | Rendimiento de los efectos de página                              | Implementado |
| 15  | [15-ranaria-frogger](15-ranaria-frogger.md)                                               | RANARIA (Frogger), de la game jam                                 | Implementado |
| 16  | [16-anzuelo](16-anzuelo.md)                                                               | ANZUELO, ganador de la jam "fondo del mar"                        | Borrador     |
| 17  | [17-confirmacion-correo-recuperar-password](17-confirmacion-correo-recuperar-password.md) | Confirmación de correo y recuperar contraseña (rama sin fusionar) | Pausado      |
| 18  | [18-oauth-google-github](18-oauth-google-github.md)                                       | Inicio de sesión con Google y GitHub                              | Borrador     |

Notas:

- Hay dos specs 01 por historia del proyecto (ambos implementados); se mantienen para no romper las ramas `spec-01-*`.
- 15 y 16 se renumeraron en la reorganización (antes `game-jam/frogger/01-frogger-core.md` y `13-anzuelo.md`) para que cada número sea único.
- Los specs 12–15 siguen marcando `Aprobado` en su cabecera aunque ya están en `main`; esta tabla es la fuente del estado.
- Las propuestas de las game jams están en [`docs/game-jam/`](../docs/game-jam/README.md).
