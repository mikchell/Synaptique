# 共通ルール

- 日本語でやり取りしてください
- 最初にタスクを実行する計画を作成し、ユーザーの許可を得てから進行してください
- タスクを完遂するために追加で必要な情報がある場合、ユーザーに質問をしてください
- 重要な技術的決定をする場合、簡潔に提示し、ユーザーからのフィードバックを得てください
- コミットを行う前に、ユーザにコミットの内容を説明し、許可を得てください
---

# AIエージェントのブランチ運用ルール

AIエージェントは **mainブランチへ直接コミットしてはいけない**

作業開始時に必ず新しいブランチを作成する。

## ブランチ作成手順

1. main ブランチを最新化する
   git checkout main
   git pull
2. 作業用ブランチを作成する
   git checkout -b <branch-name>
3. 実装を行う
4. Conventional Commit 形式でコミット（メッセージは日本語で記述する）
5. main ブランチへ Pull Request を作成する

※ ブランチ名はわかりやすく、作業内容が一目でわかるようにすること。
※ ブランチは作業完了後、マージされたら削除する必要はない。

---

## ブランチ命名規則

ブランチ名は以下の形式にする。
type/short-description
例:
feat/user-login  
fix/login-error  
docs/readme-update  
refactor/auth-controller  
test/login-spec

---

## ブランチ作成例

新機能追加の場合
git checkout main
git pull
git checkout -b feat/add-user-profile
バグ修正の場合
git checkout main
git pull
git checkout -b fix/login-validation-error

---

## Pull Request フロー

AIエージェントは以下のフローで作業する。
task  
↓  
branch 作成  
↓  
実装  
↓  
commit  
↓  
Pull Request 作成
