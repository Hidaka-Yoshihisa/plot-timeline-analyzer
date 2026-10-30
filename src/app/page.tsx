"use client";

import React, { useState } from "react";
import PlotInputView from "@/components/PlotInputView";
import PlotTimelineView from "@/components/PlotTimelineView";
import { PlotAnalysisData } from "@/types/plot";
import { analyzePlotLocally } from "@/lib/analyzePlot";

type AppView = "input" | "timeline";

export default function HomePage() {
  const [view, setView] = useState<AppView>("input");
  const [plotText, setPlotText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<PlotAnalysisData | null>(
    null
  );

  const handleAnalyze = async () => {
    const trimmed = plotText.trim();
    if (!trimmed || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plot: trimmed }),
      });

      if (response.ok) {
        const json: PlotAnalysisData = await response.json();
        setAnalysisData(json);
      } else {
        setAnalysisData(analyzePlotLocally(trimmed));
      }
    } catch {
      setAnalysisData(analyzePlotLocally(trimmed));
    } finally {
      setIsAnalyzing(false);
      setView("timeline");
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const handleEditPlot = () => {
    setView("input");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleResetPlot = () => {
    setPlotText("");
    setAnalysisData(null);
    setView("input");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const resolvedAnalysisData =
    analysisData &&
    Array.isArray(analysisData.kishotenketsu) &&
    Array.isArray(analysisData.threeAct)
      ? analysisData
      : plotText.trim()
      ? analyzePlotLocally(plotText.trim())
      : null;

  if (view === "timeline" && resolvedAnalysisData) {
    return (
      <PlotTimelineView
        data={resolvedAnalysisData}
        onEditPlot={handleEditPlot}
        onResetPlot={handleResetPlot}
      />
    );
  }

  return (
    <PlotInputView
      plotText={plotText}
      onChangePlotText={setPlotText}
      onAnalyze={handleAnalyze}
      isAnalyzing={isAnalyzing}
    />
  );
}

