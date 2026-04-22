-- Remove duplicate (user_id, scramble) rows keeping the earliest, then enforce uniqueness

delete from saved_scrambles
where id not in (
  select distinct on (user_id, scramble) id
  from saved_scrambles
  order by user_id, scramble, created_at asc
);

alter table saved_scrambles
  add constraint saved_scrambles_user_scramble_unique unique (user_id, scramble);
