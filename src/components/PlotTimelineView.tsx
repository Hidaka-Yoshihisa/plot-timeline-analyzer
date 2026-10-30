"use client";

import React, { useEffect, useState } from "react";
import { PlotAnalysisData, TimelineFramework } from "@/types/plot";

interface PlotTimelineViewProps {
  data: PlotAnalysisData;
  onEditPlot: () => void;
  onResetPlot: () => void;
}

type DrawerTab = "characters" | "settings" | "overall" | null;

export default function PlotTimelineView({
  data,
  onEditPlot,
  onResetPlot,
}: PlotTimelineViewProps) {
  const [framework, setFramework] = useState<TimelineFramework>(
    data.recommendedFramework || "kishotenketsu"
  );
  const [openPhaseIds, setOpenPhaseIds] = useState<Set<string>>(new Set());
  const [canvasMenuOpen, setCanvasMenuOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<DrawerTab>(null);

  useEffect(() => {
    setFramework(data.recommendedFramework || "kishotenketsu");
    setOpenPhaseIds(new Set());
    setCanvasMenuOpen(false);
    setActiveDrawer(null);
  }, [data]);

  const phases =
    framework === "three_act" ? data.threeAct : data.kishotenketsu;

  const isNavVisible = openPhaseIds.size > 0 || canvasMenuOpen;
  const allExpanded =
    phases.length > 0 && phases.every((p) => openPhaseIds.has(p.id));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenPhaseIds(new Set());
        setCanvasMenuOpen(false);
        setActiveDrawer(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const togglePhase = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const selection = window.getSelection()?.toString();
    if (selection && selection.length > 0) return;

    setOpenPhaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      if (next.size === 0) {
        setCanvasMenuOpen(false);
        setActiveDrawer(null);
      }
      return next;
    });
  };

  const handleCanvasClick = () => {
    const selection = window.getSelection()?.toString();
    if (selection && selection.length > 0) return;

    if (isNavVisible) {
      setOpenPhaseIds(new Set());
      setCanvasMenuOpen(false);
      setActiveDrawer(null);
    } else {
      setCanvasMenuOpen(true);
    }
  };

  const handleSwitchFramework = (nextFramework: TimelineFramework) => {
    if (nextFramework === framework) return;
    const nextPhases =
      nextFramework === "three_act" ? data.threeAct : data.kishotenketsu;

    setFramework(nextFramework);
    if (allExpanded) {
      setOpenPhaseIds(new Set(nextPhases.map((p) => p.id)));
    } else {
      setOpenPhaseIds(new Set());
      setCanvasMenuOpen(true);
    }
  };

  const handleJumpToPhase = (id: string) => {
    setOpenPhaseIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleToggleAll = () => {
    if (allExpanded) {
      setOpenPhaseIds(new Set());
      setCanvasMenuOpen(false);
      setActiveDrawer(null);
    } else {
      setOpenPhaseIds(new Set(phases.map((p) => p.id)));
    }
  };

  const toggleDrawerTab = (tab: Exclude<DrawerTab, null>) => {
    setActiveDrawer((prev) => (prev === tab ? null : tab));
  };

  return (
    <div
      onClick={handleCanvasClick}
      className="min-h-dvh w-full px-6 py-20 sm:py-28 pb-52 flex justify-center cursor-default"
    >
      {/* タイムライン本体：分析完了直後はフェーズ名とあらすじのみを表示 */}
      <div className="w-full max-w-2xl">
        <ol
          key={framework}
          className="relative border-l border-[#e2dfdb] ml-2 sm:ml-4 space-y-14 sm:space-y-16"
        >
          {phases.map((phase, index) => {
            const isOpen = openPhaseIds.has(phase.id);

            return (
              <li
                key={phase.id}
                id={phase.id}
                style={{ animationDelay: `${index * 80}ms` }}
                className="relative pl-8 sm:pl-11 animate-gentle-fade group"
              >
                {/* タイムライン上のノードドット */}
                <span
                  aria-hidden="true"
                  className={`absolute -left-[4.5px] top-[9px] h-[8px] w-[8px] rounded-full border transition-all duration-400 ${
                    isOpen
                      ? "bg-[#1c1917] border-[#1c1917] scale-110"
                      : "bg-[#faf9f6] border-[#a8a29e] group-hover:border-[#57534e]"
                  }`}
                />

                {/* タップ対象領域（フェーズ名＋あらすじ） */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={(e) => togglePhase(phase.id, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      togglePhase(
                        phase.id,
                        e as unknown as React.MouseEvent
                      );
                    }
                  }}
                  className="w-full text-left cursor-pointer focus:outline-none rounded-lg -mx-3 px-3 py-1 transition-colors duration-300 hover:bg-[#f3f1ec]/60"
                >
                  <h2 className="text-xs sm:text-[13px] font-medium tracking-[0.14em] text-[#78716c] mb-2.5 transition-colors duration-300 group-hover:text-[#1c1917]">
                    {phase.name}
                  </h2>

                  <p className="text-[15.5px] sm:text-[16.5px] leading-[1.95] tracking-[0.02em] text-[#1c1917] font-normal">
                    {phase.synopsis}
                  </p>
                </div>

                {/* タップ時のみフワッと出現するAI詳細フィードバック（アコーディオン） */}
                <div
                  data-open={isOpen}
                  onClick={(e) => e.stopPropagation()}
                  className={`accordion-grid ${isOpen ? "mt-6" : "mt-0"}`}
                >
                  <div className="accordion-inner">
                    <div className="pt-5 pb-2 border-t border-[#eae7e2] space-y-6 text-sm leading-[1.9] text-[#44403c]">
                      {/* キャラクター相関と感情の変化 */}
                      <section className="space-y-2">
                        <h3 className="text-[11px] tracking-[0.16em] text-[#78716c] font-medium">
                          キャラクター相関・感情の変化
                        </h3>
                        <div className="space-y-1.5 pl-3.5 border-l border-[#dcd8d2]">
                          <p className="text-[#292524]">
                            {phase.character.relationshipDynamic}
                          </p>
                          <p className="text-xs text-[#57534e]">
                            <span className="text-[#78716c] mr-2">感情推移:</span>
                            {phase.character.emotionalShift}
                          </p>
                        </div>
                      </section>

                      {/* 設定（能力・世界観・独自ルール）の矛盾点 */}
                      {phase.setting.contradictions.length > 0 && (
                        <section className="space-y-2">
                          <h3 className="text-[11px] tracking-[0.16em] text-[#78716c] font-medium">
                            設定・独自ルールの矛盾と懸念
                          </h3>
                          <ul className="space-y-2">
                            {phase.setting.contradictions.map((item, idx) => (
                              <li
                                key={idx}
                                className="pl-3.5 relative text-[#292524]"
                              >
                                <span
                                  aria-hidden="true"
                                  className="absolute left-0 top-[11px] w-1.5 h-[1px] bg-[#a8a29e]"
                                />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}

                      {/* 設定・展開の改善点 */}
                      {phase.setting.improvements.length > 0 && (
                        <section className="space-y-2">
                          <h3 className="text-[11px] tracking-[0.16em] text-[#78716c] font-medium">
                            設定・展開の改善案
                          </h3>
                          <ul className="space-y-2">
                            {phase.setting.improvements.map((item, idx) => (
                              <li
                                key={idx}
                                className="pl-3.5 relative text-[#292524]"
                              >
                                <span
                                  aria-hidden="true"
                                  className="absolute left-0 top-[11px] w-1.5 h-[1px] bg-[#57534e]"
                                />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* タップ駆動型のナビゲーションメニュー（項目タップ時のみフワッと出現） */}
      <nav
        aria-label="プロット操作ナビゲーション"
        aria-hidden={!isNavVisible}
        onClick={(e) => e.stopPropagation()}
        className={`fixed bottom-6 inset-x-0 z-30 flex justify-center px-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isNavVisible
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-2xl bg-[#faf9f6]/95 backdrop-blur-md border border-[#e2dfdb] rounded-2xl shadow-[0_8px_30px_rgb(28,25,23,0.06)] px-5 py-3.5">
          {/* 全体分析ドロワー（相関・感情 / 設定・ルール / 全体総評） */}
          <div
            data-open={activeDrawer !== null}
            className={`accordion-grid ${
              activeDrawer !== null ? "mb-3.5" : "mb-0"
            }`}
          >
            <div className="accordion-inner">
              <div className="pb-4 border-b border-[#eae7e2] max-h-[42vh] overflow-y-auto pr-1 space-y-4">
                {activeDrawer === "characters" && (
                  <div className="space-y-3">
                    <p className="text-[11px] tracking-[0.15em] text-[#78716c]">
                      キャラクター間の相関と感情の変化
                    </p>
                    <div className="space-y-3">
                      {data.characterCorrelations.map((corr, i) => (
                        <div
                          key={i}
                          className="pl-3 border-l border-[#dcd8d2] space-y-1"
                        >
                          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                            <span className="text-[13.5px] font-medium text-[#1c1917]">
                              {corr.pair}
                            </span>
                            <span className="text-xs text-[#78716c]">
                              {corr.relation}
                            </span>
                          </div>
                          <p className="text-[13px] leading-[1.8] text-[#44403c]">
                            {corr.emotionalArc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeDrawer === "settings" && (
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <p className="text-[11px] tracking-[0.15em] text-[#78716c]">
                        設定（能力・世界観・独自ルール）の前提
                      </p>
                      <p className="text-[13px] leading-[1.85] text-[#292524]">
                        {data.worldSettingAnalysis.detectedPremise}
                      </p>
                    </div>

                    {data.worldSettingAnalysis.contradictions.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] tracking-[0.15em] text-[#78716c]">
                          矛盾リスク・検証ポイント
                        </p>
                        <ul className="space-y-1.5 text-[13px] leading-[1.8] text-[#292524]">
                          {data.worldSettingAnalysis.contradictions.map(
                            (c, i) => (
                              <li key={i} className="pl-3 relative">
                                <span
                                  aria-hidden="true"
                                  className="absolute left-0 top-[10px] w-1.5 h-[1px] bg-[#a8a29e]"
                                />
                                {c}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {data.worldSettingAnalysis.improvements.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] tracking-[0.15em] text-[#78716c]">
                          設定・ルール設計の改善点
                        </p>
                        <ul className="space-y-1.5 text-[13px] leading-[1.8] text-[#292524]">
                          {data.worldSettingAnalysis.improvements.map(
                            (imp, i) => (
                              <li key={i} className="pl-3 relative">
                                <span
                                  aria-hidden="true"
                                  className="absolute left-0 top-[10px] w-1.5 h-[1px] bg-[#57534e]"
                                />
                                {imp}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeDrawer === "overall" && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] tracking-[0.15em] text-[#78716c]">
                      全体構造の総評
                    </p>
                    <p className="text-[13.5px] leading-[1.85] text-[#292524]">
                      {data.overallCritique}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 上段：構造切替（起承転結 / 三幕構成）＋ フェーズジャンプ */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#efede8] text-xs tracking-[0.08em]">
            {/* 起承転結 / 三幕構成 切替 */}
            <div
              role="group"
              aria-label="構成フレームワーク切替"
              className="inline-flex items-center bg-[#f2efe9] p-0.5 rounded-full"
            >
              <button
                type="button"
                onClick={() => handleSwitchFramework("kishotenketsu")}
                className={`px-3 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                  framework === "kishotenketsu"
                    ? "bg-[#1c1917] text-[#faf9f6]"
                    : "text-[#57534e] hover:text-[#1c1917]"
                }`}
              >
                起承転結
              </button>
              <button
                type="button"
                onClick={() => handleSwitchFramework("three_act")}
                className={`px-3 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                  framework === "three_act"
                    ? "bg-[#1c1917] text-[#faf9f6]"
                    : "text-[#57534e] hover:text-[#1c1917]"
                }`}
              >
                三幕構成
              </button>
            </div>

            {/* フェーズクイックジャンプ */}
            <div className="flex items-center gap-1">
              {phases.map((p) => {
                const active = openPhaseIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleJumpToPhase(p.id)}
                    className={`px-2.5 py-1 rounded-full transition-colors duration-200 cursor-pointer ${
                      active
                        ? "bg-[#1c1917] text-[#faf9f6]"
                        : "hover:bg-[#efede8] text-[#57534e]"
                    }`}
                  >
                    {p.code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 下段：全体分析アコーディオン切替 ＋ プロット操作 */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs tracking-[0.08em] text-[#57534e]">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => toggleDrawerTab("characters")}
                className={`transition-colors duration-200 cursor-pointer ${
                  activeDrawer === "characters"
                    ? "text-[#1c1917] font-medium underline underline-offset-4"
                    : "hover:text-[#1c1917]"
                }`}
              >
                相関・感情
              </button>

              <button
                type="button"
                onClick={() => toggleDrawerTab("settings")}
                className={`transition-colors duration-200 cursor-pointer ${
                  activeDrawer === "settings"
                    ? "text-[#1c1917] font-medium underline underline-offset-4"
                    : "hover:text-[#1c1917]"
                }`}
              >
                設定・ルール
              </button>

              <button
                type="button"
                onClick={() => toggleDrawerTab("overall")}
                className={`transition-colors duration-200 cursor-pointer ${
                  activeDrawer === "overall"
                    ? "text-[#1c1917] font-medium underline underline-offset-4"
                    : "hover:text-[#1c1917]"
                }`}
              >
                全体総評
              </button>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleToggleAll}
                className="hover:text-[#1c1917] transition-colors duration-200 cursor-pointer"
              >
                {allExpanded ? "すべて閉じる" : "すべて開く"}
              </button>

              <span aria-hidden="true" className="text-[#d6d3ce]">
                |
              </span>

              <button
                type="button"
                onClick={onEditPlot}
                className="hover:text-[#1c1917] transition-colors duration-200 cursor-pointer"
              >
                編集に戻る
              </button>

              <button
                type="button"
                onClick={onResetPlot}
                className="text-[#78716c] hover:text-[#1c1917] transition-colors duration-200 cursor-pointer"
              >
                新規
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
