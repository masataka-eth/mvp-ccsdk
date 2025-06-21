import { query, type SDKMessage } from "@anthropic-ai/claude-code";
import * as dotenv from "dotenv";

dotenv.config();

async function analyzeRepository(repoName: string): Promise<void> {
  console.log(`\n🔍 Analyzing repository: ${repoName}\n`);

  const messages: SDKMessage[] = [];
  const abortController = new AbortController();

  const prompt = `
GitHub MCP を使用して、GitHub リポジトリ "${repoName}" を詳細に分析してください。

**利用可能なツール:**
- mcp__github__get_file_contents: ファイルの内容を取得
- mcp__github__search_repositories: リポジトリを検索
- mcp__github__search_code: コードを検索
- mcp__github__list_commits: コミット履歴を取得

**分析手順:**
1. リポジトリの基本情報を取得
2. README、package.json、requirements.txt等の設定ファイルを確認
3. src/, lib/, app/等のメインディレクトリのファイル一覧を取得
4. 主要なソースコードファイルの内容を読み取り
5. ソースコードの行数をカウント

**出力形式（日本語で回答）:**

## 1. ソースコードの概要説明
- プロジェクトの目的と機能
- 使用されている主要な技術スタック
- プロジェクト構造の概要

## 2. ソースコードのステップ数
- 言語別の行数（実際にファイルを確認して計算）
- 合計行数（空行・コメント行を除く）
- 主要ファイルの詳細

## 3. 完成度評価（0〜100点）
- コード品質: /100点
- ドキュメント: /100点  
- テスト: /100点
- 総合評価: /100点

## 4. 改善提案
- 具体的な改善ポイント（3〜5個）
- 各ポイントの優先度（高/中/低）と理由

必ず実際にファイルの内容を確認してから分析してください。
`;

  try {
    for await (const message of query({
      prompt,
      abortController,
      options: {
        maxTurns: 100,
        mcpServers: {
          github: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
            env: {
              GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || "",
            },
          },
        },
        allowedTools: [
          "mcp__github__get_file_contents",
          "mcp__github__search_repositories",
          "mcp__github__search_code",
          "mcp__github__list_commits",
        ],
      },
    })) {
      messages.push(message);

      if (message.type === "assistant") {
        console.log(message.message.content);
      } else if (message.type === "result") {
        if (message.subtype === "success") {
          console.log(`\n✅ 分析完了`);
          console.log(`総コスト: $${message.total_cost_usd.toFixed(4)}`);
        } else {
          console.error(`\n❌ エラー: ${message.subtype}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY が設定されていません");
    process.exit(1);
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error("❌ GITHUB_TOKEN が設定されていません");
    process.exit(1);
  }

  const repoName = process.argv[2];

  if (!repoName) {
    console.error("❌ リポジトリ名を指定してください");
    console.error("使用方法: npm run dev <repository-name>");
    console.error("例: npm run dev owner/repository");
    process.exit(1);
  }

  await analyzeRepository(repoName);
}

main().catch(console.error);
