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

insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'nombre', ''), split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

update public.profiles p
set full_name = u.raw_user_meta_data->>'nombre'
from auth.users u
where u.id = p.id
  and nullif(u.raw_user_meta_data->>'nombre', '') is not null
  and p.full_name = split_part(u.email, '@', 1);
