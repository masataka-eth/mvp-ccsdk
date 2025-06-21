# GitHub Repository Analyzer

Claude Code SDK と GitHub MCP を使用してリポジトリを分析する最小限の検証サービス

## 前提条件

- Node.js 18以上
- Claude Code CLI: `npm install -g @anthropic-ai/claude-code`

## セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定
`.env` ファイルを作成し、以下の環境変数を設定：
```env
ANTHROPIC_API_KEY=sk-xxx
GITHUB_TOKEN=ghp_xxx
```

**GitHub Token の権限:**
- `repo` スコープ (プライベートリポジトリにアクセスする場合)
- `public_repo` スコープ (パブリックリポジトリのみの場合)

3. ビルド
```bash
npm run build
```

## 使用方法

```bash
# 開発モード（TypeScript直接実行）
npm run dev owner/repository

# プロダクションモード（コンパイル済みJS実行）
npm run start owner/repository
```

## 出力内容

- ソースコードの概要説明
- 全ソースコードのステップ数（行数）
- 完成度評価（0-100点）
- 改善アドバイス

## 必要な権限

- ANTHROPIC_API_KEY: Claude API へのアクセス
- GITHUB_TOKEN: GitHub リポジトリへの読み取りアクセス