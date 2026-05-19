-- Add extended CFOP skill assessment and color neutrality fields to user_profiles
alter table user_profiles
  add column if not exists f2l_foundation text,
  add column if not exists cross_sub8 text,
  add column if not exists color_neutrality text
    check (color_neutrality in ('white_yellow', 'white_only', 'color_neutral', 'other')),
  add column if not exists color_neutral_color text;
