-- Contador compartilhado de visitas por quartinho.
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
