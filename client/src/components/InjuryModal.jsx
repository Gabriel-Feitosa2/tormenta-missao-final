import React from 'react';
import { useGame } from '../context/GameContext';
import { Dices, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { NpcAvatar } from './NpcAvatar';

export const InjuryModal = () => {
  const { state, activeInjuryResult, setActiveInjuryResult } = useGame();

  if (!activeInjuryResult || !state) return null;

  const {
    playerId,
    d8Roll,
    usedCount = 0,
    injuryThreshold = Math.max(2, activeInjuryResult.usedCount || 0),
    injuredNpc,
    totalActivePartners,
  } = activeInjuryResult;
  const player = state.players.find((p) => p.id === playerId);
  const playerName = player ? player.name : 'Jogador';

  const wasInjured = !!injuredNpc;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md medieval-panel rounded-lg border border-red-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-black px-6 py-4 border-b border-red-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-amber-400" />
            <h3 className="font-medieval font-bold text-base text-red-100">
              Rolagem de Ferimentos (1d8)
            </h3>
          </div>
          <button
            onClick={() => setActiveInjuryResult(null)}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <p className="text-xs text-gray-300">
            Fim do turno de <strong className="text-amber-200">{playerName}</strong> (usou{' '}
            <strong>{usedCount}</strong> parceiro{usedCount !== 1 ? 's' : ''} nesta rodada | Limiar de risco: ≤{' '}
            <strong className="text-amber-300">{injuryThreshold}</strong>).
          </p>

          <div className="py-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-black border-2 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)] font-medieval font-black text-4xl text-amber-300 animate-dice">
              {d8Roll}
            </div>
            <span className="text-[11px] text-gray-400 block mt-2 font-mono">
              Resultado do 1d8 (Ferimento se ≤ {injuryThreshold})
            </span>
          </div>

          {wasInjured ? (
            <div className="p-4 rounded-lg bg-amber-950/80 border border-amber-600 text-left space-y-2 animate-pulse">
              <div className="flex items-center gap-2 text-amber-300 font-medieval font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>PARCEIRO FERIDO!</span>
              </div>
              <p className="text-xs text-amber-100 leading-relaxed">
                Como o dado (<strong>{d8Roll}</strong>) foi menor ou igual ao limiar de risco (
                <strong>{injuryThreshold}</strong>), um dos parceiros sob seu comando foi atingido e ferido:
              </p>
              <div className="pt-2 flex flex-col items-center justify-center gap-2">
                <NpcAvatar
                  npc={typeof injuredNpc === 'object' ? injuredNpc : { id: injuredNpc, name: injuredNpc }}
                  size="lg"
                />
                <span className="inline-block px-3 py-1 bg-black/60 border border-amber-500 rounded font-medieval font-bold text-amber-300 text-base">
                  ⚠️ {injuredNpc.name || injuredNpc}
                </span>
                <span className="text-[11px] text-gray-300 block text-center">
                  Está FORA DE COMBATE! Pode ser resgatado por um Curador antes do teste de morte do Mestre.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-emerald-950/70 border border-emerald-600 text-left space-y-1">
              <div className="flex items-center gap-2 text-emerald-300 font-medieval font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>NENHUM FERIMENTO SOFRIDO!</span>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                O resultado <strong>{d8Roll}</strong> foi superior ao limiar de risco ({injuryThreshold}
                ). Todos os parceiros resistiram ilesos nesta rodada!
              </p>
            </div>
          )}

          <button
            onClick={() => setActiveInjuryResult(null)}
            className="w-full py-2.5 medieval-button rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Continuar Combate
          </button>
        </div>
      </div>
    </div>
  );
};
