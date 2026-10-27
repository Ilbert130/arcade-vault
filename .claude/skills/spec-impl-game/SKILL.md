---
name: spec-impl-game
description: Implementa un spec aprobado de un juego de Arcade Vault siguiendo exactamente el flujo de /spec-impl y, al terminar la implementación, lanza en secuencia (nunca en paralelo) el subagente skin-designer y después mobile-porter. Úsalo con /spec-impl-game <NN-spec> cuando el spec añada o porte un juego.
disable-model-invocation: true
argument-hint: <NN-spec-name>
allowed-tools: Read, Glob, Grep, Edit, Write, Agent, AskUserQuestion, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git log:*), Bash(git diff:*), Bash(git stash:*), Bash(cat:*), Bash(ls:*)
---

# /spec-impl-game — spec-impl + skins + móvil

Igual que `/spec-impl`, pero pensado para specs de juegos: al terminar la implementación encadena `skin-designer` y luego `mobile-porter`.

El argumento recibido es: `$ARGUMENTS`

## Fase A — Implementación (idéntica a /spec-impl)

1. Lee el skill `~/.agents/skills/spec-impl/SKILL.md` (con Read; en Windows `C:\Users\Ilbert\.agents\skills\spec-impl\SKILL.md`). No está disponible vía Skill tool porque es de invocación manual, así que léelo y **ejecuta su flujo completo** con `$ARGUMENTS` como spec: Fase 1 (identificar spec), Fase 2 (validar estado "Aprobado"), Fase 3 (rama `spec-NN-slug`, según `specs/.spec-config.yml`, resumen del spec) y Fase 4 (implementación paso a paso con pausas y confirmación del usuario).
2. No copies ni resumas sus reglas de memoria: si el skill original cambia, esto debe seguirlo. Lo que dice spec-impl manda, incluido **no hacer commits automáticos**.
3. Como el spec es de un juego, apóyate en el skill `add-game` (`.claude/skills/add-game/SKILL.md` y sus `references/`) para el motor TS, el Canvas, el registro, la migración `playable` y el leaderboard. Si el spec contradice a `add-game`, manda el spec (regla de spec-impl).
4. Anota el `id` del juego (slug de `games.id`, el mismo de la carpeta en `lib/games/<id>/`) para la Fase B.

## Puerta de paso

Pasa a la Fase B **solo si** se terminó el último paso del plan y el usuario lo confirmó. Si la Fase A se detuvo por cualquier motivo (spec no aprobado, árbol sucio sin resolver, ambigüedad pendiente, el usuario cancela o pausa), **no lances ningún agente**.

Si el spec no añade ni modifica un juego jugable, avisa y pregunta al usuario si aun así quiere correr los agentes.

## Fase B — Agentes, uno tras otro

Lánzalos **en primer plano y en mensajes distintos**; nunca dos `Agent` en la misma respuesta ni en segundo plano, porque el segundo depende del resultado del primero.

1. **`skin-designer`** (`subagent_type: "skin-designer"`): pídele auditar el juego `<id>` recién implementado (rama activa) y completar los skins que falten (`clasico`, `neon`, `retro`). Dale contexto: spec implementado, archivos tocados, id del juego. Espera su informe completo.
2. Revisa el informe. Si falló o dejó el juego roto (lint/tipos), detente, muéstraselo al usuario y pregunta antes de seguir.
3. **`mobile-porter`** (`subagent_type: "mobile-porter"`): solo cuando el paso 1 haya terminado. Pídele auditar el juego `<id>` (reproductor y mando táctil) y su página en la matriz de viewports. Es de auditoría y corrección de responsive; no debe tocar jugabilidad ni skins. Espera su informe.

## Cierre

Resume brevemente ambos informes (qué cambió cada agente, pendientes). Recuerda:

```
✅ Implementación + skins + móvil completados.

Siguiente paso: verifica los criterios de aceptación del spec uno a uno. Si todos pasan,
cambia el estado del spec a "Implementado" y haz el commit final antes de fusionar la rama.
```

No hagas commit ni cambies el estado del spec por tu cuenta.
