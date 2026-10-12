"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveScore } from "@/app/juegos/[id]/jugar/actions";
import type { Game } from "@/lib/games/types";
import { getCurrentUsername } from "@/lib/supabase/client";
import AsteroidsCanvas from "@/components/games/AsteroidsCanvas";
import type { AsteroidsStatus } from "@/components/games/AsteroidsCanvas";
import type { AsteroidsHud } from "@/lib/games/asteroids/types";
const START_LIVES = 3;
// Tras pulsar un botón se le quita el foco para que Espacio no vuelva a activarlo.
const blurTarget = (e: MouseEvent<HTMLButtonElement>) => e.currentTarget.blur();
const togglePause = (s: AsteroidsStatus): AsteroidsStatus =>
  s === "playing" ? "paused" : s === "paused" ? "playing" : s;
type SaveState =
  | { status: "idle" | "saving" | "saved" }
  | { status: "error"; error: string };
export default function GamePlayer({ game }: { game: Game }) {
  const router = useRouter();
  const isRocas = game.id === "rocas";
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [lives, setLives] = useState(START_LIVES);
  const [level, setLevel] = useState(1);
  // ROCAS espera en "ready" a que el jugador empiece; la simulación arranca jugando.
  const [status, setStatus] = useState<AsteroidsStatus>(
    isRocas ? "ready" : "playing",
  );
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
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
    if (isRocas || status !== "playing") return;
    const t = setInterval(() => {
      // Subir de nivel en el mismo tick que actualiza la puntuación (sin efecto aparte).
      const next = scoreRef.current + Math.floor(10 + Math.random() * 90);
      scoreRef.current = next;
      setScore(next);
      if (next % 2500 < 100) setLevel((l) => l + 1);
    }, 220);
    return () => clearInterval(t);
  }, [isRocas, status]);
  // ROCAS: Espacio empieza, P / Escape alternan pausa; ocultar la pestaña o perder el foco pausa.
  useEffect(() => {
    if (!isRocas) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && statusRef.current === "ready") {
        e.preventDefault();
        setStatus("playing");
      } else if (e.code === "KeyP" || e.code === "Escape") {
        setStatus(togglePause);
      }
    };
    const autoPause = () => setStatus((s) => (s === "playing" ? "paused" : s));
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
  }, [isRocas]);
  const handleHud = useCallback((hud: AsteroidsHud) => {
    scoreRef.current = hud.score;
    setScore(hud.score);
    setLives(hud.lives);
    setLevel(hud.level);
  }, []);
  const handleGameOver = useCallback((finalScore: number) => {
    scoreRef.current = finalScore;
    setScore(finalScore);
    setStatus("over");
  }, []);
  const endGame = () => setStatus("over");
  const restart = () => {
    scoreRef.current = 0;
    setScore(0);
    setLives(START_LIVES);
    setLevel(1);
    setStatus(isRocas ? "ready" : "playing");
    setSave({ status: "idle" });
  };
  const submitScore = async () => {
    setSave({ status: "saving" });
    try {
      const result = await saveScore({ gameId: game.id, score });
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
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{"♥ ".repeat(lives).trim() || "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button
            className="btn yellow"
            onClick={(e) => {
              blurTarget(e);
              setStatus(togglePause);
            }}
          >
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button
            className="btn magenta"
            onClick={(e) => {
              blurTarget(e);
              endGame();
            }}
          >
            FIN
          </button>
          <button
            className="btn ghost"
            onClick={() => router.push(`/juegos/${game.id}`)}
          >
            SALIR
          </button>
        </div>
      </div>
      <div className="crt">
        <div className="crt-screen">
          {isRocas ? (
            <AsteroidsCanvas
              status={status}
              onHud={handleHud}
              onGameOver={handleGameOver}
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
          {isRocas && status === "ready" && (
            <div className="crt-content rocas-start">
              <div className="rocas-start-inner">
                <div className="rocas-start-title pixel">ROCAS</div>
                <div className="rocas-start-prompt pixel">
                  PULSA ESPACIO PARA EMPEZAR
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
          {isRocas ? (
            <span className="crt-controls">
              ← → ROTAR · ↑ PROPULSAR · ESPACIO DISPARAR · P PAUSA
            </span>
          ) : (
            <span>CARGA · 1MB</span>
          )}
        </div>
      </div>
      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
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
