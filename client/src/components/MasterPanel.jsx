import React, { useState, useRef } from "react";
import { useGame } from "../context/GameContext";
import {
  Crown,
  Flame,
  ShieldAlert,
  Skull,
  RotateCcw,
  Users,
  Plus,
  Minus,
  Swords,
  Play,
  HeartHandshake,
  Download,
  Upload,
} from "lucide-react";
import { NpcCard } from "./NpcCard";

export const MasterPanel = ({
  onOpenDraft,
  onOpenTransfer,
  onOpenSpecial,
  onOpenRescue,
}) => {
  const {
    state,
    setWillDC,
    setWillGlobalBonus,
    rollWillTest,
    rollCombatWounds,
    advanceTurn,
    startNewCombat,
    resetSession,
    importSession,
  } = useGame();

  const fileInputRef = useRef(null);

  const [dcInput, setDcInput] = useState(state?.willTestDC || 20);
  const [globalBonusInput, setGlobalBonusInput] = useState(
    state?.willGlobalBonus || 0,
  );
  const [targetMode, setTargetMode] = useState("active"); // 'active' | 'all'
  const [testingWill, setTestingWill] = useState(false);
  const [selectedPlayerTab, setSelectedPlayerTab] = useState("all");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPin, setResetPin] = useState("");

  // New combat modal
  const [showNewCombatModal, setShowNewCombatModal] = useState(false);
  const [newCombatName, setNewCombatName] = useState("");

  if (!state) return null;

  const allNpcs = Object.values(state.npcs || {});
  const woundedNpcs = allNpcs.filter((n) => n.status === "wounded");
  const activeLivingNpcs = allNpcs.filter(
    (n) => n.ownerId && n.status === "alive",
  );
  const availableHealers = allNpcs.filter(
    (n) => n.isHealer && n.status === "alive",
  );

  const handleUpdateDC = (newDC) => {
    const val = Math.max(1, newDC);
    setDcInput(val);
    setWillDC(val);
  };

  const handleUpdateGlobalBonus = (newBonus) => {
    setGlobalBonusInput(newBonus);
    setWillGlobalBonus(newBonus);
  };

  const handleRollWillTest = async () => {
    setTestingWill(true);
    await rollWillTest(dcInput, globalBonusInput, targetMode);
    setTestingWill(false);
  };

  const handleRollWounds = async () => {
    await rollCombatWounds();
  };

  const handleAdvanceTurn = async () => {
    await advanceTurn();
  };

  const handleStartNewCombat = async (e) => {
    e.preventDefault();
    await startNewCombat(newCombatName);
    setShowNewCombatModal(false);
    setNewCombatName("");
  };

  const handleResetSession = async (e) => {
    e.preventDefault();
    const res = await resetSession(resetPin);
    if (res.success) {
      setShowResetConfirm(false);
      setResetPin("");
    } else {
      alert(res.message || "Erro ao resetar sessão.");
    }
  };

  const handleExportBackup = () => {
    try {
      const backupData = JSON.stringify(state, null, 2);
      const blob = new Blob([backupData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `tormenta_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erro ao exportar backup: " + err.message);
    }
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || !parsed.npcs || !parsed.players) {
          alert("Arquivo inválido: o arquivo não contém dados de sessão de Tormenta 20.");
          return;
        }
        if (
          window.confirm(
            "Atenção: Restaurar este backup substituirá todo o estado atual da mesa. Deseja continuar?",
          )
        ) {
          const res = await importSession(parsed);
          if (res.success) {
            alert("Sessão restaurada com sucesso! Todos os dados foram atualizados em tempo real.");
          } else {
            alert("Erro ao restaurar: " + (res.message || "Erro desconhecido"));
          }
        }
      } catch (err) {
        alert("Erro ao ler arquivo de backup: " + err.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const displayedNpcs = allNpcs.filter((npc) => {
    if (selectedPlayerTab === "all") return true;
    if (selectedPlayerTab === "reserve") return !npc.ownerId;
    return npc.ownerId === selectedPlayerTab;
  });

  return (
    <div className="space-y-8">
      {/* Hidden File Input for Backup Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportBackup}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Top Banner: Master Command Deck */}
      <div className="medieval-panel rounded-xl p-6 sm:p-7 border-2 border-red-700 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <Crown className="w-7 h-7 text-amber-300" />
              <h2 className="text-2xl sm:text-3xl font-black text-white font-medieval tracking-wide">
                Comando da Tormenta (Painel do Mestre)
              </h2>
            </div>
            <p className="text-sm text-red-200 font-medium">
              Controle global da CD de Vontade, bônus gerais, instâncias de
              combate e sobrevivência de feridos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Backup & Restore Controls */}
            <button
              onClick={handleExportBackup}
              className="px-4 py-2.5 rounded-lg text-xs font-bold bg-[#1e1308] hover:bg-amber-950 border-2 border-amber-600 text-amber-300 hover:text-white flex items-center gap-1.5 shadow transition-colors cursor-pointer"
              title="Baixar arquivo de backup da sessão (.json) no seu computador"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Salvar Backup</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-lg text-xs font-bold bg-[#140b1e] hover:bg-purple-950 border-2 border-purple-600 text-purple-300 hover:text-white flex items-center gap-1.5 shadow transition-colors cursor-pointer"
              title="Restaurar a sessão a partir de um arquivo .json salvo no seu PC"
            >
              <Upload className="w-4 h-4 text-purple-400" />
              <span>Carregar Backup</span>
            </button>

            {/* Combat Instance Controls */}
            <button
              onClick={handleAdvanceTurn}
              className="px-5 py-2.5 rounded-lg text-sm font-bold medieval-button-gold flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>
                Avançar Turno (#
                {(state.combatTurn || state.combatRound || 1) + 1})
              </span>
            </button>

            <button
              onClick={() => {
                setNewCombatName(
                  `Combate ${(state.combatInstance?.id || 1) + 1}`,
                );
                setShowNewCombatModal(true);
              }}
              className="px-4 py-2.5 rounded-lg text-sm font-bold medieval-button flex items-center gap-2 shadow-lg"
            >
              <Swords className="w-5 h-5 text-amber-300" />
              <span>Novo Combate</span>
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2.5 rounded-lg text-xs font-bold bg-black/80 hover:bg-red-950 border-2 border-red-900 text-red-300 hover:text-white transition-colors"
              title="Resetar todos os dados da campanha para o início"
            >
              Resetar Mesa
            </button>
          </div>
        </div>

        {/* Action Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Card 1: Mass Will Test (Teste de Vontade da Tormenta) */}
          <div className="bg-[#18070b] border-2 border-red-700 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Flame className="w-6 h-6 text-red-500 animate-pulse" />
                <h3 className="font-medieval font-black text-base sm:text-lg text-white">
                  Teste de Vontade da Tormenta
                </h3>
              </div>
              <span className="text-xs text-amber-300 uppercase font-bold tracking-wider bg-red-950 border border-red-600 px-3 py-1 rounded-md">
                1d20 + Vontade + Bônus
              </span>
            </div>

            <div className="space-y-4">
              {/* CD and Global Bonus in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* DC Selector */}
                <div className="bg-black/70 border-2 border-red-900/80 rounded-lg p-3">
                  <span className="text-xs text-gray-300 font-bold uppercase block mb-1">
                    Dificuldade (CD):
                  </span>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleUpdateDC(dcInput - 1)}
                      className="w-8 h-8 rounded bg-red-950 hover:bg-red-800 border border-red-600 text-white flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={dcInput}
                      onChange={(e) =>
                        handleUpdateDC(parseInt(e.target.value, 10) || 1)
                      }
                      className="w-14 text-center py-0.5 bg-red-950 border border-red-500 rounded text-amber-300 font-mono font-bold text-lg focus:outline-none"
                    />
                    <button
                      onClick={() => handleUpdateDC(dcInput + 1)}
                      className="w-8 h-8 rounded bg-red-950 hover:bg-red-800 border border-red-600 text-white flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Global Will Bonus Selector */}
                <div className="bg-black/70 border-2 border-blue-900/80 rounded-lg p-3">
                  <span className="text-xs text-blue-300 font-bold uppercase block mb-1">
                    Bônus Global de Vontade:
                  </span>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        handleUpdateGlobalBonus(globalBonusInput - 1)
                      }
                      className="w-8 h-8 rounded bg-blue-950 hover:bg-blue-800 border border-blue-600 text-white flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={globalBonusInput}
                      onChange={(e) =>
                        handleUpdateGlobalBonus(
                          parseInt(e.target.value, 10) || 0,
                        )
                      }
                      className="w-14 text-center py-0.5 bg-blue-950 border border-blue-500 rounded text-blue-200 font-mono font-bold text-lg focus:outline-none"
                    />
                    <button
                      onClick={() =>
                        handleUpdateGlobalBonus(globalBonusInput + 1)
                      }
                      className="w-8 h-8 rounded bg-blue-950 hover:bg-blue-800 border border-blue-600 text-white flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Target Mode Selector */}
              <div className="flex gap-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setTargetMode("active")}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                    targetMode === "active"
                      ? "bg-red-800 text-white border-red-400 shadow-md font-bold"
                      : "bg-[#1b0a0f] text-gray-300 border-red-950 hover:text-white"
                  }`}
                >
                  Parceiros dos Jogadores ({activeLivingNpcs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode("all")}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                    targetMode === "all"
                      ? "bg-red-800 text-white border-red-400 shadow-md font-bold"
                      : "bg-[#1b0a0f] text-gray-300 border-red-950 hover:text-white"
                  }`}
                >
                  Todos os 34 da Mesa (
                  {allNpcs.filter((n) => n.status !== "dead").length})
                </button>
              </div>

              {/* Dramatic Roll Trigger Button */}
              <button
                onClick={handleRollWillTest}
                disabled={testingWill}
                className="w-full py-3.5 medieval-button rounded-xl font-medieval font-black text-base tracking-wider flex items-center justify-center gap-2.5 shadow-xl hover:shadow-red-800/80 cursor-pointer"
              >
                <Flame className="w-5 h-5 text-amber-300 animate-bounce" />
                <span>
                  {testingWill
                    ? "Rolando Animado Um por Um..."
                    : `Disparar Teste de Vontade em Massa (CD ${dcInput}${globalBonusInput !== 0 ? ` | Bônus: ${globalBonusInput >= 0 ? `+${globalBonusInput}` : globalBonusInput}` : ""})`}
                </span>
              </button>
            </div>
          </div>

          {/* Card 2: Combat Wounds Death/Survival */}
          <div className="bg-[#18070b] border-2 border-red-700 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-6 h-6 text-amber-400" />
                  <h3 className="font-medieval font-black text-base sm:text-lg text-amber-200">
                    Teste de Morte dos Feridos
                  </h3>
                </div>
                <span className="text-xs text-amber-300 uppercase font-bold tracking-wider bg-amber-950 border border-amber-600 px-3 py-1 rounded-md">
                  Ímpar: Morre | Par: Sobrevive
                </span>
              </div>

              <p className="text-sm text-gray-200 leading-relaxed mb-3 font-sans font-medium">
                Regra: Feridos não resgatados por um Curador testam a sorte: em
                resultado{" "}
                <strong className="text-red-400 font-bold">ímpar</strong> morrem
                de fato; em resultado{" "}
                <strong className="text-emerald-400 font-bold">par</strong>{" "}
                sobrevivem fora deste combate específico.
              </p>

              <div className="bg-black/70 border-2 border-red-900/80 rounded-lg p-3 mb-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-300 font-bold block uppercase">
                    Parceiros Feridos em Risco:
                  </span>
                  <span className="text-lg font-black font-mono text-amber-300">
                    {woundedNpcs.length} parceiro(s)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-300 font-bold block uppercase">
                    Curadores Ativos:
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-300">
                    {availableHealers.length} disponível(is)
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRollWounds}
              disabled={woundedNpcs.length === 0}
              className={`w-full py-3.5 rounded-xl font-medieval font-bold text-sm tracking-wider flex items-center justify-center gap-2.5 shadow-lg transition-all ${
                woundedNpcs.length > 0
                  ? "medieval-button-secondary border-amber-500 text-amber-100 hover:bg-amber-950 cursor-pointer"
                  : "bg-gray-900 text-gray-500 border border-gray-800 cursor-not-allowed"
              }`}
            >
              <Skull className="w-5 h-5 text-amber-300" />
              <span>
                Rolar Teste de Morte dos Feridos ({woundedNpcs.length})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Players Overview & Rosters */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-red-900/80 pb-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-black text-white font-medieval">
              Distribuição de Parceiros na Mesa
            </h3>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            <button
              onClick={() => setSelectedPlayerTab("all")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                selectedPlayerTab === "all"
                  ? "bg-red-700 text-white shadow-lg border border-red-400 font-bold"
                  : "bg-[#1e0a12] text-gray-300 hover:text-white border border-red-950"
              }`}
            >
              Todos ({allNpcs.length})
            </button>

            {state.players.map((p) => {
              const count = allNpcs.filter((n) => n.ownerId === p.id).length;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerTab(p.id)}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    selectedPlayerTab === p.id
                      ? "bg-red-700 text-white shadow-lg border border-red-400 font-bold"
                      : "bg-[#1e0a12] text-gray-300 hover:text-white border border-red-950"
                  }`}
                >
                  {p.name} ({count}/8)
                </button>
              );
            })}

            <button
              onClick={() => setSelectedPlayerTab("reserve")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                selectedPlayerTab === "reserve"
                  ? "bg-amber-800 text-white shadow-lg border border-amber-400 font-bold"
                  : "bg-[#1e0a12] text-gray-300 hover:text-white border border-red-950"
              }`}
            >
              Reserva ({allNpcs.filter((n) => !n.ownerId).length})
            </button>
          </div>
        </div>

        {/* NPC Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-5">
          {displayedNpcs.map((npc) => {
            const owner = state.players.find((p) => p.id === npc.ownerId);
            return (
              <div key={npc.id} className="relative">
                <div className="absolute -top-3 left-4 z-10 px-3 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-black border-2 border-red-600 shadow-md text-amber-300">
                  {owner ? `⚔️ ${owner.name}` : "🛡️ Na Reserva"}
                </div>
                <div className="pt-2">
                  <NpcCard
                    npc={npc}
                    isMaster={true}
                    isOwner={true}
                    onOpenTransfer={onOpenTransfer}
                    onOpenSpecial={onOpenSpecial}
                    onOpenRescue={onOpenRescue}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start New Combat Modal */}
      {showNewCombatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md medieval-panel p-6 rounded-xl border-2 border-amber-600 shadow-2xl">
            <h3 className="font-medieval font-bold text-xl text-white mb-2 flex items-center gap-2">
              <Swords className="w-6 h-6 text-amber-400" />
              <span>Iniciar Nova Instância de Combate</span>
            </h3>
            <p className="text-sm text-gray-200 leading-relaxed mb-4">
              Iniciar um novo combate restaurará à ativa todos os parceiros que
              foram resgatados ou sobreviveram ao combate anterior! Parceiros
              mortos permanecem mortos.
            </p>
            <form
              onSubmit={handleStartNewCombat}
              className="space-y-4 font-sans"
            >
              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase mb-1">
                  Nome da Instância de Combate:
                </label>
                <input
                  type="text"
                  value={newCombatName}
                  onChange={(e) => setNewCombatName(e.target.value)}
                  placeholder="Ex: Combate 2: O Enxame Lefeu"
                  className="w-full px-3.5 py-2 bg-black border-2 border-amber-600 rounded-lg text-sm text-white focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCombatModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 medieval-button-gold text-white font-black rounded-lg text-sm shadow"
                >
                  Iniciar Combate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md medieval-panel p-6 rounded-xl border-2 border-red-600 shadow-2xl">
            <h3 className="font-medieval font-bold text-xl text-white mb-2">
              Confirmar Reinício da Missão Final?
            </h3>
            <p className="text-sm text-gray-200 leading-relaxed mb-4">
              Isso resetará todos os 34 parceiros (removendo falhas de Vontade,
              curando feridos e mortos e limpando o draft). Os nomes dos
              jogadores serão preservados.
            </p>
            <form onSubmit={handleResetSession} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-bold text-red-300 uppercase mb-1">
                  Digite a senha de mestre para confirmar:
                </label>
                <input
                  type="password"
                  value={resetPin}
                  onChange={(e) => setResetPin(e.target.value)}
                  placeholder="PIN do Mestre (tormenta20)"
                  className="w-full px-3 py-2 bg-black border-2 border-red-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 hover:bg-red-600 text-white font-black rounded-lg text-sm shadow"
                >
                  Confirmar Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
