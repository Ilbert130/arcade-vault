"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveScore } from "@/app/juegos/[id]/jugar/actions";
import type { Game } from "@/lib/games/types";
import { getCurrentUsername } from "@/lib/supabase/client";
import { GAME_REGISTRY } from "@/components/games/registry";
import type { GameStatus, GenericHud } from "@/components/games/registry";
import TouchPad from "@/components/games/TouchPad";
import type { GameInput } from "@/lib/games/touch";
import {
  DEFAULT_SKIN,
  SKIN_IDS,
  SKIN_LABELS,
  isSkinId,
} from "@/lib/games/skins";
import type { SkinId } from "@/lib/games/skins";
const START_LIVES = 3;
// Formato de cada valor del HUD (se escribe directo en el DOM, sin pasar por React).
const fmtScore = (n: number) => n.toLocaleString("es-ES");
const fmtLives = (n: number) => "♥ ".repeat(n).trim() || "—";
const fmtLevel = (n: number) => String(n).padStart(2, "0");
// Tras pulsar un botón se le quita el foco para que Espacio no vuelva a activarlo.
const blurTarget = (e: MouseEvent<HTMLButtonElement>) => e.currentTarget.blur();
const togglePause = (s: GameStatus): GameStatus =>
  s === "playing" ? "paused" : s === "paused" ? "playing" : s;
// ── Skin por juego (solo cosmética), recordada en localStorage ──────────────
const SKIN_EVENT = "av-skin-change";
const skinKey = (gameId: string) => `av-skin:${gameId}`;
// Respaldo en memoria si localStorage no está disponible (modo privado, cuota…).
const memorySkins: Record<string, SkinId> = {};
function readSkin(gameId: string): SkinId {
  const mem = memorySkins[gameId];
  if (mem) return mem;
  try {
    const stored = window.localStorage.getItem(skinKey(gameId));
    return isSkinId(stored) ? stored : DEFAULT_SKIN;
  } catch {
    return DEFAULT_SKIN;
  }
}
function writeSkin(gameId: string, skin: SkinId) {
  memorySkins[gameId] = skin;
  try {
    window.localStorage.setItem(skinKey(gameId), skin);
  } catch {
    // Sin persistencia: la elección dura lo que la pestaña.
  }
  window.dispatchEvent(new Event(SKIN_EVENT));
}
function subscribeSkin(onChange: () => void) {
  // Otra pestaña cambió la skin: manda localStorage, no la copia en memoria.
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith("av-skin:"))
      delete memorySkins[e.key.slice("av-skin:".length)];
    onChange();
  };
  window.addEventListener(SKIN_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SKIN_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
function SkinSwitch({
  value,
  onChange,
}: {
  value: SkinId;
  onChange: (skin: SkinId) => void;
}) {
  return (
    <div className="skin-switch">
      <span className="skin-switch-label" id="skin-switch-label">
        ASPECTO
      </span>
      <div
        className="skin-switch-group"
        role="group"
        aria-labelledby="skin-switch-label"
      >
        {SKIN_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={`skin-opt skin-${id}${value === id ? " on" : ""}`}
            aria-pressed={value === id}
            // Sin foco al pulsar con el ratón: el teclado sigue en el juego.
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              blurTarget(e);
              onChange(id);
            }}
          >
            <span className="skin-led" aria-hidden="true" />
            {SKIN_LABELS[id]}
          </button>
        ))}
      </div>
    </div>
  );
}
type SaveState =
  { status: "idle" | "saving" | "saved" } | { status: "error"; error: string };
