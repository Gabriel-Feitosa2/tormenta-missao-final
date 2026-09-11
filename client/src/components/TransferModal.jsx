import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowRightLeft, X, Shield, AlertTriangle } from 'lucide-react';
import { NpcAvatar } from './NpcAvatar';

export const TransferModal = ({ npc, onClose }) => {
  const { state, currentUser, transferNpc } = useGame();
  const [targetPlayerId, setTargetPlayerId] = useState('');
  const [error, setError] = useState('');
  const [transferring, setTransferring] = useState(false);

  if (!npc || !state) return null;

  const allNpcs = Object.values(state.npcs || {});
  const fromPlayerId = npc.ownerId || currentUser?.playerId;
  const currentOwner = state.players.find((p) => p.id === fromPlayerId);

  // Available target players (excluding current owner)
  const availableTargets = state.players.filter((p) => p.id !== fromPlayerId);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!targetPlayerId) {
      setError('Selecione o jogador de destino.');
      return;
    }

    setTransferring(true);
    setError('');

    const res = await transferNpc(fromPlayerId, targetPlayerId, npc.id);
    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Erro ao transferir parceiro.');
    }
    setTransferring(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md medieval-panel rounded-lg border border-red-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-black px-6 py-4 border-b border-red-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-400" />
            <h3 className="font-medieval font-bold text-base text-red-100">
              Passar Parceiro em Combate
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleTransfer} className="p-6 space-y-4">
          <div className="bg-[#140609] border border-red-900/60 rounded p-3 text-xs">
            <span className="text-gray-400 block mb-1.5">Parceiro a transferir:</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <NpcAvatar npc={npc} size="md" />
                <span className="font-medieval font-bold text-base text-red-200">{npc.name}</span>
              </div>
              <span className="text-gray-400">
                Atualmente com: <strong className="text-amber-300">{currentOwner?.name}</strong>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-red-300 uppercase mb-2">
              Selecione o jogador destinatário (máx 8):
            </label>
            <div className="space-y-2">
              {availableTargets.map((player) => {
                const count = allNpcs.filter((n) => n.ownerId === player.id).length;
                const isFull = count >= 8;

                return (
                  <label
                    key={player.id}
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      isFull
                        ? 'bg-black/40 border-gray-800 opacity-50 cursor-not-allowed'
                        : targetPlayerId === player.id
                        ? 'bg-red-950 border-red-500 shadow'
                        : 'bg-[#180a0f] border-red-900/50 hover:border-red-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="targetPlayer"
                        value={player.id}
                        disabled={isFull}
                        checked={targetPlayerId === player.id}
                        onChange={() => setTargetPlayerId(player.id)}
                        className="accent-red-600"
                      />
                      <div>
                        <span className="font-medieval font-bold text-xs text-gray-200 block">
                          {player.name}
                        </span>
                        {player.characterName && (
                          <span className="text-[11px] text-amber-300/80 italic">
                            {player.characterName}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold ${
                        isFull ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {count}/8 {isFull ? '(Cheio)' : ''}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-red-950 border border-red-600 text-xs text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-red-950">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!targetPlayerId || transferring}
              className="px-5 py-2 medieval-button text-xs font-bold rounded flex items-center gap-1.5 shadow"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{transferring ? 'Transferindo...' : 'Confirmar Transferência'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
