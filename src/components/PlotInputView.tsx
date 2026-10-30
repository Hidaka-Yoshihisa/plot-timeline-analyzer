"use client";

import React, { useEffect, useRef } from "react";

interface PlotInputViewProps {
  plotText: string;
  onChangePlotText: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export default function PlotInputView({
  plotText,
  onChangePlotText,
  onAnalyze,
  isAnalyzing,
}: PlotInputViewProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(280, Math.min(el.scrollHeight, 560))}px`;
  }, [plotText]);

  const canSubmit = plotText.trim().length > 0 && !isAnalyzing;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      onAnalyze();
    }
  };

  return (
    <main className="min-h-dvh w-full flex items-center justify-center px-6 py-16 animate-gentle-fade">
      <div className="w-full max-w-2xl flex flex-col items-end gap-8">
        <textarea
          ref={textareaRef}
          value={plotText}
          onChange={(e) => onChangePlotText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAnalyzing}
          placeholder="物語のプロットを入力してください…"
          aria-label="プロット入力"
          className="w-full resize-none bg-transparent text-[#1c1917] placeholder:text-[#a8a29e] text-base sm:text-[17px] leading-[2] tracking-[0.02em] border-b border-[#e7e5e4] focus:border-[#78716c] focus:outline-none pb-6 transition-colors duration-300 disabled:opacity-50"
        />

        <button
          type="button"
          onClick={onAnalyze}
          disabled={!canSubmit}
          className="px-7 py-2.5 text-sm tracking-[0.12em] text-[#faf9f6] bg-[#1c1917] rounded-full transition-all duration-300 ease-out hover:bg-[#34302d] disabled:bg-[#e7e5e4] disabled:text-[#a8a29e] disabled:cursor-not-allowed cursor-pointer"
        >
          {isAnalyzing ? "分析中…" : "分析する"}
        </button>
      </div>
    </main>
  );
}

