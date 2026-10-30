import {
  CharacterCorrelation,
  PhaseCharacterShift,
  PhaseSettingCheck,
  PlotAnalysisData,
  PlotPhase,
  TimelineFramework,
  WorldRuleAnalysis,
} from "@/types/plot";

type GenreTone = "battle" | "mystery" | "drama" | "scifi" | "general";

const KATAKANA_STOPWORDS = new Set([
  "プロット",
  "ストーリー",
  "タイムライン",
  "システム",
  "ルール",
  "スキル",
  "バトル",
  "モンスター",
  "ステータス",
  "レベル",
  "アイテム",
  "ダンジョン",
  "ギルド",
  "クラス",
  "ランク",
  "ポイント",
  "エネルギー",
  "データ",
  "プログラム",
  "ネットワーク",
  "ウイルス",
  "メモリ",
  "タイム",
  "ループ",
  "ゲーム",
  "ステージ",
  "クライマックス",
  "シーン",
  "テーマ",
  "モチーフ",
  "トリック",
  "ヒント",
  "ミスリード",
  "ヒロイン",
  "ライバル",
  "アンドロイド",
  "ロボット",
  "ヒーロー",
  "メンバー",
  "チーム",
  "グループ",
  "リーダー",
  "センター",
  "エリア",
  "ワールド",
  "マジック",
  "ソード",
  "シールド",
]);

function detectGenre(text: string): GenreTone {
  if (
    /(魔王|魔剣|魔法|能力|異能|最強|戦い|戦闘|敵|勇者|剣士|スキル|異世界|討伐|覚醒|バトル|怪物|呪い)/.test(
      text
    )
  ) {
    return "battle";
  }
  if (
    /(事件|犯人|謎|探偵|秘密|殺人|トリック|嘘|失踪|真相|手がかり|刑事|密室|アリバイ)/.test(
      text
    )
  ) {
    return "mystery";
  }
  if (
    /(AI|未来|宇宙|科学|システム|時間|ループ|タイム|都市|アンドロイド|実験|仮想|記憶操作|管理社会)/.test(
      text
    )
  ) {
    return "scifi";
  }
  if (
    /(恋|好き|告白|学校|家族|友人|約束|別れ|再会|日常|音楽|手紙|幼馴染|先輩|後輩)/.test(
      text
    )
  ) {
    return "drama";
  }
  return "general";
}

function detectCharacters(text: string): string[] {
  const found: string[] = [];
  const pushUnique = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !found.includes(trimmed)) {
      found.push(trimmed);
    }
  };

  // カタカナ固有名詞候補を抽出
  const katakanaMatches = text.match(/[ァ-ヶー]{2,8}/g) || [];
  for (const word of katakanaMatches) {
    if (!KATAKANA_STOPWORDS.has(word)) {
      pushUnique(word);
    }
    if (found.length >= 4) break;
  }

  // 役割名詞の検出
  const roleCandidates = [
    "主人公",
    "勇者",
    "少年",
    "少女",
    "相棒",
    "師匠",
    "幼馴染",
    "ヒロイン",
    "ライバル",
    "魔王",
    "王女",
    "騎士",
    "魔女",
    "探偵",
    "刑事",
    "犯人",
    "科学者",
    "アンドロイド",
    "兄",
    "妹",
    "姉",
    "弟",
    "友人",
    "先輩",
    "後輩",
  ];

  for (const role of roleCandidates) {
    if (text.includes(role)) {
      pushUnique(role);
    }
    if (found.length >= 4) break;
  }

  if (found.length === 0) {
    return ["主人公", "対立者・重要人物"];
  }
  if (found.length === 1) {
    return [found[0], "周囲の重要人物"];
  }
  return found;
}

