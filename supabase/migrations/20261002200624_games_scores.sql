-- Catálogo de juegos (fuente única; solo cambia por migración).
create table public.games (
  id         text primary key check (id ~ '^[a-z0-9-]{2,32}$'),
  title      text not null,
  short      text not null,
  long       text not null,
  cat        text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  cover      text not null,           -- clase CSS .cover-* de globals.css
  color      text not null check (color in ('cyan','magenta','yellow','green')),
  playable   boolean not null default false,
  sort_order int not null unique,
  created_at timestamptz not null default now()
);

alter table public.games enable row level security;
create policy "games_select_all" on public.games
  for select to anon, authenticated using (true);
-- Sin políticas de escritura: el catálogo solo cambia por migración.

-- Semilla: los 8 juegos de lib/data.ts (sort_order 1..8), rocas con playable = true.
insert into public.games (id, title, short, long, cat, cover, color, playable, sort_order) values
  ('bloque-buster', 'BLOQUE BUSTER',
   'Rebota la pelota y destruye muros de neón.',
   'Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?',
   'ARCADE', 'cover-bricks', 'cyan', false, 1),
  ('caida', 'CAÍDA',
   'Encaja las piezas antes de que el techo te aplaste.',
   'Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.',
   'PUZZLE', 'cover-tetro', 'magenta', false, 2),
  ('serpentina', 'SERPENTINA',
   'Crece sin morder tu propia cola.',
   'Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.',
   'ARCADE', 'cover-snake', 'green', false, 3),
  ('gloton', 'GLOTÓN',
   'Devora puntos y escapa de los fantasmas.',
   'Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.',
   'ARCADE', 'cover-glot', 'yellow', false, 4),
  ('invasores', 'INVASORES',
   'Defiende el planeta de filas alienígenas.',
   'Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.',
   'SHOOTER', 'cover-invaders', 'green', false, 5),
  ('rocas', 'ROCAS',
   'Pulveriza asteroides en gravedad cero.',
   'Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.',
   'SHOOTER', 'cover-rocas', 'yellow', true, 6),
  ('ranaria', 'RANARIA',
   'Cruza la autopista de pixeles.',
   'Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.',
   'ARCADE', 'cover-rana', 'green', false, 7),
  ('duelo-pixel', 'DUELO PIXEL',
   'Dos paletas. Una pelota. Reflejos máximos.',
   'El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.',
   'VERSUS', 'cover-duelo', 'cyan', false, 8);

-- Historial de partidas.
create table public.scores (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid()
             references public.profiles(id) on delete cascade,
  game_id    text not null references public.games(id) on delete cascade,
  score      integer not null check (score between 0 and 99999999),
  created_at timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc, created_at);
create index scores_user_idx on public.scores (user_id);

alter table public.scores enable row level security;
create policy "scores_select_all" on public.scores
  for select to anon, authenticated using (true);
create policy "scores_insert_own_playable" on public.scores
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.games g where g.id = game_id and g.playable)
  );
-- Sin update/delete para clientes.

-- Mejor marca por jugador y juego; empate → gana quien la consiguió antes.
create view public.leaderboard with (security_invoker = true) as
select b.game_id, b.user_id, p.username, b.score, b.achieved_at,
       row_number() over (partition by b.game_id
                          order by b.score desc, b.achieved_at asc) as rank
from (
  select distinct on (game_id, user_id)
         game_id, user_id, score, created_at as achieved_at
  from public.scores
  order by game_id, user_id, score desc, created_at asc
) b
join public.profiles p on p.id = b.user_id;

create view public.game_stats with (security_invoker = true) as
select g.id as game_id,
       coalesce(max(s.score), 0) as best,
       count(s.id)               as plays
from public.games g
left join public.scores s on s.game_id = g.id
group by g.id;
