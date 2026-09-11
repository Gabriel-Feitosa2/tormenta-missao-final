import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import {
  Shield,
  Dices,
  Plus,
  Users,
  ChevronDown,
  ChevronUp,
  Heart,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { NpcCard } from "./NpcCard";

export const PlayerView = ({
  onOpenDraft,
  onOpenTransfer,
  onOpenSpecial,
  onOpenRescue,
}) => {
  const { state, currentUser, rollTurnEndInjury } = useGame();
  const [rollingInjury, setRollingInjury] = useState(false);
  const [otherPlayerTab, setOtherPlayerTab] = useState(null);

  if (!state || !currentUser || currentUser.role !== "player") return null;

  const currentPlayer = state.players.find(
    (p) => p.id === currentUser.playerId,
  );
  if (!currentPlayer) return null;

  const allNpcs = Object.values(state.npcs || {});
  const myNpcs = allNpcs.filter((n) => n.ownerId === currentPlayer.id);
  const usedNpcs = myNpcs.filter(
    (n) => n.usedThisRound && n.status === "alive",
  );
  const aliveNpcs = myNpcs.filter((n) => n.status === "alive");
  const woundedNpcs = myNpcs.filter((n) => n.status === "wounded");
  const withdrawnNpcs = myNpcs.filter((n) => n.status === "withdrawn");
  const deadNpcs = myNpcs.filter((n) => n.status === "dead");

  // Available healers in player's command
  const myHealers = myNpcs.filter((n) => n.isHealer && n.status === "alive");

  const otherPlayers = state.players.filter((p) => p.id !== currentPlayer.id);

  const handleEndTurn = async () => {
    setRollingInjury(true);
    await rollTurnEndInjury(currentPlayer.id);
    setRollingInjury(false);
  };

  const usedCount = usedNpcs.length;
  const injuryThreshold = Math.max(2, usedCount);
  const injuryProbability = Math.min(
    100,
    Math.round((injuryThreshold / 8) * 100),
  );

  return (
    <div className="space-y-8">
      {/* Player Battle Deck Header */}
      <div className="medieval-panel rounded-xl p-6 sm:p-7 border-2 border-red-700 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <Shield className="w-7 h-7 text-red-400" />
              <h2 className="text-2xl sm:text-3xl font-black text-white font-medieval tracking-wide">
                {currentPlayer.name}
              </h2>
              {currentPlayer.characterName && (
                <span className="text-lg text-amber-300 font-serif italic">
                  ({currentPlayer.characterName})
                </span>
              )}
            </div>
            <p className="text-sm text-red-200 font-medium">
              Comande seus até 8 parceiros. Dê ordens de ataque, ative
              habilidades e gerencie seus ferimentos.
            </p>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Slot counter */}
            <div className="px-4 py-2 rounded-lg bg-black/80 border-2 border-red-700 text-sm flex items-center gap-2.5 shadow">
              <span className="text-gray-300 font-bold uppercase text-xs">
                Parceiros:
              </span>
              <span
                className={`font-mono font-black text-lg ${
                  myNpcs.length >= 8 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {myNpcs.length}/8
              </span>
            </div>

            {myNpcs.length < 8 && (
              <button
                onClick={onOpenDraft}
                className="px-5 py-2.5 rounded-lg text-sm font-bold medieval-button flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Recrutar Parceiro</span>
              </button>
            )}
          </div>
        </div>

        {/* Healer Rescue Alert if player has wounded partners */}
        {woundedNpcs.length > 0 && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-950/70 border-2 border-emerald-500 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3 font-sans">
              <Heart className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="font-medieval font-bold text-base text-white flex items-center gap-2">
                  <span>Parceiro Ferido com Risco de Morte!</span>
                  <span className="text-xs bg-amber-950 border border-amber-500 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                    {woundedNpcs.length} em risco
                  </span>
                </h4>
                <p className="text-xs text-emerald-100 leading-relaxed mt-0.5">
                  Antes do Mestre rolar o teste de morte, você pode usar um
                  Curador para resgatá-lo com 100% de segurança (ambos saem
                  deste combate e ficam vivos para a próxima batalha).
                </p>
              </div>
            </div>

            {myHealers.length > 0 ? (
              <button
                onClick={() => onOpenRescue && onOpenRescue(woundedNpcs[0])}
                className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl whitespace-nowrap cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Usar Curador ({myHealers[0].name})</span>
              </button>
            ) : (
              <span className="text-xs text-amber-300 italic font-semibold whitespace-nowrap">
                Peça para um aliado com Curador resgatar!
              </span>
            )}
          </div>
        )}

        {/* Turn End 1d8 Injury Panel */}
        <div className="mt-6 p-5 rounded-xl bg-[#16070b] border-2 border-red-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xl">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <Dices className="w-6 h-6 text-amber-300" />
              <h4 className="text-base font-medieval font-black text-white uppercase tracking-wider">
                Fim do Turno do Jogador (Teste de Ferimento 1d8)
              </h4>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed font-sans font-medium">
              Ao final do seu turno, role <strong>1d8</strong>: se o resultado
              for menor ou igual ao limiar de risco (
              <strong className="text-amber-300">≤ {injuryThreshold}</strong>),
              um de <strong>todos os seus parceiros ativos</strong> sofrerá
              ferimentos e sairá de combate! (O risco mínimo é{" "}
              <strong>1 ou 2</strong> mesmo se não usar nenhum parceiro; se você
              usou mais de 2 parceiros, o risco é ≤ {usedCount}).
            </p>

            <div className="flex flex-wrap items-center gap-6 mt-3 text-sm">
              <span className="text-gray-300 font-medium">
                Parceiros no grupo:{" "}
                <strong className="text-amber-300 font-mono text-base font-black">
                  {aliveNpcs.length}
                </strong>
              </span>
              <span className="text-gray-300 font-medium">
                Parceiros com ordem neste turno:{" "}
                <strong className="text-amber-300 font-mono text-base font-black">
                  {usedCount}
                </strong>
              </span>
              <span className="text-gray-300 font-medium">
                Risco de ferimento:{" "}
                <strong
                  className={`font-mono text-base font-black ${
                    injuryThreshold <= 2
                      ? "text-amber-400"
                      : injuryThreshold >= 5
                        ? "text-red-400"
                        : "text-amber-400"
                  }`}
                >
                  {injuryProbability}% (se 1d8 ≤ {injuryThreshold})
                </strong>
              </span>
            </div>
          </div>

          <button
            onClick={handleEndTurn}
            disabled={rollingInjury}
            className="px-6 py-4 rounded-xl text-sm font-medieval font-black tracking-wider flex items-center justify-center gap-3 shadow-xl transition-all medieval-button hover:shadow-red-800/80 cursor-pointer"
          >
            <Dices
              className={`w-5 h-5 text-amber-200 ${rollingInjury ? "animate-spin" : ""}`}
            />
            <span>
              {rollingInjury
                ? "Rolando 1d8..."
                : `Finalizar Turno (Rolar 1d8 • Risco ≤ ${injuryThreshold})`}
            </span>
          </button>
        </div>
      </div>

      {/* Player's Active Partners */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-red-900/80 pb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-medieval font-black text-xl text-white">
              Seus Parceiros ({myNpcs.length}/8)
            </h3>
            <span className="text-sm text-gray-300 font-semibold">
              ({aliveNpcs.length} ativos, {woundedNpcs.length} feridos,{" "}
              {withdrawnNpcs.length} salvos, {deadNpcs.length} mortos)
            </span>
          </div>

          {myNpcs.length < 8 && (
            <button
              onClick={onOpenDraft}
              className="text-sm text-amber-300 hover:text-white flex items-center gap-1.5 font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Parceiro</span>
            </button>
          )}
        </div>

        {myNpcs.length === 0 ? (
          <div className="medieval-panel rounded-xl p-10 text-center border-dashed border-2 border-red-800/80">
            <Users className="w-12 h-12 text-red-500 mx-auto mb-3 opacity-80" />
            <h4 className="font-medieval font-black text-white text-xl mb-2">
              Nenhum parceiro recrutado ainda
            </h4>
            <p className="text-sm text-gray-200 max-w-md mx-auto mb-5 leading-relaxed font-sans font-medium">
              Você pode comandar até 8 parceiros na Missão Final. Abra o
              catálogo e monte o seu esquadrão de aliados de Arton.
            </p>
            <button
              onClick={onOpenDraft}
              className="px-6 py-3 rounded-lg medieval-button text-sm font-bold uppercase tracking-wider inline-flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Abrir Catálogo de Recrutamento</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-5">
            {myNpcs.map((npc) => (
              <NpcCard
                key={npc.id}
                npc={npc}
                isOwner={true}
                isMaster={false}
                onOpenTransfer={onOpenTransfer}
                onOpenSpecial={onOpenSpecial}
                onOpenRescue={onOpenRescue}
              />
            ))}
          </div>
        )}
      </div>

      {/* Companions of Other Players (Battlefield Awareness) */}
      <div className="mt-10 pt-6 border-t-2 border-red-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-gray-400" />
            <h3 className="font-medieval font-bold text-base text-gray-200">
              Aliados dos Outros Jogadores na Mesa
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            {otherPlayers.map((p) => {
              const pCount = allNpcs.filter((n) => n.ownerId === p.id).length;
              const isSelected = otherPlayerTab === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setOtherPlayerTab(isSelected ? null : p.id)}
                  className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
                    isSelected
                      ? "bg-red-800 text-white border-2 border-red-500 shadow-md"
                      : "bg-[#180a0f] text-gray-300 hover:text-white border border-red-950"
                  }`}
                >
                  <span>{p.name}</span>
                  <span className="text-xs text-amber-300 font-mono">
                    ({pCount}/8)
                  </span>
                  {isSelected ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected other player's roster */}
        {otherPlayerTab && (
          <div className="p-5 rounded-xl bg-[#130609] border-2 border-red-950 animate-in fade-in">
            {(() => {
              const targetP = state.players.find(
                (p) => p.id === otherPlayerTab,
              );
              const targetNpcs = allNpcs.filter(
                (n) => n.ownerId === otherPlayerTab,
              );
              if (!targetP) return null;

              return (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medieval font-bold text-base text-amber-200">
                      Parceiros sob comando de {targetP.name}:
                    </span>
                    <button
                      onClick={() => setOtherPlayerTab(null)}
                      className="text-sm text-gray-400 hover:text-white font-bold"
                    >
                      Fechar
                    </button>
                  </div>
                  {targetNpcs.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">
                      Este jogador ainda não recrutou parceiros.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                      {targetNpcs.map((npc) => (
                        <NpcCard
                          key={npc.id}
                          npc={npc}
                          isOwner={false}
                          isMaster={false}
                          onOpenTransfer={onOpenTransfer}
                          onOpenSpecial={onOpenSpecial}
                          onOpenRescue={onOpenRescue}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
