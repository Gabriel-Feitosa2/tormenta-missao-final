import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
  Sparkles,
  Flame,
  Utensils,
  Dices,
  Trees,
  Check,
  AlertTriangle,
  X,
  Swords,
} from 'lucide-react';

export const SpecialModal = ({ npc, onClose }) => {
  const {
    currentUser,
    toggleBorusWerewolf,
    rollBorusControl,
    rollRizzelenaFood,
    selectLisandraOption,
  } = useGame();

  const [rolling, setRolling] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);

  if (!npc) return null;

  const actorName = currentUser ? currentUser.name : 'Jogador';

  // --- BORUS ---
  const handleToggleWerewolf = async () => {
    await toggleBorusWerewolf(npc.id, !npc.borusWerewolf);
  };

  const handleBorusControl = async () => {
    setRolling(true);
    const res = await rollBorusControl(actorName);
    if (res.success) {
      setResultMessage(
        res.result.lostControl
          ? `💀 Rolou ${res.result.d10}! Borus PERDEU O CONTROLE e ataca ferozmente quem estiver na frente!`
          : `🛡️ Rolou ${res.result.d10}! Borus manteve o controle da fúria lupina.`
      );
    }
    setRolling(false);
  };

  // --- RIZZELENA ---
  const handleRizzelenaFood = async () => {
    setRolling(true);
    const res = await rollRizzelenaFood(actorName);
    if (res.success) {
      setResultMessage(
        `🍲 Rolou ${res.result.roll} na mesa de comidas! Efeito recebido: ${res.result.effect}.`
      );
    }
    setRolling(false);
  };

  // --- LISANDRA ---
  const handleLisandraSelect = async (optionId) => {
    setRolling(true);
    const res = await selectLisandraOption(actorName, optionId);
    if (res.success) {
      if (res.result.extraRoll) {
        setResultMessage(
          `🌿 Força da Natureza ativada: ${res.result.opt.title}! Rolou 8d8+15: [${res.result.extraRoll.rolls.join(
            ', '
          )}] + 15 = ${res.result.extraRoll.total} de Dano de Natureza (Aço Rubi)!`
        );
      } else {
        setResultMessage(
          `🌿 Força da Natureza ativada: ${res.result.opt.title} (${res.result.opt.description})!`
        );
      }
    }
    setRolling(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg medieval-panel rounded-lg border border-amber-600/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-amber-950 to-black px-6 py-4 border-b border-amber-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-medieval font-bold text-base text-amber-100">
                Habilidade Especial: {npc.name}
              </h3>
              <span className="text-[11px] text-amber-300/80">Regras únicas da Missão Final</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Result Alert if just rolled */}
          {resultMessage && (
            <div className="p-3 bg-red-950/90 border border-amber-500 rounded text-xs text-amber-200 animate-in fade-in leading-relaxed">
              {resultMessage}
            </div>
          )}

          {/* BORUS */}
          {npc.id === 'borus' && (
            <div className="space-y-4">
              <div className="p-3 bg-black/50 border border-red-900 rounded text-xs text-gray-300 leading-relaxed">
                <strong>Modo Lobisomem (1x por cena):</strong> Transforma o bônus de Borus em +4 de ataque e +2d6 dano cc. O ataque de Borus passa a ser <strong>6d8+6</strong>.
                Ao final de cada turno como lobisomem, o controlador rola <strong>1d10</strong>: se 1 ou 2, Borus perde o controle!
              </div>

              <div className="flex items-center justify-between p-3 bg-red-950/40 border border-red-800 rounded">
                <div>
                  <span className="font-medieval font-bold text-sm text-red-200 block">
                    Status: {npc.borusWerewolf ? '🐺 MODO LOBISOMEM ATIVO' : 'HUMANO'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {npc.borusWerewolf ? 'Ataque: 6d8+6 | Risco de perda de controle' : 'Ataque normal: 3d8'}
                  </span>
                </div>

                <button
                  onClick={handleToggleWerewolf}
                  className={`px-3 py-1.5 rounded text-xs font-bold ${
                    npc.borusWerewolf
                      ? 'bg-amber-900 hover:bg-amber-800 text-amber-100 border border-amber-600'
                      : 'medieval-button'
                  }`}
                >
                  {npc.borusWerewolf ? 'Desativar Lobisomem' : 'Transformar em Lobisomem'}
                </button>
              </div>

              {npc.borusWerewolf && (
                <div className="pt-2">
                  <button
                    onClick={handleBorusControl}
                    disabled={rolling}
                    className="w-full py-2.5 medieval-button text-xs font-bold rounded flex items-center justify-center gap-2"
                  >
                    <Dices className="w-4 h-4 text-amber-300" />
                    <span>Rolar Teste de Controle do Lobisomem (1d10)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* RIZZELENA */}
          {npc.id === 'rizzelena' && (
            <div className="space-y-4">
              <div className="p-3 bg-black/50 border border-red-900 rounded text-xs text-gray-300 leading-relaxed">
                <strong>Comidas da Rizzelena:</strong> Na sua rodada, pague <strong>2 PM</strong> para receber um efeito aleatório da tabela de comidas (1d6). Os efeitos acumulam (exceto 3 e 6; se tirar repetido, role novamente).
              </div>

              {/* Table Reference */}
              <div className="bg-[#12070a] border border-red-950 rounded p-2.5 text-[11px] space-y-1 font-mono">
                <div>1: +35 PV temporários</div>
                <div>2: +10 PM temporários</div>
                <div>3: +2 em teste de resistências até o fim da cena</div>
                <div>4: +1d6 em um teste à sua escolha até o fim do dia</div>
                <div>5: +35 PV e +10 PM temporários</div>
                <div>6: -1 de custo de PM para habilidades de classe</div>
              </div>

              <button
                onClick={handleRizzelenaFood}
                disabled={rolling}
                className="w-full py-2.5 medieval-button-gold text-xs font-bold rounded flex items-center justify-center gap-2 shadow-lg"
              >
                <Utensils className="w-4 h-4 text-amber-200" />
                <span>Pagar 2 PM e Rolar Comida (1d6)</span>
              </button>
            </div>
          )}

          {/* LISANDRA */}
          {npc.id === 'lisandra' && (
            <div className="space-y-4">
              <div className="p-3 bg-black/50 border border-red-900 rounded text-xs text-gray-300 leading-relaxed">
                <strong>Força da Natureza:</strong> Lisandra não funciona como um parceiro comum, ela é uma força da natureza viva. No <strong>início da rodada de CADA JOGADOR</strong>, ele escolhe um dos efeitos para si:
              </div>

              <div className="space-y-2">
                {[
                  { id: 'heal_50', title: 'Curar 50 PV', desc: 'Recupera 50 pontos de vida do personagem.' },
                  { id: 'mana_5', title: 'Recuperar 5 PM', desc: 'Restaura 5 pontos de mana.' },
                  { id: 'tests_2', title: '+2 em Testes', desc: 'Bônus de +2 em todos os testes pela rodada.' },
                  { id: 'attacks_4', title: '+4 em Ataques', desc: 'Bônus de +4 em testes de ataque pela rodada.' },
                  {
                    id: 'damage_burst',
                    title: 'Explosão de Natureza (8d8+15)',
                    desc: 'Causa 8d8+15 de dano em alcance curto (Aço Rubi ignora RD de Lefeu).',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleLisandraSelect(opt.id)}
                    disabled={rolling}
                    className="w-full p-2.5 rounded bg-[#16080d] hover:bg-red-950/80 border border-red-900/60 hover:border-amber-600/80 text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-medieval font-bold text-xs text-amber-200 block group-hover:text-amber-100">
                        {opt.title}
                      </span>
                      <span className="text-[11px] text-gray-400">{opt.desc}</span>
                    </div>
                    <span className="px-2 py-1 bg-red-950 border border-red-700 text-red-200 text-[10px] font-bold rounded group-hover:bg-red-900">
                      Ativar
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
