import React from 'react';
import { useGame } from '../context/GameContext';
import { Shield, Skull, Heart, Flame, Users, LogOut, UserCheck, Swords } from 'lucide-react';

export const Header = ({ onOpenLogin, onOpenDraft }) => {
  const { state, connected, currentUser, logout } = useGame();

  if (!state) return null;

  const allNpcs = Object.values(state.npcs || {});
  const aliveCount = allNpcs.filter((n) => n.status === 'alive').length;
  const woundedCount = allNpcs.filter((n) => n.status === 'wounded').length;
  const withdrawnCount = allNpcs.filter((n) => n.status === 'withdrawn').length;
  const deadCount = allNpcs.filter((n) => n.status === 'dead').length;

  const combatName = state.combatInstance?.name || `Combate #${state.combatInstance?.id || 1}`;
  const currentTurn = state.combatTurn || 1;

  return (
    <header className="sticky top-0 z-30 bg-[#120508]/95 backdrop-blur-md border-b-2 border-red-800 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Title and Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 via-red-900 to-black border-2 border-red-500 flex items-center justify-center shadow-lg shadow-red-950">
              <Flame className="w-7 h-7 text-red-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white font-medieval drop-shadow-md">
                  TORMENTA 20 <span className="text-red-400 text-sm font-sans font-bold tracking-normal border-2 border-red-600 px-2 py-0.5 rounded-md bg-red-950/80">MISSÃO FINAL</span>
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                    connected
                      ? 'bg-emerald-950 text-emerald-300 border-2 border-emerald-500'
                      : 'bg-rose-950 text-rose-300 border-2 border-rose-500'
                  }`}
                >
                  <span className={`w-2 h-2 mr-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                  {connected ? 'Tempo Real Ativo' : 'Reconectando...'}
                </span>
              </div>
              <p className="text-sm text-red-200 font-medium">
                Sistema de Parceiros de Arton • Equipamento de Aço Rubi
              </p>
            </div>
          </div>

          {/* Combat Meters and Stats */}
          <div className="flex flex-wrap items-center gap-3 text-sm font-medieval">
            {/* Combat Instance & Turn */}
            <div className="bg-[#1e0a11] border-2 border-red-900/90 rounded-lg px-3.5 py-1.5 flex items-center gap-3.5 shadow">
              <div className="flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-red-300 text-xs uppercase font-bold block">Instância</span>
                  <span className="text-amber-200 font-black text-sm max-w-[130px] truncate block" title={combatName}>
                    {combatName}
                  </span>
                </div>
              </div>
              <div className="w-px h-7 bg-red-800" />
              <div>
                <span className="text-red-300 text-xs uppercase font-bold block">Turno</span>
                <span className="text-amber-300 font-black text-base font-mono">#{currentTurn}</span>
              </div>
              <div className="w-px h-7 bg-red-800" />
              <div>
                <span className="text-red-300 text-xs uppercase font-bold block">CD Vontade</span>
                <span className="text-amber-400 font-black text-base font-mono">
                  {state.willTestDC}
                  {state.willGlobalBonus ? (
                    <span className="text-xs text-blue-300 ml-1">
                      ({state.willGlobalBonus >= 0 ? `+${state.willGlobalBonus}` : state.willGlobalBonus})
                    </span>
                  ) : null}
                </span>
              </div>
            </div>

            {/* NPC Status Overview */}
            <div className="bg-[#1e0a11] border-2 border-red-900/90 rounded-lg px-3.5 py-1.5 flex items-center gap-3.5 shadow">
              <div className="flex items-center gap-1.5" title="Parceiros Vivos Ativos">
                <Heart className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-black text-base font-mono">{aliveCount}</span>
                <span className="text-gray-300 text-xs font-sans font-bold">ATIVOS</span>
              </div>
              <div className="w-px h-7 bg-red-800" />
              <div className="flex items-center gap-1.5" title="Parceiros Feridos (Em Risco)">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 font-black text-base font-mono">{woundedCount}</span>
                <span className="text-gray-300 text-xs font-sans font-bold">FERIDOS</span>
              </div>
              {withdrawnCount > 0 && (
                <>
                  <div className="w-px h-7 bg-red-800" />
                  <div className="flex items-center gap-1.5" title="Parceiros Salvos / Fora do Combate">
                    <span className="text-blue-300 font-black text-base font-mono">{withdrawnCount}</span>
                    <span className="text-gray-300 text-xs font-sans font-bold">SALVOS</span>
                  </div>
                </>
              )}
              <div className="w-px h-7 bg-red-800" />
              <div className="flex items-center gap-1.5" title="Parceiros Mortos Definitivamente">
                <Skull className="w-4 h-4 text-red-500" />
                <span className="text-red-400 font-black text-base font-mono">{deadCount}</span>
                <span className="text-gray-300 text-xs font-sans font-bold">MORTOS</span>
              </div>
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-2.5 ml-auto md:ml-0">
              <button
                onClick={onOpenDraft}
                className="px-4 py-2 rounded-lg text-sm font-bold medieval-button flex items-center gap-2 shadow-lg"
                title="Catálogo e Recrutamento de Parceiros"
              >
                <Users className="w-4 h-4 text-amber-200" />
                <span>Recrutar</span>
              </button>

              {currentUser ? (
                <div className="flex items-center gap-2.5 bg-[#250d16] border-2 border-red-700 rounded-lg px-3 py-1.5 shadow">
                  <div className="text-right">
                    <span className="text-xs block text-red-300 font-bold uppercase">
                      {currentUser.role === 'master' ? '👑 Mestre' : '🛡️ Jogador'}
                    </span>
                    <span className="text-sm font-black text-white truncate max-w-[130px] inline-block">
                      {currentUser.name}
                    </span>
                  </div>
                  <button
                    onClick={onOpenLogin}
                    className="p-1.5 text-gray-300 hover:text-amber-300 hover:bg-black/40 rounded transition-colors"
                    title="Trocar Perfil / Slot"
                  >
                    <UserCheck className="w-5 h-5" />
                  </button>
                  <button
                    onClick={logout}
                    className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-black/40 rounded transition-colors"
                    title="Desconectar"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="px-4 py-2 rounded-lg text-sm font-bold medieval-button-gold flex items-center gap-2 shadow-lg"
                >
                  <UserCheck className="w-4 h-4 text-amber-100" />
                  <span>Entrar / Escolher Slot</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
