-- quartinho.net: comentários nos posts do feed (filmes e séries que os amigos viram).
-- Cole isto no "SQL Editor" do Supabase e clique em "Run" (pode rodar mais de uma vez, não estraga nada).

create table if not exists public.comentarios (
  id bigint generated always as identity primary key,
  dono uuid not null references public.perfis (id) on delete cascade,   -- dono do post (quem viu o filme)
  post text not null check (char_length(post) between 1 and 200),      -- qual filme da estante dele
  de uuid not null references public.perfis (id) on delete cascade,     -- quem comentou
  texto text not null check (char_length(texto) between 1 and 300),
  criado_em timestamptz not null default now()
);
create index if not exists comentarios_dono_idx on public.comentarios (dono, criado_em);
alter table public.comentarios enable row level security;

drop policy if exists "comentários visíveis" on public.comentarios;
create policy "comentários visíveis" on public.comentarios
  for select using (true);
drop policy if exists "comentário só no próprio nome" on public.comentarios;
create policy "comentário só no próprio nome" on public.comentarios
  for insert to authenticated with check (auth.uid() = de);
drop policy if exists "editar comentário próprio" on public.comentarios;
create policy "editar comentário próprio" on public.comentarios
  for update to authenticated using (auth.uid() = de) with check (auth.uid() = de);
drop policy if exists "apagar comentário meu ou do meu post" on public.comentarios;
create policy "apagar comentário meu ou do meu post" on public.comentarios
  for delete to authenticated using (auth.uid() = de or auth.uid() = dono);
