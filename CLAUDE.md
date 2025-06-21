## 作成するもの

こちらのドキュメントを元に**最小限**の検証サービスを作成せよ
https://docs.anthropic.com/ja/docs/claude-code/sdk

TypeScript のライブラリを使用して、Typescript のコードで実現すること \*最小限\*\*なので無駄な処理やコードは不要として、エンジニアが最もわかりやすいコード構成とすること

## 実現すること

Github のリポジトリ名を渡したら Claude Code が Github MCP を経由してそのリポジトリのソース情報を取得して、以下を出力する

- そのソースコードの概要説明
- 全てのソースコードのステップ数を表示
- ソースコードの完成度をエンジニア視点で評価（0 〜 100 点）する
- どのようなアップデートをしたらより良いコードになるかをアドバイス

## 設定する環境変数

# Claude API キー (必須)

ANTHROPIC_API_KEY=sk-xxx

# GitHub Personal Access Token (必須)

GITHUB_TOKEN=ghp_xxx
