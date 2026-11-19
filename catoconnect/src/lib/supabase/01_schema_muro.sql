-- =====================================================================
-- UCB Social - esquema para Supabase
-- Ejecutar completo en: Supabase > SQL Editor
-- =====================================================================

-- ---------- Perfiles ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  career      text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ---------- Publicaciones (el muro) ----------
create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  content     text not null check (char_length(content) between 1 and 2000),
  image_url   text,
  category    text not null default 'general'
    check (category in ('general','anuncio','evento','pregunta','estudio','venta')),
  updated_at  timestamptz,
  created_at  timestamptz not null default now(),
  constraint posts_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade
);
create index posts_created_at_idx on public.posts (created_at desc);
create index posts_category_idx on public.posts (category, created_at desc);

-- updated_at se llena solo cuando cambia el contenido o la categoría
create or replace function public.set_post_updated_at()
returns trigger
language plpgsql
as $$
begin
  if new.content is distinct from old.content
     or new.category is distinct from old.category then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_post_updated_at();

-- ---------- Me gusta ----------
create table public.likes (
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ---------- Comentarios ----------
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null,
  content     text not null check (char_length(content) between 1 and 1000),
  created_at  timestamptz not null default now(),
  constraint comments_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade
);
create index comments_post_idx on public.comments (post_id, created_at);

-- =====================================================================
-- Solo correos @ucb.edu.bo pueden registrarse
-- =====================================================================
create or replace function public.enforce_ucb_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) not like '%@ucb.edu.bo' then
    raise exception 'Solo se permiten correos @ucb.edu.bo';
  end if;
  return new;
end;
$$;

create trigger enforce_ucb_email_trg
  before insert on auth.users
  for each row execute function public.enforce_ucb_email();

-- Crea el perfil automaticamente al registrarse
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
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'career'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.posts    enable row level security;
alter table public.likes    enable row level security;
alter table public.comments enable row level security;

-- Perfiles: todos los logueados leen, cada quien edita el suyo
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Posts
create policy "posts_select" on public.posts
  for select to authenticated using (true);
create policy "posts_insert_own" on public.posts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "posts_update_own" on public.posts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "posts_delete_own" on public.posts
  for delete to authenticated using (auth.uid() = user_id);

-- Likes
create policy "likes_select" on public.likes
  for select to authenticated using (true);
create policy "likes_insert_own" on public.likes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "likes_delete_own" on public.likes
  for delete to authenticated using (auth.uid() = user_id);

-- Comentarios
create policy "comments_select" on public.comments
  for select to authenticated using (true);
create policy "comments_insert_own" on public.comments
  for insert to authenticated with check (auth.uid() = user_id);
create policy "comments_delete_own" on public.comments
  for delete to authenticated using (auth.uid() = user_id);

-- =====================================================================
-- Realtime (para que el muro se actualice solo)
-- =====================================================================
-- replica identity full permite saber quién hizo el like/comentario al borrarlo
alter table public.likes    replica identity full;
alter table public.comments replica identity full;

alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.likes;
alter publication supabase_realtime add table public.comments;

-- =====================================================================
-- Storage: imagenes de publicaciones
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "post_images_read" on storage.objects
  for select using (bucket_id = 'post-images');

create policy "post_images_upload_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "post_images_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
