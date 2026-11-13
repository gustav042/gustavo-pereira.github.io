-- Registro das análises de filmes feitas com IA, usado para limitar o uso por pessoa.
-- Só a Edge Function (chave service_role) lê e grava aqui; o navegador não tem acesso.
create table if not exists public.analises_ia (
  id bigint generated always as identity primary key,
  usuario uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);
create index if not exists analises_ia_usuario_data on public.analises_ia (usuario, criado_em desc);
alter table public.analises_ia enable row level security;
revoke all on public.analises_ia from anon, authenticated;
