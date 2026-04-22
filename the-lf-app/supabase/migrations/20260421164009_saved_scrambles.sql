-- Create saved_scrambles table for users to bookmark scrambles from the timer

create table if not exists saved_scrambles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  scramble text not null,
  puzzle text not null default '3×3',
  notes text,
  created_at timestamptz not null default now()
);

alter table saved_scrambles enable row level security;

create policy "saved_scrambles_select"
  on saved_scrambles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "saved_scrambles_insert"
  on saved_scrambles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "saved_scrambles_delete"
  on saved_scrambles for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists saved_scrambles_user_id_idx on saved_scrambles(user_id);
