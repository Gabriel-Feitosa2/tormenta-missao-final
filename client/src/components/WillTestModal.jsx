import React, { useState, useEffect, useRef } from "react";
import { useGame } from "../context/GameContext";
import {
  Flame,
  Skull,
  CheckCircle2,
  XCircle,
  X,
  Dices,
  FastForward,
} from "lucide-react";
import { NpcAvatar } from "./NpcAvatar";

export const WillTestModal = () => {
  const { state, activeWillTestResult, setActiveWillTestResult } = useGame();

  if (!activeWillTestResult) return null;

  const {
    dc,
    globalBonus,
    totalTargets,
    totalPassed,
    totalFailed,
    totalDied,
    results,
  } = activeWillTestResult;

  // Sequential Reveal Animation
  const [revealedCount, setRevealedCount] = useState(0);
  const activeCardRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!results || results.length === 0) return;
    setRevealedCount(0);

    // 850ms interval for suspenseful dramatic roll reveal
    const timer = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= results.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 850);

    return () => clearInterval(timer);
  }, [results]);

  // Auto-scroll down smoothly as cards are revealed
  useEffect(() => {
    if (activeCardRef.current) {
      activeCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [revealedCount]);

  const handleSkipAnimation = () => {
    setRevealedCount(results.length);
  };

  const isComplete = revealedCount >= results.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-6xl max-h-[92vh] medieval-panel rounded-2xl border-2 border-red-600 shadow-[0_0_60px_rgba(220,38,38,0.6)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-black via-red-950 to-black px-6 py-4 border-b-2 border-red-700 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-red-900 border-2 border-red-400 flex items-center justify-center shadow-lg">
              <Flame className="w-7 h-7 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white font-medieval tracking-wide">
                  TESTE DE VONTADE EM MASSA
                </h2>
                <span className="text-sm font-mono font-bold px-3 py-1 rounded-lg bg-red-950 border-2 border-amber-400 text-amber-300 shadow">
                  CD {dc}
                </span>
                {globalBonus !== undefined && globalBonus !== 0 && (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-950 border border-blue-400 text-blue-200 shadow">
                    Bônus Global:{" "}
                    {globalBonus >= 0 ? `+${globalBonus}` : globalBonus}
                  </span>
                )}
              </div>
              <p className="text-sm text-red-200 font-medium">
                A Tormenta testa a alma dos parceiros de Arton
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isComplete && (
              <button
                onClick={handleSkipAnimation}
                className="px-3.5 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer transition-all"
              >
                <FastForward className="w-4 h-4" /> Pular Animação
              </button>
            )}
            <button
              onClick={() => setActiveWillTestResult(null)}
              className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Results Metrics Banner */}
        <div className="bg-[#18070b] border-b-2 border-red-900 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 text-sm font-medieval">
          <div className="flex items-center gap-7 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-gray-300 font-bold">Testados:</span>
              <span className="font-mono font-black text-base text-white">
                {revealedCount}/{totalTargets}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-gray-300 font-bold">Sucessos:</span>
              <span className="font-mono font-black text-base text-emerald-400">
                {results.slice(0, revealedCount).filter((r) => r.passed).length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-amber-400" />
              <span className="text-gray-300 font-bold">Falhas:</span>
              <span className="font-mono font-black text-base text-amber-300">
                {
                  results.slice(0, revealedCount).filter((r) => !r.passed)
                    .length
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Skull className="w-5 h-5 text-red-500" />
              <span className="text-gray-300 font-bold">
                Mortos (3 Falhas):
              </span>
              <span className="font-mono font-black text-base text-red-500">
                {results.slice(0, revealedCount).filter((r) => r.isDead).length}
              </span>
            </div>
          </div>

          <span className="text-xs text-amber-300 font-sans font-semibold">
            * 3 falhas de Vontade causam morte e inutilização definitiva
          </span>
        </div>

        {/* Grid of Results with Auto-scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 p-5 overflow-y-auto scroll-smooth"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {results.map((res, index) => {
              const isRevealed = index < revealedCount;
              const isCurrentlyRolling = index === revealedCount;
              const npc = state?.npcs?.[res.npcId] || {
                id: res.npcId,
                name: res.npcName,
              };

              return (
                <div
                  key={res.npcId}
                  ref={isCurrentlyRolling ? activeCardRef : null}
                  className={`p-4 rounded-xl border-2 flex flex-col justify-between transition-all duration-500 ${
                    !isRevealed
                      ? isCurrentlyRolling
                        ? "bg-[#310c18] border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.7)] ring-2 ring-amber-400/80 scale-[1.03] z-10"
                        : "bg-[#100508] border-gray-900 opacity-25"
                      : res.isDead
                        ? "bg-red-950 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                        : !res.passed
                          ? "bg-[#270e17] border-amber-600 shadow-md"
                          : "bg-[#140b10] border-emerald-700/80 shadow-sm"
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <NpcAvatar npc={npc} size="md" />
                        <div className="min-w-0">
                          <h4 className="font-medieval font-bold text-base text-white truncate">
                            {res.npcName}
                          </h4>
                          <span className="text-xs text-amber-300 font-medium block truncate">
                            {res.ownerName}
                          </span>
                        </div>
                      </div>

                      {/* Status indicator */}
                      {!isRevealed ? (
                        isCurrentlyRolling ? (
                          <span className="px-2.5 py-1 bg-amber-950 border border-amber-400 text-amber-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow animate-pulse shrink-0">
                            <Dices className="w-4 h-4 animate-spin text-amber-300" />{" "}
                            Rolando...
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600 italic shrink-0">
                            Na fila...
                          </span>
                        )
                      ) : res.isImmune ? (
                        <span className="px-2.5 py-1 bg-purple-950 border-2 border-purple-500 text-purple-200 text-xs font-black rounded-lg shrink-0">
                          IMUNE
                        </span>
                      ) : res.isDead ? (
                        <span className="px-2.5 py-1 bg-red-900 border-2 border-red-400 text-white text-xs font-black rounded-lg flex items-center gap-1 animate-pulse shrink-0">
                          <Skull className="w-3.5 h-3.5" /> MORTO
                        </span>
                      ) : res.passed ? (
                        <span className="px-2.5 py-1 bg-emerald-950 border-2 border-emerald-500 text-emerald-300 text-xs font-black rounded-lg flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASSOU
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-950 border-2 border-amber-500 text-amber-200 text-xs font-black rounded-lg flex items-center gap-1 shrink-0">
                          <XCircle className="w-3.5 h-3.5" /> FALHA
                        </span>
                      )}
                    </div>

                    {/* Roll breakdown */}
                    {!isRevealed ? (
                      <div className="py-6 text-center text-xs flex flex-col items-center justify-center gap-2.5">
                        {isCurrentlyRolling ? (
                          <>
                            <NpcAvatar
                              npc={npc}
                              size="xl"
                              className="animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                            />
                            <span className="text-amber-300 font-bold tracking-wider animate-pulse text-sm">
                              Confrontando a Tormenta...
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-600">
                            Aguardando revelação...
                          </span>
                        )}
                      </div>
                    ) : res.isImmune ? (
                      <p className="text-xs text-purple-200 bg-purple-950/60 p-2.5 rounded-lg border border-purple-800 font-sans font-medium">
                        Totalmente imune aos efeitos corruptores da Tormenta.
                      </p>
                    ) : (
                      <div className="bg-black/80 p-3 rounded-lg border-2 border-red-950 text-sm space-y-1.5 font-sans">
                        <div className="flex items-center justify-between text-white font-mono font-bold">
                          <span>
                            d20 [{res.roll}] + {res.baseWill}
                            {res.globalBonus !== 0
                              ? ` ${res.globalBonus >= 0 ? `+ ${res.globalBonus}` : `- ${Math.abs(res.globalBonus)}`}`
                              : ""}
                          </span>
                          <span
                            className={`font-black text-base ${
                              res.passed ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            = {res.total}
                          </span>
                        </div>
                        <div className="text-xs text-gray-300 flex justify-between font-medium">
                          <span>vs CD {res.dc}</span>
                          <span className="font-bold">
                            {res.passed
                              ? `+${res.total - res.dc} acima da CD`
                              : `${res.total - res.dc} para passar`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Failure tracker footer */}
                  {isRevealed && !res.isImmune && (
                    <div className="mt-3 pt-2.5 border-t border-red-900/80 flex items-center justify-between text-xs">
                      <span className="text-xs text-gray-300 font-bold uppercase">
                        Falhas:
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((num) => (
                          <Skull
                            key={num}
                            className={`w-4 h-4 ${
                              res.newFailures >= num
                                ? "text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.9)]"
                                : "text-gray-700"
                            }`}
                          />
                        ))}
                        <span
                          className={`text-sm font-mono font-black ml-1 ${
                            res.newFailures >= 3
                              ? "text-red-500"
                              : res.newFailures === 2
                                ? "text-orange-400"
                                : "text-gray-300"
                          }`}
                        >
                          ({res.newFailures}/3)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#14060a] border-t-2 border-red-900 flex justify-end">
          <button
            onClick={() => setActiveWillTestResult(null)}
            className="px-8 py-3 medieval-button text-sm font-bold uppercase tracking-wider rounded-xl shadow-xl cursor-pointer"
          >
            Fechar Resultados
          </button>
        </div>
      </div>
    </div>
  );
};
