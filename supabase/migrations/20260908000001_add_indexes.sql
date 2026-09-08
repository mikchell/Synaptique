-- user_id でのフィルタリングを高速化
CREATE INDEX IF NOT EXISTS idx_sheets_user_id ON sheets(user_id);

-- ORDER BY created_at の高速化
CREATE INDEX IF NOT EXISTS idx_sheets_user_id_created_at ON sheets(user_id, created_at ASC);
