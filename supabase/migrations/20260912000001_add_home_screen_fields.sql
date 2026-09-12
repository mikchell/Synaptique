-- ホーム画面（スター・ゴミ箱・最近使用した項目）用のカラムを追加
alter table sheets
  add column if not exists is_starred     boolean not null default false,
  add column if not exists deleted_at     timestamptz null,
  add column if not exists last_opened_at timestamptz not null default now();

comment on column sheets.is_starred is 'スター（お気に入り）フラグ';
comment on column sheets.deleted_at is 'ゴミ箱に入れた日時。nullなら未削除（アクティブ）';
comment on column sheets.last_opened_at is '最後に開いた日時。「最近使用した項目」の並び替えに使用';

-- ゴミ箱一覧・スター一覧の絞り込みを高速化
create index if not exists idx_sheets_user_id_deleted_at on sheets(user_id, deleted_at);
