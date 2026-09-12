-- ノードに貼り付ける画像用のストレージバケット（非公開・署名付きURLで配信）
insert into storage.buckets (id, name, public)
values ('node-images', 'node-images', false)
on conflict (id) do nothing;

-- パスは "{auth.uid()}/{ファイル名}" 形式。自分のフォルダ配下のみ操作可能
create policy "自分の画像を参照できる" on storage.objects
  for select using (
    bucket_id = 'node-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "自分の画像をアップロードできる" on storage.objects
  for insert with check (
    bucket_id = 'node-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "自分の画像を削除できる" on storage.objects
  for delete using (
    bucket_id = 'node-images' and (storage.foldername(name))[1] = auth.uid()::text
  );
