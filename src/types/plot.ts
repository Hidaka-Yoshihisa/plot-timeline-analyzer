export type TimelineFramework = "kishotenketsu" | "three_act";

export interface PhaseCharacterShift {
  /** このフェーズにおけるキャラクター間の関係性・距離感・主導権の動き */
  relationshipDynamic: string;
  /** 感情の変化（例：「警戒と反発 → 共通の危機を通じた歩み寄り」） */
  emotionalShift: string;
}

export interface PhaseSettingCheck {
  /** 能力・世界観・独自ルール・パワーバランスの矛盾点や懸念 */
  contradictions: string[];
  /** 設定の整合性や演出を引き上げる改善案 */
  improvements: string[];
}

export interface PlotPhase {
  id: string;
  /** フェーズ記号（起・承・転・結 または 第一幕・第二幕・第三幕） */
  code: string;
  /** フェーズ名（例：「起 — 発端と日常の揺らぎ」「第一幕 — 設定と発端」） */
  name: string;
  /** フェーズのあらすじ（横書きテキスト） */
  synopsis: string;
  /** タップ時に展開されるキャラクター相関・感情変化 */
  character: PhaseCharacterShift;
  /** タップ時に展開される設定（能力・世界観・独自ルール）の矛盾・改善点 */
  setting: PhaseSettingCheck;
}

export interface CharacterCorrelation {
  /** 人物ペアや対象（例：「主人公 ⇄ 相棒」） */
  pair: string;
  /** 相関・関係性の定義 */
  relation: string;
  /** 物語を通じた感情の推移 */
  emotionalArc: string;
}

export interface WorldRuleAnalysis {
  /** 読み取られた能力・世界観・独自ルールの前提 */
  detectedPremise: string;
  /** 設定・独自ルール全体の矛盾リスク */
  contradictions: string[];
  /** ルール設計・世界観の説得力を高める改善点 */
  improvements: string[];
}

export interface PlotAnalysisData {
  /** 初期表示として推奨される構成フレームワーク */
  recommendedFramework: TimelineFramework;
  /** 物語全体の構造・バランス総評 */
  overallCritique: string;
  /** 起承転結タイムライン（4フェーズ） */
  kishotenketsu: PlotPhase[];
  /** 三幕構成タイムライン（3フェーズ） */
  threeAct: PlotPhase[];
  /** 作品全体のキャラクター相関と感情の変化 */
  characterCorrelations: CharacterCorrelation[];
  /** 作品全体の設定（能力・世界観・独自ルール）の矛盾と改善点 */
  worldSettingAnalysis: WorldRuleAnalysis;
}
