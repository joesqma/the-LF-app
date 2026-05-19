-- Add cfop_level to track how far a CFOP user has progressed in last-layer recognition
alter table user_profiles
  add column if not exists cfop_level text
    check (cfop_level in ('none', '2look_oll', '2look_both', 'full_ollpll'));
