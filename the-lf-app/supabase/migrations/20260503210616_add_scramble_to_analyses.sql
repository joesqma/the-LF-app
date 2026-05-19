-- Add optional scramble field to analyses so users can record the scramble used for the solve
alter table analyses add column if not exists scramble text null;
