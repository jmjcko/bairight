"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

interface ExtractedParam {
  id: string;
  name: string;
  category: string;
  suggestedComponent?: string;
  suggestedValues?: string[];
  rationale?: string;
}

interface ProductRunData {
  timestamp: string;
  matchedDomain?: string;
  parameters: ExtractedParam[];
  source?: string;
}

interface ProductHistory {
  name: string;
  baseline?: ProductRunData;
  latest?: ProductRunData;
  similarityScore?: number;
}

const DEFAULT_PRODUCTS = [
  "Elektrické auto",
  "Běžecké boty",
  "Pákový kávovar",
  "Ergonomická kancelářská židle",
  "Gravel / horské kolo",
  "Chytré sportovní hodinky",
  "Bezdrátová sluchátka s ANC",
  "Robotický vysavač",
  "Kombinovaný dětský kočárek",
  "Aku vrtačka / šroubovák",
];

function calculateSimilarity(p1?: ProductRunData, p2?: ProductRunData): number | undefined {
  if (!p1 || !p2) return undefined;
  const ids1 = new Set(p1.parameters.map((p) => p.id));
  const ids2 = new Set(p2.parameters.map((p) => p.id));

  let matchCount = 0;
  ids1.forEach((id) => {
    if (ids2.has(id)) matchCount++;
  });

  const union = new Set([...ids1, ...ids2]).size;
  if (union === 0) return 100;

  const idSim = (matchCount / union) * 100;
  const domainBonus = p1.matchedDomain === p2.matchedDomain ? 100 : 60;
  return Math.round(idSim * 0.8 + domainBonus * 0.2);
}

