import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Heart, ShieldCheck, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { NpcAvatar } from './NpcAvatar';

export const HealerRescueModal = ({ woundedNpc, onClose }) => {
  const { state, currentUser, rescueWithHealer } = useGame();
  const [selectedHealerId, setSelectedHealerId] = useState('');
  const [rescuing, setRescuing] = useState(false);
  const [error, setError] = useState('');

  if (!woundedNpc || !state) return null;

  const allNpcs = Object.values(state.npcs || {});
  const isMaster = currentUser?.role === 'master';
  const currentPlayerId = currentUser?.playerId;

  // Available healers: must have isHealer: true, status: 'alive'
  // If player, can use their own healer, or any party healer if agreed
  const availableHealers = allNpcs.filter(
    (n) => n.isHealer && n.status === 'alive' && (isMaster || n.ownerId === currentPlayerId || !n.ownerId)
  );

  const handleRescue = async (e) => {
    e.preventDefault();
    if (!selectedHealerId) {
      setError('Selecione um parceiro Curador para realizar o resgate.');
      return;
    }

    setRescuing(true);
    setError('');

    const res = await rescueWithHealer(selectedHealerId, woundedNpc.id);
    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Erro ao realizar resgate por curador.');
    }
    setRescuing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg medieval-panel rounded-2xl border-2 border-emerald-600 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#102a18] to-black px-6 py-4 border-b-2 border-emerald-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-900 border border-emerald-400">
              <Heart className="w-6 h-6 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-medieval font-bold text-xl text-white">
                Resgate Seguro por Curador
              </h3>
              <p className="text-xs text-emerald-200/90 font-medium">
                Regra Especial: Salvar parceiro ferido do teste de morte
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleRescue} className="p-6 space-y-4 font-sans">
          {/* Target wounded card */}
          <div className="bg-[#180a0f] border-2 border-amber-600/80 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NpcAvatar npc={woundedNpc} size="md" />
              <div>
                <span className="text-xs uppercase font-bold text-amber-300 block">Parceiro Ferido:</span>
                <span className="font-medieval font-bold text-lg text-white">{woundedNpc.name}</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-950 border border-amber-500 text-amber-200 text-xs font-bold rounded-lg flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Ferido (Risco de Morte)
            </span>
          </div>

          {/* Rule Explanatory Banner */}
          <div className="p-4 rounded-xl bg-emerald-950/50 border-2 border-emerald-700/80 text-sm text-emerald-100 leading-relaxed space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Como funciona o Resgate por Curador:</span>
            </div>
            <p>
              Ao utilizar um parceiro Curador para resgatar <strong>{woundedNpc.name}</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-gray-200">
              <li>
                <strong>Ambos saem com segurança deste combate:</strong> não participam mais desta batalha.
              </li>
              <li>
                <strong>Garantia de Vida:</strong> <strong>{woundedNpc.name}</strong> <u>não</u> rola o teste de morte e estará vivo para o próximo combate!
              </li>
            </ul>
          </div>

          {/* Select Curador */}
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-2">
              Selecione o Curador disponível para o resgate:
            </label>

            {availableHealers.length === 0 ? (
              <div className="p-4 rounded-lg bg-black/60 border border-red-800 text-center text-xs text-red-300 font-medium">
                Nenhum parceiro Curador ativo disponível no momento.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {availableHealers.map((curador) => {
                  const owner = state.players.find((p) => p.id === curador.ownerId);
                  return (
                    <label
                      key={curador.id}
                      className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                        selectedHealerId === curador.id
                          ? 'bg-emerald-950 border-emerald-500 shadow-lg'
                          : 'bg-[#150a0f] border-red-950 hover:border-emerald-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="selectedHealer"
                          value={curador.id}
                          checked={selectedHealerId === curador.id}
                          onChange={() => setSelectedHealerId(curador.id)}
                          className="w-4 h-4 accent-emerald-500 shrink-0"
                        />
                        <NpcAvatar npc={curador} size="sm" />
                        <div>
                          <span className="font-medieval font-bold text-base text-white block">
                            {curador.name}
                          </span>
                          <span className="text-xs text-emerald-300 font-medium">
                            {curador.bonus}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs text-gray-300 font-semibold bg-black/60 px-2 py-1 rounded">
                        {owner ? owner.name : 'Reserva'}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-950 border border-red-600 text-xs text-red-200 font-medium">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-emerald-950">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-lg text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedHealerId || rescuing}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-sm shadow-xl flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{rescuing ? 'Resgatando...' : 'Confirmar Resgate Seguro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
