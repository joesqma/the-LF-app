update public.user_profiles
set method = 'unknown'
where method = concat('ro', 'ux');

update public.analyses
set method = 'cfop'
where method = concat('ro', 'ux');

update public.solves
set method = null
where lower(method) = concat('ro', 'ux');

update public.bookmarks
set method_tag = null
where lower(method_tag) = concat('ro', 'ux');

alter table public.user_profiles
  drop constraint if exists user_profiles_method_check;

alter table public.user_profiles
  add constraint user_profiles_method_check
  check (method in ('cfop', 'beginner', 'unknown'));

alter table public.analyses
  drop constraint if exists analyses_method_check;

alter table public.analyses
  add constraint analyses_method_check
  check (method in ('cfop', 'beginner'));
