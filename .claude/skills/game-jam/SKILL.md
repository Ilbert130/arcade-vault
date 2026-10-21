---
name: game-jam
description: Organiza una game jam de Arcade Vault a partir de un tema. Lanza tres agentes game-jam-designer en paralelo (ángulos acción, puzzle y wildcard) que proponen tres juegos distintos con spec completo, juzga las propuestas con una rúbrica, elige un ganador y lo copia a specs/NN-<id>.md listo para /add-game. Úsalo cuando el usuario diga "game jam", "/game-jam <tema>", "propón juegos sobre <tema>" o "dame 3 ideas de juego sobre…".
argument-hint: <tema, p. ej. "juego sobre café">
---

# game-jam — tres diseñadores, un ganador

Este skill corre en la sesión principal porque un subagente no puede lanzar otros subagentes. Tú eres el **organizador y juez**: preparas la jam, lanzas a los tres diseñadores a la vez y eliges. No implementas el juego ni haces commit.

Responde en el idioma del usuario; todo lo que se escribe en archivos va en español.

## 1. Preparar

1. **Tema**: el argumento del skill. Si falta, pregúntalo y para.
2. `tema-slug`: kebab-case corto sin acentos ni palabras vacías ("juego sobre café" → `cafe`).
3. `fecha`: hoy (YYYY-MM-DD). Carpeta de la jam: `game-jam/<fecha>-<tema-slug>/` (si ya existe, añade `-2`, `-3`…). Créala.
4. `NN`: siguiente número libre en `specs/` (`ls specs/`, dos dígitos).
5. `ids ocupados`: todos los ids de `supabase/migrations/*games_scores.sql` + los de la tabla de `.claude/agent-memory/game-planner/MEMORY.md`.
6. Lee `references/angulos.md` (en este skill) para pasar cada brief.

## 2. Lanzar a los tres diseñadores en paralelo

En **un único mensaje**, tres llamadas a la herramienta Agent con `subagent_type: "game-jam-designer"` (descripción "Game jam propuesta A/B/C"). Cada prompt incluye: tema, ángulo con su brief completo copiado de `angulos.md`, `salida` (`game-jam/<carpeta>/propuesta-a.md`, `-b`, `-c`), `NN`, `ids ocupados`, `fecha`, y la frase: "Otros dos diseñadores cubren los otros ángulos; no los imites."

Espera las tres notificaciones antes de seguir; no inventes resultados.

## 3. Revisar diversidad

Lee las tres propuestas completas. Si dos comparten mecánica núcleo o `id`, o alguna no se escribió, relanza **solo esa** (con SendMessage al mismo agente o una nueva llamada) indicando qué debe cambiar. Máximo un reintento por propuesta; si sigue fallando, júzgala tal cual.

## 4. Juzgar

Aplica `references/rubrica.md`. Verifica cada spec contra `.claude/skills/add-game/assets/spec-template.md` y `.claude/skills/add-game/references/engine-contract.md`; aplica los vetos. Escribe `game-jam/<carpeta>/veredicto.md` a partir de `assets/veredicto-template.md`, sin dejar placeholders.

## 5. Publicar el ganador

1. Copia la parte del ganador que va después de `<!-- SPEC -->` a `specs/NN-<id>.md`. Asegura `**Estado:** Borrador`, la fecha de hoy y el número `NN` en el título; corrige defectos menores y anótalos en el veredicto.
2. Actualiza `.claude/agent-memory/game-planner/MEMORY.md`: añade las tres ideas al registro con fecha, id, título, cat; el ganador con estado `aceptado` y nota "Ganador game-jam '<tema>' → specs/NN-<id>.md", las otras `propuesto` con nota "game-jam '<tema>' (prop. X)". Respeta el límite de ~200 líneas de esa memoria.

## 6. Resumen al usuario

- Las tres propuestas, una línea cada una (título, cat/color, mecánica).
- El ganador, su puntuación y el porqué en 2–3 líneas.
- Rutas: carpeta de la jam, `veredicto.md`, `specs/NN-<id>.md`.
- Siguiente paso: `/add-game <id>` (o `/spec-impl NN`). Si el usuario prefiere otra propuesta, ofrécete a cambiar el ganador (reescribir el spec y la memoria).
