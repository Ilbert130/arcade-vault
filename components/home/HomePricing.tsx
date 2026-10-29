export default function HomePricing({ goAuth }: { goAuth: () => void }) {
  return (
    <section className="home-section reveal">
      <div className="section-head">
        <div className="kicker pixel neon-green">{"// 04"}</div>
        <h2 className="section-title">PRECIOS</h2>
        <div className="section-rule"></div>
      </div>
      <div className="pricing-grid">
        <div className="price-card">
          <div className="pc-label pixel">PLAN ÚNICO</div>
          <div className="pc-name pixel">JUGADOR VAULT</div>
          <div className="pc-amount">
            <span className="pc-amount-n">$0</span>
            <span className="pc-amount-u">/ SIEMPRE</span>
          </div>
          <div className="pc-tag">SIN TRUCOS · SIN LETRA PEQUEÑA</div>
          <ul className="pc-list">
            <li>✔ Acceso a todos los juegos</li>
            <li>✔ Ranking global y salón de la fama</li>
            <li>✔ Sin anuncios entre partidas</li>
            <li>✔ Guarda tus puntuaciones</li>
            <li>✔ Nuevos juegos cada mes</li>
            <li>✔ Funciona en cualquier navegador</li>
          </ul>
          <button
            className="btn xl pulse"
            style={{ width: "100%" }}
            onClick={goAuth}
          >
            EMPEZAR GRATIS →
          </button>
          <div className="pc-foot">No pedimos tarjeta. Nunca lo haremos.</div>
          <div className="pc-stamp pixel">
            FREE
            <br />
            PLAY
          </div>
        </div>

        <div className="pricing-faq">
          <div className="faq-item">
            <div className="faq-q pixel">¿REALMENTE ES GRATIS?</div>
            <div className="faq-a">
              Sí. Arcade Vault es un proyecto sin fines de lucro hecho por amor
              a los clásicos. No hay versión &quot;premium&quot; escondida.
            </div>
          </div>
          <div className="faq-item">
            <div className="faq-q pixel">¿NECESITO CREAR CUENTA?</div>
            <div className="faq-a">
              No. Puedes jugar como invitado. Si quieres guardar tu puntuación y
              aparecer en el ranking, regístrate en 10 segundos.
            </div>
          </div>
          <div className="faq-item">
            <div className="faq-q pixel">¿CÓMO SOBREVIVEN SIN COBRAR?</div>
            <div className="faq-a">
              Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda
              la moneda que aceptamos.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
