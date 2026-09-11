import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ShieldAlert, Skull, CheckCircle2, X, Dices, FastForward } from 'lucide-react';
import { NpcAvatar } from './NpcAvatar';

export const CombatWoundsModal = () => {
  const { state, activeWoundsTestResult, setActiveWoundsTestResult } = useGame();

  if (!activeWoundsTestResult) return null;

  const { totalTested, diedCount, survivedCount, results } = activeWoundsTestResult;

  // Sequential Reveal Animation
  const [revealedCount, setRevealedCount] = useState(0);
  const activeCardRef = useRef(null);

  useEffect(() => {
    if (!results || results.length === 0) return;
    setRevealedCount(0);

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

  // Auto-scroll as cards reveal
  useEffect(() => {
    if (activeCardRef.current) {
      activeCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [revealedCount]);

  const handleSkipAnimation = () => {
    setRevealedCount(results.length);
  };

  const isComplete = revealedCount >= results.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl medieval-panel rounded-2xl border-2 border-red-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-black px-6 py-4 border-b-2 border-red-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-900 border border-amber-500">
              <ShieldAlert className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-medieval font-black text-xl text-white">
                Teste de Sobrevivência dos Feridos
              </h3>
              <p className="text-xs text-red-200/90 font-medium">
                Regra: Dado Ímpar = Morre de Fato | Dado Par = Sobrevive fora do combate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isComplete && (
              <button
                onClick={handleSkipAnimation}
                className="px-3 py-1 bg-red-950 hover:bg-red-900 border border-red-600 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow cursor-pointer transition-all"
              >
                <FastForward className="w-4 h-4" /> Pular
              </button>
            )}
            <button
              onClick={() => setActiveWoundsTestResult(null)}
              className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 font-sans scroll-smooth">
          <div className="flex items-center justify-around bg-[#140609] border-2 border-red-950 p-3.5 rounded-xl text-sm font-medieval">
            <div>
              <span className="text-gray-300 block text-xs font-bold uppercase">Total Testados:</span>
              <span className="font-mono font-black text-lg text-white">{totalTested}</span>
            </div>
            <div>
              <span className="text-emerald-400 block text-xs font-bold uppercase">Sobreviveram:</span>
              <span className="font-mono font-black text-lg text-emerald-400">
                {isComplete ? survivedCount : results.slice(0, revealedCount).filter((r) => r.survived).length}
              </span>
            </div>
            <div>
              <span className="text-red-400 block text-xs font-bold uppercase">Faleceram:</span>
              <span className="font-mono font-black text-lg text-red-500">
                {isComplete ? diedCount : results.slice(0, revealedCount).filter((r) => !r.survived).length}
              </span>
            </div>
          </div>

          {/* Sequential Cards */}
          <div className="space-y-3">
            {results.map((r, index) => {
              const isRevealed = index < revealedCount;
              const isCurrentlyRolling = index === revealedCount;
              const npc = state?.npcs?.[r.npcId] || { id: r.npcId, name: r.npcName };

              return (
                <div
                  key={r.npcId}
                  ref={isCurrentlyRolling ? activeCardRef : null}
                  className={`p-4 rounded-xl border-2 transition-all duration-500 flex items-center justify-between ${
                    !isRevealed
                      ? isCurrentlyRolling
                        ? 'bg-[#2a0e16] border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.6)] scale-[1.02] ring-2 ring-amber-400/80'
                        : 'bg-[#100508] border-gray-900 opacity-30'
                      : r.survived
                      ? 'bg-[#122316] border-emerald-600 shadow-md'
                      : 'bg-[#2b080e] border-red-600 shadow-lg'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <NpcAvatar npc={npc} size="md" />
                    <div>
                      <span className="font-medieval font-bold text-lg text-white block">
                        {r.npcName}
                      </span>
                      {r.isThyatis && (
                        <span className="text-xs text-amber-300 bg-amber-950 border border-amber-600 px-2 py-0.5 rounded font-bold">
                          Bênção de Thyatis
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {!isRevealed ? (
                      isCurrentlyRolling ? (
                        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm animate-pulse">
                          <Dices className="w-5 h-5 animate-spin text-amber-300" />
                          <span>Decidindo o destino...</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic">Aguardando...</span>
                      )
                    ) : (
                      <>
                        <span className="font-mono font-black text-base text-gray-100 bg-black/60 px-2.5 py-1 rounded border border-red-950">
                          Dado: [{r.roll}]
                        </span>
                        {r.survived ? (
                          <span className="px-3 py-1 bg-emerald-950 border-2 border-emerald-500 text-emerald-300 rounded-lg text-xs font-black flex items-center gap-1.5 shadow">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sobreviveu (Par)
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-950 border-2 border-red-500 text-red-200 rounded-lg text-xs font-black flex items-center gap-1.5 shadow">
                            <Skull className="w-4 h-4 text-red-500" /> Morreu (Ímpar)
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isComplete && (
            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setActiveWoundsTestResult(null)}
                className="px-6 py-2.5 medieval-button rounded-xl text-sm font-bold uppercase tracking-wider shadow-xl cursor-pointer"
              >
                Concluir Resultados
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
