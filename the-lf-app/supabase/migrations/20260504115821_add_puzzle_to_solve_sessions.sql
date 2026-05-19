-- Add puzzle column to solve_sessions so each session knows its event.
-- Existing sessions default to '3×3' (the timer default).
alter table solve_sessions
  add column if not exists puzzle text not null default '3×3';
