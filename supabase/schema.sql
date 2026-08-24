create table if not exists public.user_data (
  user_id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

-- Version de démonstration : l’application conserve temporairement la
-- connexion dans defaultUsers.js, donc le navigateur n’a pas encore de
-- session Supabase Auth. Ces policies autorisent l’accès public et ne sont
-- acceptables que pour des données fictives de démonstration.
create policy "demo public read"
on public.user_data
for select
using (true);

create policy "demo public insert"
on public.user_data
for insert
with check (true);

create policy "demo public update"
on public.user_data
for update
using (true)
with check (true);

-- Avant toute utilisation réelle, supprimer ces policies et remplacer par
-- des policies utilisant auth.uid() après migration vers Supabase Auth.
