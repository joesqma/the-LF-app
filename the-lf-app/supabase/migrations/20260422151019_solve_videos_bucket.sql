-- Create private solve-videos bucket (200 MB file size limit)
insert into storage.buckets (id, name, public, file_size_limit)
values ('solve-videos', 'solve-videos', false, 209715200)
on conflict (id) do nothing;

-- Users can upload only into their own folder
create policy "solve_videos_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'solve-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read only their own files
create policy "solve_videos_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'solve-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete only their own files
create policy "solve_videos_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'solve-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
