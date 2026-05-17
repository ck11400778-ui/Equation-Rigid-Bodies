create table if not exists public.leaderboard_entries (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default timezone('utc', now()),
  mode text not null,
  name text not null,
  score integer not null,
  money integer not null default 0,
  time_seconds integer
);

alter table public.leaderboard_entries enable row level security;

create policy "leaderboard_select_all"
on public.leaderboard_entries
for select
to anon
using (true);

create policy "leaderboard_insert_all"
on public.leaderboard_entries
for insert
to anon
with check (
  char_length(name) between 1 and 16
  and score >= 0
  and money >= 0
  and (time_seconds is null or time_seconds >= 0)
);