export default function GamePlayer({ game }: { game: Game }) {
  const router = useRouter();
  const entry = GAME_REGISTRY[game.id];
  const isReal = !!entry;
  const hudFields = entry?.hud ?? ["score", "lives", "level"];
  // En el servidor (y en la hidratación) siempre CLÁSICO; luego, la guardada.
  const skin = useSyncExternalStore(
    subscribeSkin,
    () => readSkin(game.id),
    () => DEFAULT_SKIN,
  );
  const changeSkin = (next: SkinId) => writeSkin(game.id, next);
  // El HUD cambia con cada jugada: vive en refs y se escribe en el DOM (sin re-renders).
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const scoreEl = useRef<HTMLDivElement>(null);
  const livesEl = useRef<HTMLDivElement>(null);
  const linesEl = useRef<HTMLDivElement>(null);
  const levelEl = useRef<HTMLDivElement>(null);
  const paintHud = useCallback((hud: Partial<GenericHud>) => {
    const put = (el: HTMLDivElement | null, text: string) => {
      if (el && el.textContent !== text) el.textContent = text;
    };
    if (hud.score !== undefined) {
      scoreRef.current = hud.score;
      put(scoreEl.current, fmtScore(hud.score));
    }
    if (hud.lives !== undefined) put(livesEl.current, fmtLives(hud.lives));
    if (hud.level !== undefined) {
      levelRef.current = hud.level;
      put(levelEl.current, fmtLevel(hud.level));
    }
    if (hud.lines !== undefined) put(linesEl.current, fmtScore(hud.lines));
  }, []);
  // Los juegos reales esperan en "ready" a que el jugador empiece; la simulación arranca jugando.
  const [status, setStatus] = useState<GameStatus>(
    isReal ? "ready" : "playing",
  );
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  // Modo reproductor: apaga los efectos globales pesados de la página (ver globals.css).
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.player = "";
    return () => {
      delete root.dataset.player;
    };
  }, []);
  // Motor del juego real (lo asigna su Canvas); el mando táctil le envía las acciones.
  const inputRef = useRef<GameInput | null>(null);
  // Al pausar, terminar o volver a "ready" no queda ninguna acción mantenida.
  useEffect(() => {
    if (status !== "playing") inputRef.current?.releaseAll();
  }, [status]);
  const paused = status === "paused";
  const over = status === "over";
  // null (invitado) en el primer render; el efecto lo sustituye por el username si hay sesión.
  const [username, setUsername] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>({ status: "idle" });
  useEffect(() => {
    let active = true;
    getCurrentUsername().then((name) => {
      if (active && name) setUsername(name);
    });
    return () => {
      active = false;
    };
  }, []);
  // Puntuación simulada: solo para los juegos que aún no tienen motor real.
  useEffect(() => {
    if (isReal || status !== "playing") return;
    const t = setInterval(() => {
      // Subir de nivel en el mismo tick que actualiza la puntuación (sin efecto aparte).
      const next = scoreRef.current + Math.floor(10 + Math.random() * 90);
      paintHud({
        score: next,
        level: next % 2500 < 100 ? levelRef.current + 1 : undefined,
      });
    }, 220);
    return () => clearInterval(t);
  }, [isReal, status, paintHud]);
  // Juegos reales: Espacio empieza, P / Escape alternan pausa; ocultar la pestaña o perder el foco pausa.
  useEffect(() => {
    if (!isReal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && statusRef.current === "ready") {
        e.preventDefault();
        setStatus("playing");
      } else if (e.code === "KeyP" || e.code === "Escape") {
        setStatus(togglePause);
      }
    };
    const autoPause = () => {
      inputRef.current?.releaseAll();
      setStatus((s) => (s === "playing" ? "paused" : s));
    };
    const onVisibility = () => {
      if (document.hidden) autoPause();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", autoPause);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", autoPause);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isReal]);
  // Identidad estable: los Canvas no re-ejecutan efectos ni se re-renderizan por ellos.
  const handleHud = useCallback((hud: GenericHud) => paintHud(hud), [paintHud]);
  const handleGameOver = useCallback(
    (finalScore: number) => {
      paintHud({ score: finalScore });
      setStatus("over");
    },
    [paintHud, setStatus],
  );
  const endGame = () => setStatus("over");
  const restart = () => {
    paintHud({ score: 0, lives: START_LIVES, level: 1, lines: 0 });
    setStatus(isReal ? "ready" : "playing");
    setSave({ status: "idle" });
  };
  const submitScore = async () => {
    setSave({ status: "saving" });
    try {
      const result = await saveScore({
        gameId: game.id,
        score: scoreRef.current,
      });
      setSave(
        result.ok
          ? { status: "saved" }
          : { status: "error", error: result.error },
      );
    } catch {
      setSave({
        status: "error",
        error: "No se pudo guardar. Inténtalo de nuevo.",
      });
    }
  };
  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {username ?? "INVITADO"}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v" ref={scoreEl}>
              {fmtScore(0)}
            </div>
          </div>
          {hudFields.includes("lives") && (
            <div className="hud-stat lives">
              <div className="l">Vidas</div>
              <div className="v" ref={livesEl}>
                {fmtLives(START_LIVES)}
              </div>
            </div>
          )}
          {hudFields.includes("lines") && (
            <div className="hud-stat lines">
              <div className="l">Líneas</div>
              <div className="v" ref={linesEl}>
                {fmtScore(0)}
              </div>
            </div>
          )}
          {hudFields.includes("level") && (
            <div className="hud-stat level">
              <div className="l">Nivel</div>
              <div className="v" ref={levelEl}>
                {fmtLevel(1)}
              </div>
            </div>
          )}
        </div>
        <div className="hud-actions">
          {/* En móvil estrecho solo se ve el icono; el nombre sigue en aria-label. */}
          <button
            className="btn yellow"
            aria-label={paused ? "Reanudar" : "Pausa"}
            onClick={(e) => {
              blurTarget(e);
              setStatus(togglePause);
            }}
          >
            <span className="hud-btn-icon" aria-hidden="true">
              {paused ? "▶" : "II"}
            </span>
            <span className="hud-btn-text">
              {paused ? "REANUDAR" : "PAUSA"}
            </span>
          </button>
          <button
            className="btn magenta"
            aria-label="Fin"
            onClick={(e) => {
              blurTarget(e);
              endGame();
            }}
          >
            <span className="hud-btn-icon" aria-hidden="true">
              ■
            </span>
            <span className="hud-btn-text">FIN</span>
          </button>
          <button
            className="btn ghost"
            aria-label="Salir"
            onClick={() => router.push(`/juegos/${game.id}`)}
          >
            <span className="hud-btn-icon" aria-hidden="true">
              ✕
            </span>
            <span className="hud-btn-text">SALIR</span>
          </button>
        </div>
      </div>
      {entry && <SkinSwitch value={skin} onChange={changeSkin} />}
      <div className="player-stage">
        <div className="crt">
          <div className="crt-screen">
            {entry ? (
              <entry.Canvas
                status={status}
                skin={skin}
                onHud={handleHud}
                onGameOver={handleGameOver}
                inputRef={inputRef}
              />
            ) : (
              <div className="game-arena">
                <div className="grid-floor"></div>
                <div className="enemy e1"></div>
                <div className="enemy e2"></div>
                <div className="enemy e3"></div>
                <div className="player-ship"></div>
              </div>
            )}
            {entry && status === "ready" && (
              <div className="crt-content game-start">
                <div className="game-start-inner">
                  <div className="game-start-title pixel">
                    {entry.startTitle}
                  </div>
                  <div className="game-start-prompt pixel">
                    {entry.startHint}
                  </div>
                  <button
                    className="btn"
                    onClick={(e) => {
                      blurTarget(e);
                      setStatus("playing");
                    }}
                  >
                    EMPEZAR
                  </button>
                </div>
              </div>
            )}
            {paused && (
              <div
                className="crt-content"
                style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
              >
                <div>
                  <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                    EN PAUSA
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 11,
                      color: "var(--ink-dim)",
                      marginTop: 10,
                      letterSpacing: "0.16em",
                    }}
                  >
                    PULSA REANUDAR PARA CONTINUAR
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="crt-bottom">
            <span className="led">SEÑAL OK</span>
            <span>{game.title} · CRT-83 · 60 HZ</span>
            {entry ? (
              <span className="crt-controls">{entry.controls}</span>
            ) : (
              <span>CARGA · 1MB</span>
            )}
          </div>
        </div>
        {entry && (
          <TouchPad
            layout={entry.touch}
            status={status}
            inputRef={inputRef}
            skin={skin}
          />
        )}
      </div>
      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            {/* La puntuación final se lee del ref al montar el modal (no hay estado por jugada). */}
            <div
              className="final"
              ref={(el) => {
                if (el) el.textContent = fmtScore(scoreRef.current);
              }}
            />
            {!game.playable ? (
              <div className="save-note demo">
                PUNTUACIÓN NO CLASIFICABLE (DEMO)
              </div>
            ) : !username ? (
              <div className="save-guest">
                <div className="save-note guest">
                  INICIA SESIÓN PARA GUARDAR TU MARCA
                </div>
                <Link className="btn yellow" href="/auth" prefetch={false}>
                  INICIAR SESIÓN
                </Link>
              </div>
            ) : save.status === "saved" ? (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            ) : (
              <>
                <div className="input-row">
                  <div className="player-tag" aria-label="Jugador">
                    <span className="l">JUGADOR</span>
                    <span className="v">{username}</span>
                  </div>
                  <button
                    className="btn yellow"
                    disabled={save.status === "saving"}
                    onClick={submitScore}
                  >
                    {save.status === "saving"
                      ? "GUARDANDO…"
                      : save.status === "error"
                        ? "REINTENTAR"
                        : "GUARDAR PUNTUACIÓN"}
                  </button>
                </div>
                {save.status === "error" && (
                  <div className="save-error" role="alert">
                    ✕ {save.error}
                  </div>
                )}
              </>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <button className="btn magenta" onClick={() => router.push("/")}>
                VOLVER AL VAULT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
