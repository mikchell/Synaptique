-- フォルダ機能（フラット・1シート1フォルダ）
create table if not exists folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

alter table folders enable row level security;

create policy "自分のフォルダを参照できる" on folders
  for select using (auth.uid() = user_id);

create policy "自分のフォルダを作成できる" on folders
  for insert with check (auth.uid() = user_id);

create policy "自分のフォルダを更新できる" on folders
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "自分のフォルダを削除できる" on folders
  for delete using (auth.uid() = user_id);

-- INSERTトリガーでuser_idをauth.uid()に自動セット（sheetsテーブルと同じパターン）
create or replace function set_folder_user_id()
returns trigger as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists folders_set_user_id on folders;
create trigger folders_set_user_id
  before insert on folders
  for each row execute function set_folder_user_id();

-- シートの所属フォルダ（nullは未分類。フォルダ削除時は自動的に未分類へ戻す）
alter table sheets
  add column if not exists folder_id uuid null references folders(id) on delete set null;

create index if not exists idx_sheets_user_id_folder_id on sheets(user_id, folder_id);