function extractSettingPremise(text: string, genre: GenreTone): string {
  const sentences = text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[。！？!?])\s*|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const ruleSentence = sentences.find((s) =>
    /(能力|魔法|ルール|条件|代償|世界|禁忌|システム|契約|呪い|力|ループ|記憶|法則|制度|技術)/.test(
      s
    )
  );

  if (ruleSentence) {
    const snippet =
      ruleSentence.length > 95
        ? `${ruleSentence.slice(0, 95)}…`
        : ruleSentence;
    return `プロット内の前提設定：「${snippet}」を軸に世界観・能力ルールが構築されています。`;
  }

  const fallbackByGenre: Record<GenreTone, string> = {
    battle:
      "戦闘力・異能または武器の優劣と、それに伴う制約・成長段階が世界観の基軸となっています。",
    mystery:
      "事件を取り巻く情報開示の非対称性と、登場人物が共有する空間・時間上の制約がルールの核となっています。",
    scifi:
      "世界を規定するテクノロジーや社会システムと、その運用ルール・例外条件が物語の土台となっています。",
    drama:
      "登場人物が置かれた生活環境・立場・暗黙の約束事が、行動を縛る実質的なルールとして機能しています。",
    general:
      "主人公を取り巻く環境条件と、目的達成のために乗り越えるべき制約が物語の前提ルールを成しています。",
  };

  return fallbackByGenre[genre];
}

function splitIntoFour(rawPlot: string): [string, string, string, string] {
  const cleaned = rawPlot.trim().replace(/\r\n/g, "\n");

  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length >= 4) {
    const size = paragraphs.length;
    const p1 = Math.max(1, Math.floor(size * 0.25));
    const p2 = Math.max(p1 + 1, Math.floor(size * 0.5));
    const p3 = Math.max(p2 + 1, Math.floor(size * 0.75));
    return [
      paragraphs.slice(0, p1).join(" "),
      paragraphs.slice(p1, p2).join(" "),
      paragraphs.slice(p2, p3).join(" "),
      paragraphs.slice(p3).join(" "),
    ];
  }

  const sentences = cleaned
    .split(/(?<=[。！？!?])\s*|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length >= 4) {
    const size = sentences.length;
    const s1 = Math.max(1, Math.round(size * 0.25));
    const s2 = Math.max(s1 + 1, Math.round(size * 0.5));
    const s3 = Math.max(s2 + 1, Math.round(size * 0.75));
    return [
      sentences.slice(0, s1).join(""),
      sentences.slice(s1, s2).join(""),
      sentences.slice(s2, s3).join(""),
      sentences.slice(s3).join(""),
    ];
  }

  if (sentences.length === 3) {
    return [
      sentences[0],
      sentences[1],
      `${sentences[2]} その過程で前提を揺るがす最大の障壁が生じ、主人公は決定的な選択を迫られる。`,
      `転換点での決断を経て核心の対立に決着がつき、物語の冒頭とは異なる新たな関係性と景色へ着地する。`,
    ];
  }

  if (sentences.length === 2) {
    return [
      sentences[0],
      `発端を受けて主人公は行動を開始し、周囲の人物との関わりや世界観のルールが段階的に明らかになる。`,
      sentences[1],
      `最大の局面を越えて葛藤に決着がつき、選択がもたらした変化と余韻が描かれる。`,
    ];
  }

  const seed = sentences[0] || cleaned;
  return [
    `${seed} —— 日常の均衡が崩れ、主人公が物語の渦中へ踏み出す発端が描かれる。`,
    `主人公は目的へ向けて行動を重ね、関係性の広がりとともに世界観のルールや対立軸が鮮明になっていく。`,
    `これまでの前提や優位性が覆る最大の転換点が発生し、最も厳しい条件下での決断を迫られる。`,
    `転換点での選択を通じて核心の課題に決着をつけ、登場人物たちの関係性が新たな均衡へ収束する。`,
  ];
}

