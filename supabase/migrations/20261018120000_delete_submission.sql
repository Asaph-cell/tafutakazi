-- A graduate can delete work they submitted. Its verdict, comments, thumbs up, views and invites go with it.
-- The preview file is removed by the app first (storage can't be deleted from SQL).
create policy submissions_delete on public.submissions for delete to authenticated
  using (grad_id = auth.uid() and public.my_role() = 'grad');
grant delete on public.submissions to authenticated;
