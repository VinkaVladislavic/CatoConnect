-- =====================================================================
-- Adaptación del muro a CatoConnect
-- Requisito: haber ejecutado ANTES 01_schema_muro.sql en este proyecto.
-- Es seguro ejecutarlo más de una vez. Solo toca las tablas del muro
-- (profiles, posts, likes, comments) y la función handle_new_user.
-- =====================================================================

-- 1) Al registrarse, el perfil toma el nombre desde 'nombre' (lo que guarda
--    CatoConnect en user_metadata). También acepta 'full_name'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, career)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'nombre', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    nullif(new.raw_user_meta_data->>'career', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2) Crea el perfil de los usuarios que ya existían antes de instalar el muro
--    (sin perfil no pueden publicar: posts.user_id apunta a profiles.id)
insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'nombre', ''), split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- 3) Corrige los perfiles que quedaron con el prefijo del correo en vez del nombre real
update public.profiles p
set full_name = u.raw_user_meta_data->>'nombre'
from auth.users u
where u.id = p.id
  and nullif(u.raw_user_meta_data->>'nombre', '') is not null
  and p.full_name = split_part(u.email, '@', 1);
