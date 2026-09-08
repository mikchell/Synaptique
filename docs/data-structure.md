# データ構造

## フロントエンド（Zustand ストア）

アプリの状態は `src/features/mindmap/store/mindmapStore.ts` で管理します。

```ts
// ノードのカラー種別
type NodeColor = 'purple' | 'blue' | 'cyan' | 'green' | 'pink' | 'orange'

// 各ノードが持つデータ
interface MindmapNodeData {
  label: string        // ノードのテキスト
  color: NodeColor     // 表示色
  isRoot?: boolean     // ルートノードフラグ
  depth?: number       // 階層の深さ（0 = ルート）
}

// 1枚のシート（マインドマップ1枚分）
interface Sheet {
  id: string                        // UUID
  name: string                      // タブに表示するシート名
  nodes: Node<MindmapNodeData>[]    // @xyflow/react の Node 型
  edges: Edge[]                     // @xyflow/react の Edge 型
}

// ストア全体
interface MindmapStore {
  sheets: Sheet[]                      // 全シート一覧
  currentSheetId: string               // 現在開いているシートの ID
  nodes: Node<MindmapNodeData>[]       // 現在のシートのノード（表示用コピー）
  edges: Edge[]                        // 現在のシートのエッジ（表示用コピー）
  selectedNodeId: string | null        // 選択中のノード ID
  editingNodeId: string | null         // ダブルクリックで編集中のノード ID
  defaultNodeColor: NodeColor | null   // 新規ノードに固定するカラー
}
```

`nodes` / `edges` はストアの「表示用コピー」です。シートを切り替えると `sheets` 配列の該当エントリから読み込まれます。

### Node の構造例（@xyflow/react）

```json
{
  "id": "node-1234567890-1",
  "type": "mindmapNode",
  "position": { "x": 320, "y": 0 },
  "data": {
    "label": "アイデア",
    "color": "blue",
    "depth": 1
  }
}
```

### Edge の構造例

```json
{
  "id": "edge-root-node-1234567890-1",
  "source": "root",
  "target": "node-1234567890-1",
  "sourceHandle": "right",
  "targetHandle": "left",
  "type": "interactive"
}
```

---

## localStorage（オフライン永続化）

キー名 `synaptique-storage` に以下を JSON で保存します。ログインしていない場合もデータが残ります。

```json
{
  "state": {
    "sheets": [ /* Sheet[] */ ],
    "currentSheetId": "uuid",
    "nodes": [ /* 現在のシートのノード */ ],
    "edges": [ /* 現在のシートのエッジ */ ],
    "defaultNodeColor": null
  },
  "version": 0
}
```

---

## Supabase DB

### `sheets` テーブル

| カラム | 型 | 説明 |
|---|---|---|
| `id` | `uuid` | PK（`gen_random_uuid()`） |
| `user_id` | `uuid` | `auth.users.id` の外部キー |
| `name` | `text` | シート名 |
| `data` | `jsonb` | `{ nodes: Node[], edges: Edge[] }` |
| `created_at` | `timestamptz` | 作成日時 |
| `updated_at` | `timestamptz` | 更新日時（トリガーで自動更新） |

RLS により、ユーザーは自分の行のみ参照・変更できます。

`nodes` / `edges` は `data` カラムに JSONB としてまとめて格納しています。シートを開く際は1行まるごと取得、保存時も1行まるごと上書き（upsert）するため、クエリがシンプルに保てます。

### インデックス

```sql
idx_sheets_user_id            -- user_id による絞り込みを高速化
idx_sheets_user_id_created_at -- user_id + created_at ORDER BY を高速化
```

---

## データフロー

```
ユーザー操作
  │
  ▼
Zustand ストア（nodes / edges をインメモリで更新）
  │
  ├─► localStorage（即時 persist）
  │
  └─► useSheetsSync（debounce 1秒）
        │
        ▼
      Supabase DB（sheets テーブルに upsert）
```

ログイン時は Supabase からシートを取得してストアに `loadSheets()` で流し込み、以降の変更は debounce で自動同期します。
