"use client";

import { useRouter } from "next/navigation";
import { useReveal } from "@/components/shared/useReveal";
import FloatingSilhouettes from "@/components/home/FloatingSilhouettes";
import HomeActivity from "@/components/home/HomeActivity";
import HomeFeatures from "@/components/home/HomeFeatures";
import HomePricing from "@/components/home/HomePricing";
import { ACTIVITY } from "@/lib/placeholder/home-data";
import type { Game } from "@/lib/catalog/types";

function MiniCard({ game, onClick }: { game: Game; onClick: () => void }) {
  return (
    <div className="mini-card" onClick={onClick}>
      <div className="mini-cover">
        <div className={"cover-bg " + game.cover}></div>
      </div>
      <div className="mini-meta">
        <div className="mini-title">{game.title}</div>
        <div className="mini-cat">{game.cat}</div>
      </div>
    </div>
  );
}

export default function Home({ games }: { games: Game[] }) {
  useReveal();

  const stats = [
    { n: String(games.length), u: "JUEGOS", s: "Y CONTANDO" },
    { n: "MILES", u: "DE PARTIDAS", s: "JUGADAS CADA DÍA" },
    { n: "GLOBAL", u: "RANKING", s: "COMPITE CON EL MUNDO" },
  ];
  const activity = ACTIVITY.filter((a) =>
    games.some((g) => g.title.toLowerCase() === a.game.toLowerCase()),
  );
  const router = useRouter();

  const goBiblioteca = () => router.push("/biblioteca");
  const goAuth = () => router.push("/auth");
  const goSalon = () => router.push("/salon");

  return (
    <div className="home fade-in">
      {/* HERO */}
      <section className="home-hero">
        <FloatingSilhouettes />
        <div className="home-hero-inner">
          <div className="hero-eyebrow pixel neon-yellow">
            ▸ INSERTA UNA MONEDA<span className="blink">_</span>
          </div>
          <h1 className="home-title">
            <span className="line-1">EL ARCADE</span>
            <span className="line-2">CLÁSICO ESTÁ</span>
            <span className="line-3">DE VUELTA</span>
          </h1>
          <p className="home-sub">
            Juega los mejores clásicos directamente en tu navegador.
            <br />
            Sin descargas. Sin costo. Solo diversión.
          </p>
          <div className="home-ctas">
            <button className="btn xl pulse" onClick={goBiblioteca}>
              ▶ EXPLORAR JUEGOS
            </button>
            <button className="btn xl magenta" onClick={goAuth}>
              ✦ CREAR CUENTA
            </button>
          </div>
          <div className="hero-scroll" aria-hidden="true">
            <span>DESLIZA</span>
            <span className="arrow">▼</span>
          </div>
        </div>
      </section>

      <HomeFeatures />

      {/* GAMES PREVIEW */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-cyan">{"// 02"}</div>
          <h2 className="section-title">JUEGOS DISPONIBLES AHORA</h2>
          <div className="section-rule"></div>
        </div>
        <div className="mini-rail">
          {games.slice(0, 6).map((g) => (
            <MiniCard key={g.id} game={g} onClick={goBiblioteca} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button className="btn lg" onClick={goBiblioteca}>
            VER TODOS LOS JUEGOS →
          </button>
        </div>
      </section>

      {/* STATS */}
      <section className="home-stats reveal">
        <div className="stats-inner">
          {stats.map((st, i) => (
            <div
              key={i}
              className="stat-block"
              style={{ transitionDelay: i * 90 + "ms" }}
            >
              <div className="stat-n neon-yellow">{st.n}</div>
              <div className="stat-u pixel">{st.u}</div>
              <div className="stat-s">{st.s}</div>
            </div>
          ))}
        </div>
      </section>

      <HomeActivity activity={activity} goSalon={goSalon} />

      <HomePricing goAuth={goAuth} />

      {/* FINAL CTA */}
      <section className="home-final reveal">
        <h2 className="final-title pixel">¿LISTO PARA JUGAR?</h2>
        <button className="btn xl pulse final-cta" onClick={goBiblioteca}>
          INSERTAR MONEDA →
        </button>
        <div className="final-tag">
          Gratis. Sin registro obligatorio. Empieza en segundos.
        </div>
      </section>
    </div>
  );
}
