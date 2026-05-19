-- Widen analyses.method check constraint to include 'beginner'
do $$
declare
  _constraint_name text;
begin
  select conname into _constraint_name
  from pg_constraint
  where conrelid = 'public.analyses'::regclass
    and contype = 'c'
    and conname ilike '%method%';

  if _constraint_name is not null then
    execute format('alter table public.analyses drop constraint %I', _constraint_name);
  end if;
end $$;

alter table public.analyses
  add constraint analyses_method_check
  check (method in ('cfop', 'roux', 'beginner'));