function splitIntoThreeActs(rawPlot: string): [string, string, string] {
  const cleaned = rawPlot.trim().replace(/\r\n/g, "\n");

  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 3) {
    return [paragraphs[0], paragraphs[1], paragraphs[2]];
  }

  if (paragraphs.length >= 4) {
    const size = paragraphs.length;
    const a1 = Math.max(1, Math.round(size * 0.25));
    const a2 = Math.max(a1 + 1, Math.round(size * 0.75));
    return [
      paragraphs.slice(0, a1).join(" "),
      paragraphs.slice(a1, a2).join(" "),
      paragraphs.slice(a2).join(" "),
    ];
  }

  const sentences = cleaned
    .split(/(?<=[。！？!?])\s*|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 3) {
    return [sentences[0], sentences[1], sentences[2]];
  }

  if (sentences.length >= 4) {
    const size = sentences.length;
    const s1 = Math.max(1, Math.round(size * 0.25));
    const s2 = Math.max(s1 + 1, Math.round(size * 0.75));
    return [
      sentences.slice(0, s1).join(""),
      sentences.slice(s1, s2).join(""),
      sentences.slice(s2).join(""),
    ];
  }

  if (sentences.length === 2) {
    return [
      sentences[0],
      `発端を契機に主人公は試練と対立の渦中へ進み、中間点での転換を経て最大の危機に直面する。`,
      sentences[1],
    ];
  }

  const seed = sentences[0] || cleaned;
  return [
    `${seed} —— 世界観と主人公の欠落が提示され、物語を動かす発端事件（インサイティング・インシデント）が起きる。`,
    `主人公は目的を追う中で協力や衝突を経験し、中盤の転換点（ミッドポイント）を経て最大の危機へと追い込まれる。`,
    `極限状態での決断によってクライマックスの対立に決着をつけ、内面的成長とともに新たな日常へ帰還する。`,
  ];
}

function buildCharacterCorrelations(
  chars: string[],
  genre: GenreTone
): CharacterCorrelation[] {
  const c1 = chars[0];
  const c2 = chars[1];
  const c3 = chars[2];

  const correlations: CharacterCorrelation[] = [];

  if (genre === "battle") {
    correlations.push({
      pair: `${c1} ⇄ ${c2}`,
      relation: "背中を預ける共闘関係、あるいは実力差を映し出す対照軸",
      emotionalArc:
        "初期の警戒・実力差への焦燥 → 危機の共有による相互理解 → 互いの欠落を補完し合う揺るぎない信頼",
    });
    if (c3) {
      correlations.push({
        pair: `${c1} ⇄ ${c3}`,
        relation: "価値観と力の証明を賭けて激突する対立軸・障壁",
        emotionalArc:
          "圧倒的な畏怖・反発 → 相手の信念や背景への理解 → 敬意を含んだ全力の決着",
      });
    } else {
      correlations.push({
        pair: `${c1} ⇄ 敵対勢力・宿敵`,
        relation: "主人公の信念と能力の限界を試す最大の障壁",
        emotionalArc:
          "一方的な脅威への恐れ → 敗北や喪失を経た執念 → 恐怖を乗り越えた対等な対峙",
      });
    }
  } else if (genre === "mystery") {
    correlations.push({
      pair: `${c1} ⇄ ${c2}`,
      relation: "情報を共有しつつも完全には手の内を見せない探り合いの関係",
      emotionalArc:
        "冷静な観察と微かな疑念 → 仮説崩壊に伴う動揺 → 真相到達時の痛みを伴う理解",
    });
    if (c3) {
      correlations.push({
        pair: `${c1} ⇄ ${c3}`,
        relation: "事件の核心・秘密を巡る追跡者と当事者",
        emotionalArc:
          "不可解な違和感 → 決定的な矛盾の発覚 → 動機への共感と断罪の葛藤",
      });
    }
  } else if (genre === "scifi") {
    correlations.push({
      pair: `${c1} ⇄ ${c2}`,
      relation: "世界のシステム・ルールに対する立場の違いを抱えた伴走関係",
      emotionalArc:
        "役割上の無機質な協力 → ルール外の感情の芽生え → システムよりも個人の尊厳を選び取る連帯",
    });
    if (c3) {
      correlations.push({
        pair: `${c1} ⇄ ${c3}`,
        relation: "世界の秩序維持と変革を巡る思想的対立",
        emotionalArc: "理念への疑問 → 取り返しのつかない決裂 → 異なる正義の認識",
      });
    }
  } else {
    correlations.push({
      pair: `${c1} ⇄ ${c2}`,
      relation: "物語の中心で互いの内面変化を引き起こす相互作用の関係",
      emotionalArc:
        "遠慮や無理解を含んだ距離感 → すれ違いと衝突による痛み → 本音を開示した上での新しい関係性",
    });
    if (c3) {
      correlations.push({
        pair: `${c1} ⇄ ${c3}`,
        relation: "主人公の選択に揺さぶりをかける第三の視点・触媒",
        emotionalArc:
          "受動的な関わり → 価値観を問われる対立 → 旅立ち・自立を見届ける距離",
      });
    }
  }

  return correlations;
}

