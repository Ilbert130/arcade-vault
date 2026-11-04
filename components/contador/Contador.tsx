"use client";

import { useState } from "react";
import Image from "next/image";

const MAX = 1025;
const sprite = (n: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${n}.png`;

export default function Contador() {
  const [count, setCount] = useState(0);

  return (
    <main className="counter-page">
      <p className="counter-eyebrow">Pokédex · escáner</p>
      <h1 className="counter-title">Contador Pokémon</h1>

      <div className="counter-screen" aria-live="polite">
        {count === 0 ? (
          <p className="counter-empty">
            Pulsa el botón para descubrir tu primer Pokémon.
          </p>
        ) : (
          <Image
            key={count}
            className="counter-sprite"
            src={sprite(count)}
            alt={`Pokémon número ${count}`}
            width={475}
            height={475}
            unoptimized
            priority
          />
        )}
      </div>

      <p className="counter-number">N.º {String(count).padStart(4, "0")}</p>

      <div className="counter-actions">
        <button
          type="button"
          className="btn"
          onClick={() => setCount((c) => (c >= MAX ? 1 : c + 1))}
        >
          Siguiente +1
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setCount(0)}
          disabled={count === 0}
        >
          Reiniciar
        </button>
      </div>
    </main>
  );
}
