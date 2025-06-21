import { query, type SDKMessage } from "@anthropic-ai/claude-code";
import * as dotenv from "dotenv";

dotenv.config();

// 評価結果の型定義
interface EvaluationItem {
  id: string;
  name: string;
  score: number;
  positives: string;
  negatives: string;
}

interface EvaluationResult {
  totalScore: number;
  items: EvaluationItem[];
  overallComment: string;
}

async function analyzeRepository(repoName: string): Promise<void> {
  console.log(`\n🔍 Analyzing repository: ${repoName}\n`);

  const messages: SDKMessage[] = [];
  const abortController = new AbortController();

  const prompt = `
GitHub MCP を使用して、GitHub リポジトリ "${repoName}" を詳細に分析してください。必ず実際にファイルの内容を確認してから分析してください。

[IMPORTANT]
可能な限り少ないターン数で分析を行うために、工夫をしてください。
主要なファイルを見極めて、50ターン以内での分析を行ってください。
ただし、**分析結果の精度は落としてはいけません**ので、主要なファイルを見極めは慎重に行ってください。

**利用可能なツール:**
- mcp__github__get_file_contents: ファイルの内容を取得
- mcp__github__search_repositories: リポジトリを検索
- mcp__github__search_code: コードを検索
- mcp__github__list_commits: コミット履歴を取得
- mcp__github__get_repository_structure: リポジトリの構造を取得
- mcp__github__list_repository_contents: リポジトリの内容を取得

**分析手順:**
1. リポジトリの基本構造を取得して、どのディレクトリが重要かを判断
2. README、package.json、requirements.txt等の設定ファイルを確認
3. src/, lib/, app/等のメインディレクトリの主要なファイル一覧を取得
4. 主要なソースコードファイルの内容を読み取り
5. 評価する

**出力形式（日本語で回答）:**

{
  "totalScore": 86,                // 0-100 の整数
  "items": [
    {
      "id": "1",
      "name": "テーマ適合度",        // 評価項目ラベル
      "score": 8,                  // 整数（配分内）
      "positives": "...",        // 良かった点 (1-3 件をわかりやすい文章で記載)
      "negatives": "..."         // 改善点 (1-3 件をわかりやすい文章で記載)
    },
    ...
    {
      "id": "7",
      "name": "ドキュメント",
      "score": 5,
      "positives": "...",
      "negatives": "..."
    }
  ],
  "overallComment": "総合的に見ると..." // 総合的に見てどうだったかをわかりやすい文章で記載、ここは長文となってもいいので詳細に記載してください。
}

## 評価項目
### 評価項目\_1
テーマ適合度
#### 配分
10 点
#### 主な評価軸
与えられたテーマや課題に対してどれだけ的確に応えているか

### 評価項目\_2
独創性・革新性
#### 配分
20 点
#### 主な評価軸
既存の解決策との差別化、新奇性、アイデアの意外性

### 評価項目\_3
技術的完成度
#### 配分
20 点
#### 主な評価軸
コード品質、技術スタックの妥当性、アルゴリズム／アーキテクチャの洗練度

### 評価項目\_4
機能実装・完成度
#### 配分
15 点
#### 主な評価軸
実際に「動く」かどうか、主要機能が一通り実装されているか

### 評価項目\_5
ユーザー体験（UX/UI）
#### 配分
15 点
#### 主な評価軸
直感的な操作性、デザインの一貫性、アクセシビリティ

### 評価項目\_6
実世界インパクト／ビジネス価値
#### 配分
10 点
#### 主な評価軸
社会的意義、市場規模、収益モデルの説得力

### 評価項目\_7
ドキュメント
#### 配分
10 点
#### 主な評価軸
README や API ドキュメントの充実度
`;

  try {
    for await (const message of query({
      prompt,
      abortController,
      options: {
        maxTurns: 500,
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
          "mcp__github__get_repository_structure",
          "mcp__github__list_repository_contents",
        ],
      },
    })) {
      messages.push(message);

      if (message.type === "assistant") {
        console.log(message.message.content);

        // contentを文字列に変換
        let contentText = "";
        if (typeof message.message.content === "string") {
          contentText = message.message.content;
        } else if (Array.isArray(message.message.content)) {
          // contentが配列の場合、テキスト部分を結合
          contentText = message.message.content
            .filter((item: any) => item.type === "text")
            .map((item: any) => item.text)
            .join("");
        }

        // 各メッセージからJSON抽出を試みる
        const extractedJson = extractJsonFromText(contentText);
        if (extractedJson && validateEvaluationResult(extractedJson)) {
          // evaluationResult = extractedJson;
          console.log("\n✅ 有効な評価結果JSONを検出しました");
          console.log("⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️");
          console.log(extractedJson);
          console.log("⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️");
        }
      } else if (message.type === "result") {
        if (message.subtype === "success") {
          console.log(`\n${"=".repeat(60)}`);
          console.log(`📊 分析結果サマリー`);
          console.log(`${"=".repeat(60)}`);
          console.log(`🔄 利用ターン数: ${message.num_turns}回`);
          console.log(`💰 総コスト: $${message.total_cost_usd.toFixed(4)}`);
          console.log(
            `⏱️  実行時間: ${(message.duration_ms / 1000).toFixed(1)}秒`
          );
          console.log(`${"=".repeat(60)}`);
          console.log(`✅ 分析完了`);
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

// テキストからJSONを抽出する関数
function extractJsonFromText(text: string): EvaluationResult | null {
  try {
    // textが文字列でない場合は早期リターン
    if (typeof text !== "string") {
      return null;
    }

    // 複数の方法でJSONを抽出

    // 方法1: 直接JSONとしてパース
    if (text.trim().startsWith("{")) {
      return JSON.parse(text);
    }

    // 方法2: JSON部分を正規表現で抽出
    const jsonMatch = text.match(/\{[\s\S]*"totalScore"[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // 方法3: ```json ブロックから抽出
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return JSON.parse(codeBlockMatch[1]);
    }

    // 方法4: 最初の { から最後の } までを抽出
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonString = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonString);
    }

    return null;
  } catch (error) {
    console.error("JSON解析エラー:", error);
    return null;
  }
}

// 評価結果を検証する関数
function validateEvaluationResult(data: any): data is EvaluationResult {
  if (!data || typeof data !== "object") return false;

  // 必須フィールドの確認
  if (
    typeof data.totalScore !== "number" ||
    data.totalScore < 0 ||
    data.totalScore > 100
  ) {
    return false;
  }

  if (!Array.isArray(data.items) || data.items.length !== 7) {
    return false;
  }

  // 各評価項目の検証
  for (const item of data.items) {
    if (
      !item.id ||
      !item.name ||
      typeof item.score !== "number" ||
      !item.positives ||
      !item.negatives
    ) {
      return false;
    }
  }

  if (typeof data.overallComment !== "string") {
    return false;
  }

  return true;
}

main().catch(console.error);
