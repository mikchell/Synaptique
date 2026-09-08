-- RLS UPDATEポリシーにWITH CHECKを追加（更新後のuser_idも検証）
drop policy if exists "自分のシートを更新できる" on sheets;
create policy "自分のシートを更新できる" on sheets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- INSERTトリガーでuser_idをauth.uid()に自動セット
create or replace function set_sheet_user_id()
returns trigger as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists sheets_set_user_id on sheets;
create trigger sheets_set_user_id
  before insert on sheets
  for each row execute function set_sheet_user_id();
