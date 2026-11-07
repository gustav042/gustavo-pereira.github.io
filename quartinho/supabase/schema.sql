-- quartinho.net: banco no Supabase
-- Cole tudo isto no "SQL Editor" do seu projeto Supabase e clique em "Run".
-- A segurança vem das regras RLS (row level security) abaixo: a chave "anon" do site é pública,
-- mas com essas regras cada pessoa só consegue mexer nas próprias coisas.

-- ========== perfis: um por conta ==========
create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  usuario text not null unique
    check (usuario ~ '^[a-z0-9_.]{3,20}$' and usuario <> 'eu'),
  -- tudo do quartinho (móveis, blog, estante, diário...) fica num JSON só
  dados jsonb not null default '{}'::jsonb
    check (octet_length(dados::text) < 500000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.perfis enable row level security;

drop policy if exists "perfis visíveis pra todos" on public.perfis;
create policy "perfis visíveis pra todos" on public.perfis
  for select using (true);
drop policy if exists "cada um cria o seu" on public.perfis;
create policy "cada um cria o seu" on public.perfis
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "cada um edita o seu" on public.perfis;
create policy "cada um edita o seu" on public.perfis
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "cada um apaga o seu" on public.perfis;
create policy "cada um apaga o seu" on public.perfis
  for delete to authenticated using (auth.uid() = id);

-- ========== recados no mural ==========
create table if not exists public.recados (
  id bigint generated always as identity primary key,
  para uuid not null references public.perfis (id) on delete cascade,
  de uuid not null references public.perfis (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 300),
  criado_em timestamptz not null default now()
);
create index if not exists recados_para_idx on public.recados (para, criado_em desc);
alter table public.recados enable row level security;

drop policy if exists "recados visíveis" on public.recados;
create policy "recados visíveis" on public.recados
  for select using (true);
drop policy if exists "recado só no próprio nome" on public.recados;
create policy "recado só no próprio nome" on public.recados
  for insert to authenticated with check (auth.uid() = de);
drop policy if exists "apagar recado meu ou do meu mural" on public.recados;
create policy "apagar recado meu ou do meu mural" on public.recados
  for delete to authenticated using (auth.uid() = de or auth.uid() = para);

-- ========== quem segue quem ==========
create table if not exists public.seguindo (
  seguidor uuid not null references public.perfis (id) on delete cascade,
  seguido uuid not null references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (seguidor, seguido),
  check (seguidor <> seguido)
);
create index if not exists seguindo_seguido_idx on public.seguindo (seguido);
alter table public.seguindo enable row level security;

drop policy if exists "ver quem segue quem" on public.seguindo;
create policy "ver quem segue quem" on public.seguindo
  for select using (true);
drop policy if exists "seguir" on public.seguindo;
create policy "seguir" on public.seguindo
  for insert to authenticated with check (auth.uid() = seguidor);
drop policy if exists "deixar de seguir" on public.seguindo;
create policy "deixar de seguir" on public.seguindo
  for delete to authenticated using (auth.uid() = seguidor);

-- ========== visitas aos quartinhos ==========
create table if not exists public.visitas_quarto (
  perfil uuid primary key references public.perfis (id) on delete cascade,
  total bigint not null default 0 check (total >= 0),
  atualizado_em timestamptz not null default now()
);
alter table public.visitas_quarto enable row level security;
revoke all on public.visitas_quarto from anon, authenticated;

create or replace function public.registrar_visita_quarto(p_perfil uuid)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  novo_total bigint;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária';
  end if;

  insert into public.visitas_quarto (perfil, total)
  values (p_perfil, 1)
  on conflict (perfil) do update
    set total = public.visitas_quarto.total + 1,
        atualizado_em = now()
  returning total into novo_total;

  return novo_total;
end;
$$;
revoke all on function public.registrar_visita_quarto(uuid) from public;
grant execute on function public.registrar_visita_quarto(uuid) to authenticated;

-- ========== imagens enviadas (pôsteres, fundo do blog, stickers) ==========
-- cada pessoa só envia/apaga dentro da pasta com o próprio id
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagens', 'imagens', true, 2097152, array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "imagens: enviar na própria pasta" on storage.objects;
create policy "imagens: enviar na própria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'imagens' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "imagens: apagar da própria pasta" on storage.objects;
create policy "imagens: apagar da própria pasta" on storage.objects
  for delete to authenticated
  using (bucket_id = 'imagens' and (storage.foldername(name))[1] = auth.uid()::text);

-- ========== comentários nos posts do feed ==========

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
