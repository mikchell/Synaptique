-- sheetsテーブル作成
create table if not exists sheets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'シート1',
  data        jsonb not null default '{"nodes":[],"edges":[]}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_atを自動更新するトリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sheets_updated_at on sheets;
create trigger sheets_updated_at
  before update on sheets
  for each row execute function update_updated_at();

-- RLS有効化（ユーザーは自分のシートのみ操作可能）
alter table sheets enable row level security;

create policy "自分のシートを参照できる" on sheets
  for select using (auth.uid() = user_id);

create policy "自分のシートを作成できる" on sheets
  for insert with check (auth.uid() = user_id);

create policy "自分のシートを更新できる" on sheets
  for update using (auth.uid() = user_id);

create policy "自分のシートを削除できる" on sheets
  for delete using (auth.uid() = user_id);