function buildWorldSettingAnalysis(
  rawPlot: string,
  genre: GenreTone
): WorldRuleAnalysis {
  const detectedPremise = extractSettingPremise(rawPlot, genre);

  const byGenre: Record<
    GenreTone,
    { contradictions: string[]; improvements: string[] }
  > = {
    battle: {
      contradictions: [
        "能力や武器の出力上限・発動条件が曖昧なままだと、「なぜ最初から全力を使わなかったのか」「なぜ敵が即座に排除しなかったのか」という戦術上の矛盾が生じます。",
        "中盤以降のパワーアップが既存の独自ルールを上書きしてしまうと、序盤で積み上げた緊張感や世界観の法則性が損なわれます。",
      ],
      improvements: [
        "能力・魔法・スキルには「発動条件」「使用コスト（代償）」「明確な弱点（無効化される条件）」の3点をセットで定義し、序盤の小競り合いで読者に視覚的に提示してください。",
        "終盤の逆転劇は新ルールの追加ではなく、「既出ルールの盲点や逆用」によって成立させると設定の説得力が飛躍的に高まります。",
      ],
    },
    mystery: {
      contradictions: [
        "トリックや秘密を成立させるための独自環境・ルールが「犯人にとって都合よく機能しすぎていないか」の検証が必要です。",
        "登場人物が知り得る情報の範囲（視点制限）と、推理で導き出す結論の間に論理の飛躍が起きやすい構造です。",
      ],
      improvements: [
        "事件や謎に関わる空間ルール・時間制約を第1幕の段階でさりげなく明示し、読者も同じ前提ルールの上で推理できるフェアな構造を整えてください。",
        "特殊な設定を用いる場合ほど、「その設定によって犯人自身も縛られてしまった痕跡」を手がかりとして残すと緻密さが増します。",
      ],
    },
    scifi: {
      contradictions: [
        "基幹テクノロジーや独自ルールが社会全体に普及している場合、人々の日常行動や法制度が現代のまま描かれると世界観に乖離が生じます。",
        "システムの管理能力が高すぎる設定に対し、主人公たちが検知を逃れて行動できる理由が不足しがちです。",
      ],
      improvements: [
        "独自ルールが「日常のささやかな習慣や価値観」をどう変えているかを1シーン描くだけで、世界観のリアリティが強固になります。",
        "システムの完璧さではなく「設計思想ゆえの死角（想定外の人間的行動）」を突破口として定義してください。",
      ],
    },
    drama: {
      contradictions: [
        "登場人物を縛る環境（学校・職場・家族・地域社会の暗黙ルール）の拘束力が弱いと、「すぐに離れれば解決するのでは」と読者に感じられる懸念があります。",
        "時間経過や季節感と、キャラクターの心情変化のスピードが噛み合っていない箇所がないか注意が必要です。",
      ],
      improvements: [
        "主人公がその場所や関係性に留まらざるを得ない「外的制約」または「内面的な執着の理由」を冒頭で丁寧に定義してください。",
        "二人の間だけの小さな約束事（独自ルール）を作り、それが守られる／破られることで感情の変化を可視化すると印象的になります。",
      ],
    },
    general: {
      contradictions: [
        "物語特有のルールや前提条件が後半の展開に合わせて柔軟に変わりすぎると、危機の深刻さが伝わりにくくなります。",
        "主人公に与えられた特別な立場・能力と、周囲の社会や人物の反応のバランスに不自然さが出ないか確認が必要です。",
      ],
      improvements: [
        "物語の中で「絶対に覆らない前提ルール」を1つ定め、登場人物全員がその制約の中で最善を尽くす構造にすると緊張感が持続します。",
        "設定の説明は地の文や長台詞で語らず、ルールを破った際の小さなペナルティやトラブルを通して体験的に描写してください。",
      ],
    },
  };

  return {
    detectedPremise,
    contradictions: byGenre[genre].contradictions,
    improvements: byGenre[genre].improvements,
  };
}

