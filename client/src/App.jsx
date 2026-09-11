import React, { useState } from "react";
import { GameProvider, useGame } from "./context/GameContext";
import { Header } from "./components/Header";
import { LoginModal } from "./components/LoginModal";
import { MasterPanel } from "./components/MasterPanel";
import { PlayerView } from "./components/PlayerView";
import { DraftModal } from "./components/DraftModal";
import { TransferModal } from "./components/TransferModal";
import { WillTestModal } from "./components/WillTestModal";
import { InjuryModal } from "./components/InjuryModal";
import { CombatWoundsModal } from "./components/CombatWoundsModal";
import { HealerRescueModal } from "./components/HealerRescueModal";
import { SpecialModal } from "./components/SpecialModals/SpecialModal";
import { CombatLog } from "./components/CombatLog";
import { Flame, Shield, Users, Crown, Sparkles } from "lucide-react";
import { NpcCard } from "./components/NpcCard";

const MainContent = () => {
  const {
    state,
    currentUser,
    draftModalOpen,
    setDraftModalOpen,
    transferNpcData,
    setTransferNpcData,
    specialDialogData,
    setSpecialDialogData,
    rescueModalData,
    setRescueModalData,
  } = useGame();

  const [loginModalOpen, setLoginModalOpen] = useState(false);

  if (!state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#080305]">
        <Flame className="w-14 h-14 text-red-600 animate-pulse mb-3" />
        <h2 className="font-medieval text-2xl text-white font-bold">
          Invocando a Tormenta...
        </h2>
        <p className="text-sm text-red-300 mt-1">
          Conectando aos reinos de Arton em tempo real...
        </p>
      </div>
    );
  }

  const allNpcs = Object.values(state.npcs || {});

  return (
    <div className="min-h-screen flex flex-col bg-[#080305] text-gray-100 selection:bg-red-800 selection:text-white">
      {/* Header */}
      <Header
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenDraft={() => setDraftModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {currentUser?.role === "master" ? (
          /* Master Deck */
          <MasterPanel
            onOpenDraft={() => setDraftModalOpen(true)}
            onOpenTransfer={(npc) => setTransferNpcData(npc)}
            onOpenSpecial={(npc) => setSpecialDialogData(npc)}
            onOpenRescue={(npc) => setRescueModalData(npc)}
          />
        ) : currentUser?.role === "player" ? (
          /* Player Deck */
          <PlayerView
            onOpenDraft={() => setDraftModalOpen(true)}
            onOpenTransfer={(npc) => setTransferNpcData(npc)}
            onOpenSpecial={(npc) => setSpecialDialogData(npc)}
            onOpenRescue={(npc) => setRescueModalData(npc)}
          />
        ) : (
          /* Spectator / Welcome Screen */
          <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="medieval-panel rounded-2xl p-7 sm:p-10 border-2 border-red-700 text-center shadow-2xl relative overflow-hidden">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="inline-flex items-center justify-center p-3.5 rounded-full bg-red-950 border-2 border-red-500 shadow-[0_0_25px_rgba(220,38,38,0.6)]">
                  <Flame className="w-9 h-9 text-amber-200 animate-pulse" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black font-medieval text-white tracking-wider">
                  BEM-VINDO À MISSÃO FINAL
                </h2>
                <p className="text-base text-red-100 leading-relaxed font-sans font-medium">
                  Os céus de Arton sangram rubro lefeu. Nesta batalha decisiva,
                  cada herói comanda até <strong>8 parceiros</strong> armados
                  com <strong>Aço Rubi</strong>. A Tormenta testará a
                  determinação de todos com testes de Vontade impiedosos.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
                  <button
                    onClick={() => setLoginModalOpen(true)}
                    className="px-7 py-3.5 medieval-button text-sm font-bold rounded-xl flex items-center gap-2 shadow-2xl"
                  >
                    <Users className="w-5 h-5" />
                    <span>Acessar Meu Personagem (1 a 5)</span>
                  </button>
                  <button
                    onClick={() => setLoginModalOpen(true)}
                    className="px-6 py-3.5 medieval-button-secondary text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg"
                  >
                    <Crown className="w-5 h-5 text-amber-300" />
                    <span>Entrar como Mestre</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Read-only overview of all 34 NPCs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-red-900/80 pb-3">
                <h3 className="font-medieval font-black text-xl text-white">
                  Parceiros Presentes na Batalha ({allNpcs.length})
                </h3>
                <span className="text-sm text-gray-300 font-medium">
                  Selecione seu slot acima para comandar seus parceiros
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-5">
                {allNpcs.map((npc) => (
                  <NpcCard
                    key={npc.id}
                    npc={npc}
                    isOwner={false}
                    isMaster={false}
                    onOpenTransfer={() => setLoginModalOpen(true)}
                    onOpenSpecial={(n) => setSpecialDialogData(n)}
                    onOpenRescue={(n) => setRescueModalData(n)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Combat Log */}
        <CombatLog />
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      <DraftModal
        isOpen={draftModalOpen}
        onClose={() => setDraftModalOpen(false)}
      />

      {transferNpcData && (
        <TransferModal
          npc={transferNpcData}
          onClose={() => setTransferNpcData(null)}
        />
      )}

      {specialDialogData && (
        <SpecialModal
          npc={specialDialogData}
          onClose={() => setSpecialDialogData(null)}
        />
      )}

      {rescueModalData && (
        <HealerRescueModal
          woundedNpc={rescueModalData}
          onClose={() => setRescueModalData(null)}
        />
      )}

      <WillTestModal />
      <InjuryModal />
      <CombatWoundsModal />
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <MainContent />
    </GameProvider>
  );
}
