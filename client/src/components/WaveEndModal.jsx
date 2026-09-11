import React from 'react';
import { useGame } from '../context/GameContext';
import { ShieldAlert, Skull, CheckCircle2, X } from 'lucide-react';

export const WaveEndModal = () => {
  const { activeWaveEndResult, setActiveWaveEndResult } = useGame();

  if (!activeWaveEndResult) return null;

  const { totalTested, diedCount, survivedCount, results } = activeWaveEndResult;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl medieval-panel rounded-lg border border-red-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-black px-6 py-4 border-b border-red-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="font-medieval font-bold text-base text-red-100">
              Fim da Onda de Ataques: Sobrevivência dos Feridos
            </h3>
          </div>
          <button
            onClick={() => setActiveWaveEndResult(null)}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-300">
            Regra: Ao final da onda, cada parceiro ferido joga um dado. Em resultado{' '}
            <strong>ímpar</strong> não resiste e morre; em resultado <strong>par</strong> sobrevive
            fora de combate até ser curado.
          </p>

          <div className="flex items-center justify-around bg-[#140609] border border-red-950 p-3 rounded text-xs font-medieval">
            <div>
              <span className="text-gray-400 block">Total Feridos:</span>
              <span className="font-mono font-bold text-base text-gray-200">{totalTested}</span>
            </div>
            <div>
              <span className="text-emerald-400 block">Sobreviveram:</span>
              <span className="font-mono font-bold text-base text-emerald-400">{survivedCount}</span>
            </div>
            <div>
              <span className="text-red-400 block">Faleceram:</span>
              <span className="font-mono font-bold text-base text-red-500">{diedCount}</span>
            </div>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {results.map((r) => (
              <div
                key={r.npcId}
                className={`p-3 rounded border flex items-center justify-between text-xs ${
                  r.survived
                    ? 'bg-[#101912] border-emerald-800/70'
                    : 'bg-[#200a0e] border-red-800/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medieval font-bold text-gray-200">{r.npcName}</span>
                  {r.isThyatis && (
                    <span className="text-[10px] text-amber-300 bg-amber-950 px-1 rounded">
                      Bênção de Thyatis
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-300">Dado: [{r.roll}]</span>
                  {r.survived ? (
                    <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-600 text-emerald-300 rounded font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sobreviveu (Par)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-950 border border-red-600 text-red-300 rounded font-bold flex items-center gap-1">
                      <Skull className="w-3.5 h-3.5 text-red-500" /> Morreu (Ímpar)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setActiveWaveEndResult(null)}
              className="px-5 py-2 medieval-button rounded text-xs font-bold uppercase tracking-wider"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