export function analyzePlotLocally(rawPlot: string): PlotAnalysisData {
  const genre = detectGenre(rawPlot);
  const chars = detectCharacters(rawPlot);
  const c1 = chars[0];
  const c2 = chars[1];

  const paragraphs = rawPlot
    .trim()
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .filter(Boolean);

  const recommendedFramework: TimelineFramework =
    paragraphs.length === 3 || /(第一幕|第二幕|第三幕|三幕)/.test(rawPlot)
      ? "three_act"
      : "kishotenketsu";

  const [segKi, segSho, segTen, segKetsu] = splitIntoFour(rawPlot);
  const [act1, act2, act3] = splitIntoThreeActs(rawPlot);

  const kiChar: PhaseCharacterShift = {
    relationshipDynamic: `${c1}の現在の立ち位置と、${c2}との初期距離感（非対称な関係や未理解）が提示される段階。`,
    emotionalShift: "日常への微かな閉塞感・警戒 → 出来事を契機とした動揺と関心",
  };
  const shoChar: PhaseCharacterShift = {
    relationshipDynamic: `行動を共にする、あるいは対峙を重ねる中で、${c1}と${c2}の主導権や影響力が揺れ動く段階。`,
    emotionalShift: "探り合い・一時的な反発 → 共通経験を通じた信頼または執着の深化",
  };
  const tenChar: PhaseCharacterShift = {
    relationshipDynamic: `前提の崩壊により関係性に最大の負荷がかかり、互いの本音や譲れない価値観が露わになる局面。`,
    emotionalShift: "信頼の揺らぎ・喪失への恐怖 → 痛みを引き受けた上での覚悟の確立",
  };
  const ketsuChar: PhaseCharacterShift = {
    relationshipDynamic: `試練を経た結果として、${c1}と${c2}が冒頭とは異なる対等または新たな距離感へ到達する段階。`,
    emotionalShift: "極限の緊張からの解放 → 受容と静かな余韻",
  };

  const settingByPhase: Record<
    "ki" | "sho" | "ten" | "ketsu",
    PhaseSettingCheck
  > = {
    ki: {
      contradictions: [
        "導入で提示される能力・世界観ルールの「できること／できないこと」の境界が曖昧だと、後の危機の深刻さが測りにくくなります。",
        "初期のトラブルに対して既存の社会制度や周囲の強者が介入しない理由に不自然さがないか確認が必要です。",
      ],
      improvements: [
        "世界観の独自ルールや能力の制約を、説明台詞ではなく小さな行動結果として1つ印象的に見せてください。",
        `${c1}が抱える欠落と、世界観上の制約が重なり合うように設計すると導入の没入感が高まります。`,
      ],
    },
    sho: {
      contradictions: [
        "新たな設定・能力・協力者が増える過程で、序盤に示したパワーバランスや前提コストが軽視されていないか注意が必要です。",
        "主人公側に都合よく情報や突破口が集まりすぎると、対立側の知略や脅威度が低下します。",
      ],
      improvements: [
        "能力やルールを活用して小目標を達成する際にも、必ず「小さな代償や副作用」を描き、第3幕への伏線として蓄積してください。",
        `${c2}ならではの視点や能力が、${c1}の欠点を補う構造を1シーン入れると相関の必然性が強まります。`,
      ],
    },
    ten: {
      contradictions: [
        "最大のピンチを作るために登場人物が急に不合理な判断を下すと、これまでの能力・経験設定と矛盾します。",
        "危機打開の糸口が「これまで一度も示唆されていない新設定」になると、ご都合主義の印象を与えます。",
      ],
      improvements: [
        "窮地の原因を「これまで強みだった能力・ルールの裏目を突かれる構造」にすると、設定とドラマが美しく噛み合います。",
        "感情の衝突と設定上の限界点を同じ場面に重ねることで、クライマックスへの推進力が最大化します。",
      ],
    },
    ketsu: {
      contradictions: [
        "決着後に、本来支払うべきだった能力の代償や世界観上の制約がうやむやになっていないか検証が必要です。",
        "すべての謎や対立を台詞だけで急いで回収すると、感情の余韻が薄れます。",
      ],
      improvements: [
        "既存のルールを破るのではなく、ルールと代償を引き受けた上での「1手の上回り」で決着をつけると高い納得感が残ります。",
        `冒頭と対になるモチーフを通じて、${c1}と${c2}の感情変化を静かな行動で締めくくってください。`,
      ],
    },
  };

  const kishotenketsu: PlotPhase[] = [
    {
      id: "ki",
      code: "起",
      name: "起 — 発端と日常の揺らぎ",
      synopsis: segKi,
      character: kiChar,
      setting: settingByPhase.ki,
    },
    {
      id: "sho",
      code: "承",
      name: "承 — 展開と関係性の深化",
      synopsis: segSho,
      character: shoChar,
      setting: settingByPhase.sho,
    },
    {
      id: "ten",
      code: "転",
      name: "転 — 転換と最大の障壁",
      synopsis: segTen,
      character: tenChar,
      setting: settingByPhase.ten,
    },
    {
      id: "ketsu",
      code: "結",
      name: "結 — 決着と余韻",
      synopsis: segKetsu,
      character: ketsuChar,
      setting: settingByPhase.ketsu,
    },
  ];

  const threeAct: PlotPhase[] = [
    {
      id: "act-1",
      code: "第一幕",
      name: "第一幕 — 設定と発端（Setup）",
      synopsis: act1,
      character: {
        relationshipDynamic: `${c1}の日常的立場と${c2}との出会いが描かれ、物語を動かす初期の関係軸が定まる段階。`,
        emotionalShift: "現状への違和感・逡巡 → 退路を断ち渦中へ踏み出す決意",
      },
      setting: {
        contradictions: settingByPhase.ki.contradictions,
        improvements: settingByPhase.ki.improvements,
      },
    },
    {
      id: "act-2",
      code: "第二幕",
      name: "第二幕 — 対立と葛藤（Confrontation）",
      synopsis: act2,
      character: {
        relationshipDynamic: `試練の連続と中間点（ミッドポイント）の転換を通じ、${c1}と${c2}の信頼・対立が大きく揺さぶられる中心幕。`,
        emotionalShift:
          "模索と一時的な高揚 → 前提崩壊による孤立・葛藤 → 核心と向き合う覚悟",
      },
      setting: {
        contradictions: [
          settingByPhase.sho.contradictions[0],
          settingByPhase.ten.contradictions[0],
        ],
        improvements: [
          settingByPhase.sho.improvements[0],
          settingByPhase.ten.improvements[0],
        ],
      },
    },
    {
      id: "act-3",
      code: "第三幕",
      name: "第三幕 — 解決と結末（Resolution）",
      synopsis: act3,
      character: ketsuChar,
      setting: settingByPhase.ketsu,
    },
  ];

  const overallByGenre: Record<GenreTone, string> = {
    battle:
      "推進力のある対立構造を備えています。能力・独自ルールの「制約と代償」を序盤から一貫させつつ、戦闘の勝敗とキャラクター同士の感情変化を連動させることで、より深いカタルシスが生まれます。",
    mystery:
      "謎が物語を牽引する骨格が明確です。世界観・現場のルールを読者にフェアに提示しながら、真相解明がそのまま登場人物の関係性と感情の決定的な変化へ繋がる設計を意識すると完成度が際立ちます。",
    scifi:
      "世界観システムと個人のドラマが交差する構成です。独自ルール・技術制約の境界条件を厳密に保つほど、その制約の中で揺れ動くキャラクターの感情が鮮やかに浮かび上がります。",
    drama:
      "人物の内面と関係性の変化が主軸として機能しています。キャラクターを縛る環境ルールや小さな約束事を明確に置くことで、静かな感情の揺らぎにも強い緊張感と必然性が宿ります。",
    general:
      "物語の骨格が整理されており、起承転結・三幕構成の双方から構造を俯瞰できます。設定上の制約（ルール）と人物間の感情曲線を同じ転換点で交差させると、クライマックスの説得力が一段高まります。",
  };

  return {
    recommendedFramework,
    overallCritique: overallByGenre[genre],
    kishotenketsu,
    threeAct,
    characterCorrelations: buildCharacterCorrelations(chars, genre),
    worldSettingAnalysis: buildWorldSettingAnalysis(rawPlot, genre),
  };
}
