-- Activa el leaderboard de <TÍTULO>: solo los juegos playable aceptan inserts en public.scores (RLS).

-- Caso A: el juego ya está sembrado (bloque-buster, caida, serpentina, gloton, invasores, ranaria, duelo-pixel).
update public.games set playable = true where id = '<id>';

-- Caso B: juego nuevo (sort_order único; cat ∈ ARCADE|PUZZLE|SHOOTER|VERSUS; color ∈ cyan|magenta|yellow|green;
-- cover = clase .cover-* existente o nueva en app/styles/covers.css).
-- insert into public.games (id, title, short, long, cat, cover, color, playable, sort_order) values
--   ('<id>', '<TÍTULO>', '<frase corta>', '<descripción larga>', 'ARCADE', 'cover-<x>', 'cyan', true,
--    (select coalesce(max(sort_order), 0) + 1 from public.games));
