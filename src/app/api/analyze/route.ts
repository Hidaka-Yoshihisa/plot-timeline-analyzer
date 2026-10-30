import { NextRequest, NextResponse } from "next/server";
import { analyzePlotLocally } from "@/lib/analyzePlot";
import { PlotAnalysisData } from "@/types/plot";

const PHASE_ITEM_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    code: {
      type: "string",
      description: "フェーズ記号（例：起・承・転・結、または 第一幕・第二幕・第三幕）",
    },
    name: {
      type: "string",
      description: "フェーズ名（例：起 — 発端と日常の揺らぎ / 第一幕 — 設定と発端）",
    },
    synopsis: {
      type: "string",
      description: "このフェーズの簡潔で読みやすいあらすじテキスト（横書き）",
    },
    character: {
      type: "object",
      properties: {
        relationshipDynamic: {
          type: "string",
          description: "このフェーズにおけるキャラクター間の関係性・距離感・主導権の動き",
        },
        emotionalShift: {
          type: "string",
          description: "感情の変化（例：警戒と反発 → 共通の危機を通じた歩み寄り）",
        },
      },
      required: ["relationshipDynamic", "emotionalShift"],
    },
    setting: {
      type: "object",
      properties: {
        contradictions: {
          type: "array",
          items: { type: "string" },
          description: "能力・世界観・独自ルール・パワーバランスの矛盾点や懸念事項",
        },
        improvements: {
          type: "array",
          items: { type: "string" },
          description: "設定運用や展開・演出の具体的な改善案",
        },
      },
      required: ["contradictions", "improvements"],
    },
  },
  required: ["id", "code", "name", "synopsis", "character", "setting"],
};

const PLOT_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    recommendedFramework: {
      type: "string",
      enum: ["kishotenketsu", "three_act"],
      description: "入力プロットにより適した初期表示フレームワーク",
    },
    overallCritique: {
      type: "string",
      description: "物語全体の構造・キャラクター変化・設定整合性に関する簡潔で的確な総評",
    },
    kishotenketsu: {
      type: "array",
      description: "起・承・転・結の4フェーズ構成タイムライン",
      items: PHASE_ITEM_SCHEMA,
    },
    threeAct: {
      type: "array",
      description: "三幕構成（第一幕・第二幕・第三幕）の3フェーズ構成タイムライン",
      items: PHASE_ITEM_SCHEMA,
    },
    characterCorrelations: {
      type: "array",
      description: "主要キャラクター間の相関と物語全体を通じた感情の変化",
      items: {
        type: "object",
        properties: {
          pair: {
            type: "string",
            description: "対象キャラクター間の表記（例：主人公 ⇄ 相棒）",
          },
          relation: {
            type: "string",
            description: "関係性・相関の定義",
          },
          emotionalArc: {
            type: "string",
            description: "序盤から終盤にかけての感情の推移",
          },
        },
        required: ["pair", "relation", "emotionalArc"],
      },
    },
    worldSettingAnalysis: {
      type: "object",
      description: "作品全体の設定（能力・世界観・独自のルール）の検証",
      properties: {
        detectedPremise: {
          type: "string",
          description: "プロットから読み取れる能力・世界観・独自ルールの核",
        },
        contradictions: {
          type: "array",
          items: { type: "string" },
          description: "能力・世界観・独自ルールにおける矛盾リスクや穴",
        },
        improvements: {
          type: "array",
          items: { type: "string" },
          description: "設定や独自ルールの説得力を高める改善点",
        },
      },
      required: ["detectedPremise", "contradictions", "improvements"],
    },
  },
  required: [
    "recommendedFramework",
    "overallCritique",
    "kishotenketsu",
    "threeAct",
    "characterCorrelations",
    "worldSettingAnalysis",
  ],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const plot = typeof body?.plot === "string" ? body.plot.trim() : "";

    if (!plot) {
      return NextResponse.json(
        { error: "プロットテキストを入力してください。" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/interactions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
              "Api-Revision": "2026-05-20",
            },
            body: JSON.stringify({
              model: "gemini-3.8-flash",
              store: false,
              system_instruction:
                "あなたは熟練した小説・漫画の編集者兼スクリプトドクターです。入力されたプロットを分析し、(1) 起承転結および三幕構成の両方のタイムライン、(2) キャラクター間の相関と感情の変化、(3) 設定（能力・世界観・独自のルール・パワーバランス）の矛盾点と改善案を、指定されたJSON形式で日本語出力してください。",
              input: `以下のプロットを分析してください:\n\n${plot}`,
              response_format: {
                type: "text",
                mime_type: "application/json",
                schema: PLOT_ANALYSIS_SCHEMA,
              },
            }),
          }
        );

        if (res.ok) {
          const raw = await res.json();
          const steps = Array.isArray(raw?.steps) ? raw.steps : [];
          let outputText = "";
          for (let i = steps.length - 1; i >= 0; i--) {
            if (
              steps[i]?.type === "model_output" &&
              Array.isArray(steps[i]?.content)
            ) {
              const textPart = steps[i].content.find(
                (c: { type?: string; text?: string }) =>
                  c?.type === "text" && typeof c.text === "string"
              );
              if (textPart) {
                outputText = textPart.text;
                break;
              }
            }
          }

          if (outputText) {
            const parsed: PlotAnalysisData = JSON.parse(outputText);
            if (
              Array.isArray(parsed?.kishotenketsu) &&
              parsed.kishotenketsu.length > 0 &&
              Array.isArray(parsed?.threeAct) &&
              parsed.threeAct.length > 0
            ) {
              return NextResponse.json(parsed);
            }
          }
        }
      } catch {
        // API未設定または通信エラー時はローカル分析へフォールバック
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 650));
    const result = analyzePlotLocally(plot);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "分析処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
