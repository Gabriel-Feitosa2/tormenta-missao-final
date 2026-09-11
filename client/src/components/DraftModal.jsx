import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import {
  X,
  Search,
  Plus,
  Trash2,
  Heart,
  Shield,
  Check,
  Flame,
  Users,
} from 'lucide-react';
import { NpcAvatar } from './NpcAvatar';

export const DraftModal = ({ isOpen, onClose }) => {
  const { state, currentUser, claimNpc, releaseNpc } = useGame();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'available' | 'healers' | 'intimate' | 'melee' | 'ranged'

  const allNpcs = useMemo(() => {
    return state?.npcs ? Object.values(state.npcs) : [];
  }, [state?.npcs]);

  const currentPlayerId = currentUser?.playerId;
  const isMaster = currentUser?.role === 'master';
  const currentPlayer = state?.players?.find((p) => p.id === currentPlayerId);
  const myOwnedCount = allNpcs.filter((n) => n.ownerId === currentPlayerId).length;

  const filteredNpcs = useMemo(() => {
    return allNpcs.filter((npc) => {
      // Search
      const term = searchTerm.toLowerCase();
      const matchSearch =
        npc.name.toLowerCase().includes(term) ||
        (npc.bonus && npc.bonus.toLowerCase().includes(term)) ||
        (npc.attack && npc.attack.toLowerCase().includes(term)) ||
        (npc.special && npc.special.toLowerCase().includes(term));

      if (!matchSearch) return false;

      // Filter
      if (activeFilter === 'available') return !npc.ownerId;
      if (activeFilter === 'healers') return npc.isHealer;
      if (activeFilter === 'intimate') return npc.isIntimate;
      if (activeFilter === 'melee') return npc.attack && npc.attack.includes('cc');
      if (activeFilter === 'ranged')
        return (
          npc.attack &&
          (npc.attack.includes('curto') ||
            npc.attack.includes('médio') ||
            npc.attack.includes('longo') ||
            npc.attack.includes('(c)'))
        );

      return true;
    });
  }, [allNpcs, searchTerm, activeFilter]);

  if (!isOpen || !state) return null;

  const handleClaim = async (npcId) => {
    if (!currentPlayerId) return;
    const res = await claimNpc(currentPlayerId, npcId);
    if (!res.success) {
      alert(res.message || 'Não foi possível recrutar o parceiro.');
    }
  };

  const handleRelease = async (npcId) => {
    const res = await releaseNpc(npcId);
    if (!res.success) {
      alert(res.message || 'Erro ao liberar parceiro.');
    }
  };

  const handleMasterAssign = async (npcId, targetPlayerId) => {
    if (!targetPlayerId) {
      await releaseNpc(npcId);
    } else {
      await claimNpc(targetPlayerId, npcId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-6xl h-[90vh] medieval-panel rounded-xl border-2 border-red-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-black px-6 py-4 border-b-2 border-red-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950 border border-amber-500/80">
              <Users className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-medieval tracking-wide">
                Catálogo de Parceiros de Arton
              </h2>
              <p className="text-sm text-amber-200/90 font-medium">
                {currentUser?.role === 'player'
                  ? `Selecione até 8 parceiros para ${currentPlayer?.name} (${myOwnedCount}/8 recrutados)`
                  : 'Visão Geral e Atribuição de Parceiros pelo Mestre'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-[#16080c] border-b border-red-900 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, bônus, ataque ou magia..."
              className="w-full pl-10 pr-4 py-2 bg-black/80 border-2 border-red-800 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-sm w-full md:w-auto">
            {[
              { id: 'all', label: `Todos (${allNpcs.length})` },
              { id: 'available', label: `Disponíveis (${allNpcs.filter((n) => !n.ownerId).length})` },
              { id: 'healers', label: 'Curadores' },
              { id: 'intimate', label: 'Íntimos (*)' },
              { id: 'melee', label: 'Corpo a Corpo' },
              { id: 'ranged', label: 'À Distância' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold ${
                  activeFilter === tab.id
                    ? 'bg-red-700 text-white shadow-lg border border-red-400'
                    : 'bg-black/60 text-gray-300 hover:text-white border border-red-950 hover:border-red-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* NPC Catalog List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {filteredNpcs.length === 0 ? (
            <div className="text-center py-20 text-gray-300">
              <Shield className="w-12 h-12 mx-auto text-red-700 mb-3 opacity-60" />
              <p className="text-lg font-medieval font-bold">Nenhum parceiro encontrado para este filtro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNpcs.map((npc) => {
                const owner = state.players.find((p) => p.id === npc.ownerId);
                const isOwnedByMe = npc.ownerId === currentPlayerId;
                const isOwnedByOther = npc.ownerId && !isOwnedByMe;
                const canClaim = !isOwnedByOther && myOwnedCount < 8 && !isOwnedByMe;

                return (
                  <div
                    key={npc.id}
                    className={`rounded-xl p-4 border-2 transition-all flex flex-col justify-between ${
                      isOwnedByMe
                        ? 'bg-[#280e18] border-red-500 shadow-xl ring-2 ring-red-500/50'
                        : isOwnedByOther
                        ? 'bg-[#14080c]/90 border-gray-800 opacity-85'
                        : 'bg-[#1a0b10] border-red-900/80 hover:border-red-600 shadow-md'
                    }`}
                  >
                    <div>
                      {/* Title row with Avatar */}
                      <div className="flex items-center gap-3 mb-2.5">
                        <NpcAvatar npc={npc} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medieval font-bold text-lg text-white truncate">
                              {npc.name}
                            </h4>
                            {npc.isIntimate && (
                              <span className="px-2 py-0.5 text-xs bg-amber-950 border border-amber-500 text-amber-300 rounded font-bold uppercase">
                                ★ Íntimo
                              </span>
                            )}
                            {npc.isHealer && (
                              <span className="px-2 py-0.5 text-xs bg-emerald-950 border border-emerald-500 text-emerald-300 rounded font-bold flex items-center gap-1">
                                <Heart className="w-3 h-3" /> Curador
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-red-300 font-semibold block mt-0.5">
                            ⚔️ Aço Rubi <span className="text-gray-300">(ignora RD Lefeu)</span>
                          </span>
                        </div>

                        {/* Vontade Badge */}
                        <div className="text-right bg-black/60 px-2.5 py-1 rounded-lg border border-red-900 shrink-0">
                          <span className="text-[11px] text-gray-300 block uppercase font-bold">Vontade</span>
                          <span
                            className={`font-black text-base ${
                              npc.isImmune ? 'text-purple-300' : 'text-amber-300'
                            }`}
                          >
                            {npc.isImmune ? 'Imune' : `+${npc.will}`}
                          </span>
                        </div>
                      </div>

                      {/* Attack */}
                      {npc.attack && (
                        <div className="mb-2">
                          <span className="inline-block px-2.5 py-1 bg-red-950/80 border border-red-700/80 rounded font-mono font-bold text-amber-200 text-sm">
                            ⚔️ Ataque: {npc.attack}
                          </span>
                        </div>
                      )}

                      {/* Bonus text */}
                      <div className="text-sm text-gray-100 leading-relaxed mb-3 bg-black/60 p-3 rounded-lg border border-red-950">
                        <strong className="text-amber-300 font-bold block mb-1">Bônus:</strong>
                        <span>{npc.bonus || 'Sem bônus passivo listado.'}</span>
                      </div>

                      {/* Special info */}
                      {npc.special && (
                        <div className="text-xs text-amber-200/90 italic mb-3 bg-amber-950/40 p-2.5 rounded border border-amber-900/60 leading-relaxed">
                          ✦ {npc.special}
                        </div>
                      )}
                    </div>

                    {/* Footer / Claim actions */}
                    <div className="pt-3 border-t border-red-900/70 flex items-center justify-between text-sm">
                      {/* Owner Status */}
                      <div>
                        {isOwnedByMe ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-400" /> No seu time
                          </span>
                        ) : isOwnedByOther ? (
                          <span className="text-amber-300 font-semibold">
                            Com {owner?.name}
                          </span>
                        ) : (
                          <span className="text-gray-300 italic font-medium">Disponível</span>
                        )}
                      </div>

                      {/* Action buttons */}
                      {isMaster ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-300">Alocar:</span>
                          <select
                            value={npc.ownerId || ''}
                            onChange={(e) => handleMasterAssign(npc.id, e.target.value || null)}
                            className="bg-black text-xs font-semibold border-2 border-red-700 rounded-lg px-2 py-1 text-white"
                          >
                            <option value="">Na Reserva</option>
                            {state.players.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : isOwnedByMe ? (
                        <button
                          onClick={() => handleRelease(npc.id)}
                          className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-600 text-red-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Devolver
                        </button>
                      ) : canClaim ? (
                        <button
                          onClick={() => handleClaim(npc.id)}
                          className="px-4 py-1.5 medieval-button rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                        >
                          <Plus className="w-4 h-4" /> Recrutar
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
