"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/app/auth/actions";
type Status = "idle" | "sending" | "error";
export default function Auth() {
  const router = useRouter();
  const [tab, setTab] = useState<"in" | "up">("in");
  const [user, setUserField] = useState("");
  const [pass, setPass] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const sending = status === "sending";
  const switchTab = (next: "in" | "up") => {
    setTab(next);
    setStatus("idle");
    setErrorMsg("");
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setStatus("sending");
    setErrorMsg("");
    const result =
      tab === "in"
        ? await signIn({ email, password: pass })
        : await signUp({ username: user, email, password: pass });
    if (result.ok) {
      router.push("/biblioteca");
      router.refresh();
    } else {
      setStatus("error");
      setErrorMsg(result.error);
    }
  };
  const playAsGuest = () => {
    router.push("/biblioteca");
  };
  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>
        <div className="auth-tabs">
          <button
            className={tab === "in" ? "on" : ""}
            onClick={() => switchTab("in")}
            disabled={sending}
          >
            INICIAR SESIÓN
          </button>
          <button
            className={tab === "up" ? "on" : ""}
            onClick={() => switchTab("up")}
            disabled={sending}
          >
            CREAR CUENTA
          </button>
        </div>
        <form onSubmit={submit}>
          {tab === "up" && (
            <div className="field slide-in">
              <label htmlFor="auth-user">Usuario</label>
              <input
                id="auth-user"
                value={user}
                onChange={(e) => setUserField(e.target.value)}
                placeholder="px_kai"
                autoComplete="username"
                autoCapitalize="characters"
                maxLength={10}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="auth-email">Correo electrónico</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jugador@vault.gg"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="auth-pass">Contraseña</label>
            <input
              id="auth-pass"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === "in" ? "current-password" : "new-password"}
            />
          </div>
          {status === "error" && (
            <div className="auth-error" role="alert">
              {errorMsg}
            </div>
          )}
          <button
            className="btn lg"
            type="submit"
            disabled={sending}
            style={{ width: "100%", marginTop: 8 }}
          >
            {sending
              ? tab === "in"
                ? "▶  ENTRANDO…"
                : "▶  CREANDO CUENTA…"
              : tab === "in"
                ? "ENTRAR AL VAULT"
                : "CREAR Y JUGAR"}
          </button>
        </form>
        <button
          className="btn ghost"
          style={{ width: "100%", marginTop: 10 }}
          onClick={playAsGuest}
          disabled={sending}
        >
          JUGAR COMO INVITADO
        </button>
        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <button className="btn ghost" type="button">
            ◆ GOOGLE
          </button>
          <button className="btn ghost" type="button">
            ▣ GITHUB
          </button>
        </div>
        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 11,
            color: "var(--ink-faint)",
            letterSpacing: "0.1em",
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
