import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Shield, Crown, User, Edit3, Check, X, Lock } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose }) => {
  const { state, loginMaster, loginPlayer, updatePlayerInfo } = useGame();
  const [tab, setTab] = useState('players'); // 'players' | 'master'
  const [masterPin, setMasterPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Editing player slot
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCharName, setEditCharName] = useState('');

  if (!isOpen || !state) return null;

  const handleMasterLogin = async (e) => {
    e.preventDefault();
    setPinError('');
    const res = await loginMaster(masterPin);
    if (res.success) {
      onClose();
    } else {
      setPinError(res.message || 'PIN incorreto.');
    }
  };

  const handlePlayerSelect = (playerId) => {
    loginPlayer(playerId);
    onClose();
  };

  const startEditSlot = (player, e) => {
    e.stopPropagation();
    setEditingSlotId(player.id);
    setEditName(player.name);
    setEditCharName(player.characterName);
  };

  const saveEditSlot = async (playerId, e) => {
    e.stopPropagation();
    await updatePlayerInfo(playerId, editName, editCharName);
    setEditingSlotId(null);
  };

  const allNpcs = Object.values(state.npcs || {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl medieval-panel rounded-xl border-2 border-red-700 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-black px-6 py-4 border-b-2 border-red-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-bold text-white font-medieval">
              Identificação do Aventureiro
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b-2 border-red-900 bg-[#150a0d]">
          <button
            onClick={() => setTab('players')}
            className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              tab === 'players'
                ? 'text-amber-300 border-b-2 border-amber-400 bg-red-950/60'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Slots dos Jogadores (1 a 5)</span>
          </button>
          <button
            onClick={() => setTab('master')}
            className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              tab === 'master'
                ? 'text-red-300 border-b-2 border-red-500 bg-red-950/60'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Acesso do Mestre</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {tab === 'players' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-200 font-sans font-medium">
                Selecione o seu personagem para acessar sua mesa de parceiros (máximo de 8 parceiros por herói):
              </p>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {state.players.map((player, idx) => {
                  const ownedCount = allNpcs.filter((n) => n.ownerId === player.id).length;
                  const isEditing = editingSlotId === player.id;

                  return (
                    <div
                      key={player.id}
                      onClick={() => !isEditing && handlePlayerSelect(player.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isEditing
                          ? 'bg-red-950 border-red-500 shadow-lg'
                          : 'bg-[#1a0b10] hover:bg-[#280e18] border-red-900/80 hover:border-red-500 shadow-md'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex-1 space-y-3 pr-2" onClick={(e) => e.stopPropagation()}>
                          <div>
                            <label className="text-xs text-red-300 block uppercase font-bold mb-1">
                              Nome do Jogador
                            </label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full text-sm bg-black border-2 border-red-600 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-400 font-sans"
                              placeholder="Nome do Jogador"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-red-300 block uppercase font-bold mb-1">
                              Nome do Personagem RPG
                            </label>
                            <input
                              type="text"
                              value={editCharName}
                              onChange={(e) => setEditCharName(e.target.value)}
                              className="w-full text-sm bg-black border-2 border-red-600 rounded-lg px-3 py-1.5 text-amber-200 focus:outline-none focus:border-amber-400 font-sans"
                              placeholder="Nome do Personagem RPG"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={(e) => saveEditSlot(player.id, e)}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                            >
                              <Check className="w-4 h-4" /> Salvar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSlotId(null);
                              }}
                              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-3.5">
                            <div className="w-10 h-10 rounded-xl bg-red-950 border-2 border-red-600 flex items-center justify-center font-medieval font-black text-amber-300 text-base shadow">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medieval font-bold text-base text-white">
                                  {player.name}
                                </h3>
                                {player.characterName && (
                                  <span className="text-sm text-amber-300 font-serif italic">
                                    ({player.characterName})
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-red-300 font-mono font-bold block mt-0.5">
                                {ownedCount}/8 parceiros recrutados
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={(e) => startEditSlot(player, e)}
                              className="p-2 text-gray-300 hover:text-amber-300 transition-colors rounded-lg hover:bg-black/50"
                              title="Renomear jogador ou personagem"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-1.5 bg-red-800 border border-red-500 rounded-lg text-xs font-black text-white uppercase tracking-wider shadow">
                              Entrar
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleMasterLogin} className="space-y-4 font-sans">
              <p className="text-sm text-gray-200 leading-relaxed font-medium">
                O Mestre possui autoridade sobre a Tormenta: definição da CD de Vontade, disparo de testes em massa, final de ondas e controle geral da mesa.
              </p>

              <div>
                <label className="block text-xs font-bold text-red-300 uppercase mb-1.5">
                  PIN de Acesso do Mestre
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-red-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={masterPin}
                    onChange={(e) => setMasterPin(e.target.value)}
                    placeholder="Digite a senha (padrão: tormenta20)"
                    className="w-full pl-10 pr-4 py-2.5 bg-black border-2 border-red-700 rounded-lg text-base text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono"
                    autoFocus
                  />
                </div>
                {pinError && <p className="text-xs text-red-400 font-bold mt-2">{pinError}</p>}
                <p className="text-xs text-amber-200/90 mt-2">
                  Dica: A senha padrão inicial é <span className="text-amber-300 font-mono font-bold">tormenta20</span>.
                </p>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 medieval-button text-sm font-bold rounded-lg flex items-center gap-2 shadow-xl cursor-pointer"
                >
                  <Crown className="w-5 h-5 text-amber-300" />
                  <span>Entrar como Mestre</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