export default function LukeLabPage() {
  const [history, setHistory] = useState<Record<string, ProductHistory>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [customProductInput, setCustomProductInput] = useState("");
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

  // Initialize from LocalStorage or default product list
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bairight_luke_lab_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        const initial: Record<string, ProductHistory> = {};
        DEFAULT_PRODUCTS.forEach((p) => {
          initial[p] = { name: p };
        });
        setHistory(initial);
      }
    } catch {
      const initial: Record<string, ProductHistory> = {};
      DEFAULT_PRODUCTS.forEach((p) => {
        initial[p] = { name: p };
      });
      setHistory(initial);
    }
  }, []);

  const saveHistory = (newHistory: Record<string, ProductHistory>) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("bairight_luke_lab_history", JSON.stringify(newHistory));
    } catch {
      // Ignore quota storage issues
    }
  };

  const regenerateProduct = async (productName: string) => {
    setLoadingMap((prev) => ({ ...prev, [productName]: true }));
    setErrorMap((prev) => ({ ...prev, [productName]: "" }));

    try {
      const res = await fetch("/api/agent/research-parameters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: productName,
          locale: "cs",
          bypassCache: true, // STRICT REQUIREMENT: No pre-saved or cached results
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.analysis || !data.analysis.parameters) {
        throw new Error("Neplatná odpověď od engine");
      }

      const newRun: ProductRunData = {
        timestamp: new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        matchedDomain: data.analysis.matchedDomain,
        parameters: data.analysis.parameters,
        source: data.source || "luke_live",
      };

      setHistory((prev) => {
        const current = prev[productName] || { name: productName };
        let updatedBaseline = current.baseline;
        let updatedLatest: ProductRunData | undefined = newRun;

        if (!current.baseline) {
          // First run becomes baseline
          updatedBaseline = newRun;
          updatedLatest = undefined;
        } else {
          // If baseline already exists, current latest shifts to baseline, and newRun becomes latest
          if (current.latest) {
            updatedBaseline = current.latest;
          }
          updatedLatest = newRun;
        }

        const sim = calculateSimilarity(updatedBaseline, updatedLatest);
        const next = {
          ...prev,
          [productName]: {
            name: productName,
            baseline: updatedBaseline,
            latest: updatedLatest,
            similarityScore: sim,
          },
        };
        try {
          localStorage.setItem("bairight_luke_lab_history", JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err: any) {
      setErrorMap((prev) => ({ ...prev, [productName]: err.message || "Chyba generování" }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [productName]: false }));
    }
  };

  const regenerateAll = async () => {
    setIsBulkRunning(true);
    const keys = Object.keys(history);
    for (const key of keys) {
      await regenerateProduct(key);
    }
    setIsBulkRunning(false);
  };

  const handleAddCustomProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customProductInput.trim();
    if (!trimmed || history[trimmed]) return;

    const next = {
      ...history,
      [trimmed]: { name: trimmed },
    };
    saveHistory(next);
    setCustomProductInput("");
    regenerateProduct(trimmed);
  };

  const clearAllHistory = () => {
    if (confirm("Opravdu chcete vyresetovat historii srovnávání pro všechny produkty?")) {
      const reset: Record<string, ProductHistory> = {};
      DEFAULT_PRODUCTS.forEach((p) => {
        reset[p] = { name: p };
      });
      saveHistory(reset);
    }
  };

  // Metric computations
  const productEntries = Object.values(history);
  const scoredEntries = productEntries.filter((p) => typeof p.similarityScore === "number");
  const averageConsistency = scoredEntries.length > 0
    ? Math.round(scoredEntries.reduce((acc, curr) => acc + (curr.similarityScore || 0), 0) / scoredEntries.length)
    : null;

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-[#070d18]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 pl-4">
            <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold">
              LUKE LAB
            </span>
            <span className="text-xs text-slate-500 font-mono">
              v1.0 • NOINDEX
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-mono font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-md border border-slate-800 hover:border-slate-700 transition-colors"
          >
            ← Zpět do aplikace
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-xs font-mono font-medium">
            <span>LIVE LLM CONSISTENCY TESTING • ZERO CACHE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Luke Parameter Consistency Lab
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
            Interní ověřovací prostředí. Každé spuštění provolává živého Agenta Lukea bez použití jakékoliv mezipaměti.
            Můžete libovolný produkt přegenerovat samostatně a porovnat parametry mezi předchozím a novým během.
          </p>
        </div>

        {/* Global Action & Metrics Bar */}
        <div className="p-4 sm:p-5 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 block">
                Celková shoda sady
              </span>
              <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                averageConsistency && averageConsistency >= 90
                  ? "text-teal-400"
                  : averageConsistency
                  ? "text-amber-400"
                  : "text-slate-500"
              }`}>
                {averageConsistency !== null ? `${averageConsistency} %` : "Čeká na 2. běh"}
              </span>
            </div>

            <div className="border-l border-slate-800 pl-6">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 block">
                Porovnané produkty
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
                {scoredEntries.length} / {productEntries.length}
              </span>
            </div>

            <div className="border-l border-slate-800 pl-6 hidden sm:block">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 block">
                Striktní práh kvality
              </span>
              <span className="text-xs font-mono font-bold text-teal-400 block mt-1">
                ≥ 90 % SIMILARITY GATE
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={regenerateAll}
              disabled={isBulkRunning}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-mono text-xs font-bold transition-colors shadow-xs"
            >
              {isBulkRunning ? "Generuji všech 10 produktů..." : "↻ Přegenerovat všech 10"}
            </button>
            <button
              onClick={clearAllHistory}
              disabled={isBulkRunning}
              className="px-3.5 py-2 rounded-lg bg-slate-800/70 hover:bg-slate-700/70 text-slate-400 hover:text-white font-mono text-xs transition-colors border border-slate-700/50"
            >
              Vymazat historii
            </button>
          </div>
        </div>

        {/* Custom Product Add Field */}
        <form onSubmit={handleAddCustomProduct} className="flex gap-2 max-w-xl">
          <input
            type="text"
            value={customProductInput}
            onChange={(e) => setCustomProductInput(e.target.value)}
            placeholder="Zadejte název dalšího produktu k testování..."
            className="flex-1 bg-slate-900/60 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!customProductInput.trim() || isBulkRunning}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-cyan-400 font-mono text-xs font-bold rounded-lg border border-slate-700/60 transition-colors"
          >
            + Přidat do testu
          </button>
        </form>

        {/* Product Cards Grid */}
        <div className="space-y-6">
          {productEntries.map((prod, idx) => {
            const isLoading = loadingMap[prod.name];
            const error = errorMap[prod.name];
            const baseline = prod.baseline;
            const latest = prod.latest;
            const sim = prod.similarityScore;

            const baselineIds = new Set(baseline?.parameters.map((p) => p.id) || []);
            const latestIds = new Set(latest?.parameters.map((p) => p.id) || []);

            return (
              <div
                key={prod.name}
                className="rounded-xl border border-slate-800/90 bg-slate-900/30 overflow-hidden shadow-xs hover:border-slate-750 transition-colors"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 bg-slate-900/70 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      #{String(idx + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {prod.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-slate-400">
                          {latest?.matchedDomain || baseline?.matchedDomain || "Doména zatím nenačtena"}
                        </span>
                        {latest?.source && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                            {latest.source}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {typeof sim === "number" ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 font-mono text-xs">
                        <span className="text-slate-400">Konzistence:</span>
                        <span className={`font-bold ${sim >= 90 ? "text-teal-400" : "text-amber-400"}`}>
                          {sim} %
                        </span>
                      </div>
                    ) : baseline ? (
                      <span className="text-xs font-mono text-slate-500 px-3 py-1 rounded-full bg-slate-800/40 border border-slate-800">
                        1 běh (Čeká na srovnání)
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-slate-500">
                        Zatím nespuštěno
                      </span>
                    )}

                    <button
                      onClick={() => regenerateProduct(prod.name)}
                      disabled={isLoading || isBulkRunning}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/60 font-mono text-xs font-bold disabled:opacity-40 transition-colors"
                    >
                      {isLoading ? "Generuji..." : "↻ Přegenerovat"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-950/40 border-b border-red-900/50 text-red-400 text-xs font-mono">
                    Chyba generování: {error}
                  </div>
                )}

                {/* Diff Comparison View */}
                {!baseline && !latest && !isLoading ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">
                    Tento produkt ještě nebyl vygenerován. Klikněte na [ ↻ Přegenerovat ] pro provedení prvního živého běhu.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                    {/* Left Column: Baseline */}
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                          Předchozí běh {baseline?.timestamp && `(${baseline.timestamp})`}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {baseline?.parameters.length || 0} parametrů
                        </span>
                      </div>

                      {baseline ? (
                        <div className="space-y-2">
                          {baseline.parameters.map((param) => {
                            const isShared = latestIds.has(param.id);
                            return (
                              <div
                                key={param.id}
                                className={`p-2.5 rounded-lg border text-xs transition-colors ${
                                  latest
                                    ? isShared
                                      ? "bg-slate-900/80 border-slate-700/80 text-slate-200"
                                      : "bg-slate-900/30 border-slate-800/60 text-slate-500"
                                    : "bg-slate-900/80 border-slate-800 text-slate-300"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-white">
                                    {param.name}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">
                                    {param.suggestedComponent || "chips"}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  {param.rationale}
                                </div>
                                {latest && (
                                  <div className="mt-1.5 flex items-center gap-1.5">
                                    {isShared ? (
                                      <span className="text-[10px] font-mono text-teal-400 font-bold">
                                        ✓ Shodný v obou bězích
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-mono text-slate-500">
                                        - V novém běhu chybí
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 font-mono py-6 text-center">
                          Čeká na první spuštění...
                        </div>
                      )}
                    </div>

                    {/* Right Column: Latest */}
                    <div className="p-4 sm:p-5 space-y-3 bg-slate-950/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                          Nový běh {latest?.timestamp && `(${latest.timestamp})`}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {latest?.parameters.length || 0} parametrů
                        </span>
                      </div>

                      {latest ? (
                        <div className="space-y-2">
                          {latest.parameters.map((param) => {
                            const isShared = baselineIds.has(param.id);
                            return (
                              <div
                                key={param.id}
                                className={`p-2.5 rounded-lg border text-xs transition-colors ${
                                  isShared
                                    ? "bg-slate-900/80 border-teal-800/60 text-slate-200"
                                    : "bg-cyan-950/30 border-cyan-800/60 text-cyan-200"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-white">
                                    {param.name}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">
                                    {param.suggestedComponent || "chips"}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  {param.rationale}
                                </div>
                                <div className="mt-1.5 flex items-center gap-1.5">
                                  {isShared ? (
                                    <span className="text-[10px] font-mono text-teal-400 font-bold">
                                      ✓ Shodný v obou bězích
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono text-cyan-400 font-bold">
                                      + Nově formulovaný parametr
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 font-mono py-12 text-center">
                          {isLoading
                            ? "Generuji nový živý běh..."
                            : "Klikněte na [ ↻ Přegenerovat ] pro vytvoření 2. běhu a okamžité srovnání."}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
