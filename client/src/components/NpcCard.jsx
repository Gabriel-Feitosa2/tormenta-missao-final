import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import {
  Shield,
  Heart,
  Skull,
  Swords,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';

export const NpcCard = ({
  npc,
  isOwner = false,
  isMaster = false,
  onOpenTransfer,
  onOpenSpecial,
  onOpenRescue,
}) => {
  const {
    currentUser,
    toggleNpcUsed,
    rollNpcAttack,
    healNpc,
    killNpc,
    reviveNpc,
    updateNpcFailures,
    updateNpcAvatar,
  } = useGame();

  const [rollingAttack, setRollingAttack] = useState(false);
  const [lastAttackResult, setLastAttackResult] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [extIdx, setExtIdx] = useState(0);

  const EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
  const customSrc = npc.avatar || npc.image;
  const imageSrc = customSrc || `/npcs/${npc.id}${EXTENSIONS[extIdx] || '.png'}`;

  useEffect(() => {
    setExtIdx(0);
    setImgError(false);
  }, [npc.id, npc.avatar, npc.image]);

  const handleImageError = () => {
    if (!customSrc && extIdx + 1 < EXTENSIONS.length) {
      setExtIdx((prev) => prev + 1);
    } else {
      setImgError(true);
    }
  };

  const cleanName = (npc.name || npc.id || '').replace(/[^a-zA-Z0-9]/g, '');
  const initials =
    cleanName.length >= 2 ? cleanName.substring(0, 2).toUpperCase() : cleanName.toUpperCase() || 'NPC';

  const handleEditAvatar = () => {
    if (!isMaster) return;
    const current = npc.avatar || `/npcs/${npc.id}.png`;
    const newUrl = window.prompt(`Caminho local ou URL da imagem para ${npc.name}:`, current);
    if (newUrl !== null && newUrl.trim() !== '') {
      updateNpcAvatar(npc.id, newUrl.trim());
    }
  };

  const handleToggleUsed = () => {
    if (!isOwner && !isMaster) return;
    toggleNpcUsed(npc.id, !npc.usedThisRound);
  };

  const handleAttack = async () => {
    if (npc.status === 'dead' || npc.status === 'withdrawn' || !npc.attackDice) return;
    setRollingAttack(true);
    const actor = currentUser ? currentUser.name : 'Jogador';
    const res = await rollNpcAttack(npc.id, actor);
    if (res.success) {
      setLastAttackResult(res.result);
      setTimeout(() => setLastAttackResult(null), 6000);
    }
    setRollingAttack(false);
  };

  const handleHeal = async () => {
    await healNpc(npc.id, currentUser ? `${currentUser.name} (Curativo/Magia)` : 'Curativo');
  };

  const handleKill = async () => {
    if (!isMaster) return;
    if (window.confirm(`Mestre: Tem certeza que deseja MATAR o parceiro ${npc.name}?`)) {
      await killNpc(npc.id, 'Decreto do Mestre');
    }
  };

  const handleRevive = async () => {
    if (!isMaster) return;
    await reviveNpc(npc.id, true);
  };

  const isDead = npc.status === 'dead' || npc.willFailures >= 3;
  const isWounded = npc.status === 'wounded';
  const isWithdrawn = npc.status === 'withdrawn';
  const isAlive = npc.status === 'alive' && !isDead;

  return (
    <div
      className={`relative rounded-xl border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-2xl ${
        isDead
          ? 'bg-[#18060a]/95 border-red-950 opacity-75'
          : isWithdrawn
          ? 'bg-[#0a141e]/95 border-blue-600/80 shadow-blue-950/60'
          : isWounded
          ? 'bg-[#22100a]/95 border-amber-600 shadow-amber-950/60 ring-1 ring-amber-500/50'
          : npc.usedThisRound
          ? 'bg-[#2b0e19]/95 border-red-500 shadow-red-950/80 ring-2 ring-red-500/60'
          : 'bg-[#1c0a11]/95 border-red-800/80 hover:border-red-500 hover:shadow-red-950/70'
      }`}
    >
      {/* Top Section: Protótipo 2 (Retrato Vertical Gótico 3:4 + Info à Direita) */}
      <div className="p-3.5 pb-3 flex items-start gap-3 bg-gradient-to-b from-[#220710] to-transparent border-b border-red-950/80">
        {/* 3:4 Vertical Gothic Portrait Frame */}
        <div className="relative shrink-0 w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden border-2 border-red-700/90 shadow-[0_4px_16px_rgba(0,0,0,0.8)] bg-black ring-1 ring-amber-500/40 group select-none">
          {!imgError ? (
            <img
              src={imageSrc}
              alt={npc.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-red-950 via-[#200710] to-[#14060b] flex flex-col items-center justify-center relative p-1 text-center">
              {npc.isHealer ? (
                <Heart className="w-12 h-12 text-emerald-500/20 absolute" />
              ) : npc.attack ? (
                <Swords className="w-12 h-12 text-red-500/20 absolute" />
              ) : (
                <Shield className="w-12 h-12 text-amber-500/20 absolute" />
              )}
              <span className="font-medieval font-black text-3xl text-amber-300/80 tracking-wider relative z-10 drop-shadow">
                {initials}
              </span>
              <span className="text-[9px] text-gray-400 font-sans tracking-tight uppercase mt-1 z-10 leading-tight">
                {npc.id}.png
              </span>
            </div>
          )}

          {/* Bottom subtle gradient on portrait */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent h-8 pointer-events-none"></div>

          {/* Dead skull watermark overlay */}
          {isDead && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <Skull className="w-12 h-12 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
            </div>
          )}

          {/* Edit avatar button for GM */}
          {isMaster && (
            <button
              onClick={handleEditAvatar}
              className="absolute top-1.5 right-1.5 p-1 rounded bg-black/80 hover:bg-black text-gray-300 hover:text-amber-300 border border-red-800 shadow text-xs transition-colors cursor-pointer z-10"
              title="Alterar caminho ou URL da imagem deste NPC"
            >
              📷
            </button>
          )}
        </div>

        {/* Right Info Block */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
          {/* Header Row: Name & Status */}
          <div>
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                <h3 className="font-medieval font-black text-xl text-white tracking-wide truncate drop-shadow">
                  {npc.name}
                </h3>
                <span className="text-[11px] text-red-300 font-semibold block leading-tight">
                  (ignora RD de Lefeu)
                </span>
              </div>

              {/* Status Badge & Master Quick Action */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isDead ? (
                  <span className="px-2 py-0.5 bg-red-950/90 border border-red-600 text-red-300 text-[10px] font-black rounded-md flex items-center gap-1 shadow">
                    <Skull className="w-3 h-3 text-red-500" /> MORTO
                  </span>
                ) : isWithdrawn ? (
                  <span className="px-2 py-0.5 bg-blue-950/90 border border-blue-500 text-blue-200 text-[10px] font-black rounded-md flex items-center gap-1 shadow">
                    <ShieldCheck className="w-3 h-3 text-blue-400" /> SALVO
                  </span>
                ) : isWounded ? (
                  <span className="px-2 py-0.5 bg-amber-950/90 border border-amber-500 text-amber-200 text-[10px] font-black rounded-md flex items-center gap-1 shadow animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-amber-400" /> FERIDO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-950/90 border border-emerald-600 text-emerald-300 text-[10px] font-black rounded-md flex items-center gap-1 shadow">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ATIVO
                  </span>
                )}

                {/* Master Quick Kill / Revive Button */}
                {isMaster && (
                  <button
                    onClick={isDead ? handleRevive : handleKill}
                    className={`p-1 rounded-md border text-xs shadow transition-all cursor-pointer ${
                      isDead
                        ? 'bg-emerald-950/90 hover:bg-emerald-800 border-emerald-500 text-emerald-300'
                        : 'bg-red-950/90 hover:bg-red-900 border-red-600 text-red-400 hover:text-white'
                    }`}
                    title={
                      isDead
                        ? `Reviver ${npc.name} automaticamente (Mestre)`
                        : `Matar ${npc.name} automaticamente (Mestre)`
                    }
                  >
                    {isDead ? <Sparkles className="w-3.5 h-3.5" /> : <Skull className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Tags Row */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <span className="px-2 py-0.5 bg-red-950/90 border border-red-500 text-red-200 text-[10px] font-bold uppercase rounded shadow">
                ⚔️ Aço Rubi
              </span>
              {npc.isIntimate && (
                <span
                  className="px-2 py-0.5 bg-amber-950/90 border border-amber-400 text-amber-300 text-[10px] font-bold uppercase rounded shadow"
                  title="Parceiro Íntimo: Bônus acumula mesmo repetido!"
                >
                  ★ Íntimo
                </span>
              )}
              {npc.isHealer && (
                <span
                  className="px-2 py-0.5 bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-[10px] font-bold uppercase rounded shadow flex items-center gap-1"
                  title="Curandeiro: Capaz de resgatar parceiros feridos com segurança"
                >
                  <Heart className="w-3 h-3 text-emerald-400" /> Curador
                </span>
              )}
            </div>
          </div>

          {/* Compact Stat Grid: Vontade & Falhas */}
          <div className="grid grid-cols-2 gap-2 pt-2 mt-auto">
            {/* Vontade Box */}
            <div className="bg-black/80 p-2 rounded-lg border border-red-900/80 text-center shadow-inner flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 block leading-tight">Vontade</span>
              {npc.isImmune ? (
                <span className="text-purple-300 font-black text-xs sm:text-sm">IMUNE</span>
              ) : (
                <span className="text-amber-300 font-mono font-black text-base sm:text-lg leading-tight">
                  +{npc.will}
                </span>
              )}
            </div>

            {/* Falhas Box with Skull Tracker */}
            <div className="bg-black/80 p-1.5 rounded-lg border border-red-900/80 flex flex-col items-center justify-center shadow-inner">
              <div className="flex items-center justify-between w-full px-1 mb-0.5">
                <span className="text-[10px] uppercase font-bold text-gray-400 leading-tight">Falhas</span>
                <span
                  className={`text-xs font-mono font-black ${
                    npc.willFailures === 0
                      ? 'text-emerald-400'
                      : npc.willFailures === 1
                      ? 'text-amber-400'
                      : npc.willFailures === 2
                      ? 'text-orange-500 animate-pulse'
                      : 'text-red-500 font-black'
                  }`}
                >
                  {npc.willFailures}/3
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((num) => {
                  const isFailed = npc.willFailures >= num;
                  return (
                    <button
                      key={num}
                      disabled={!isMaster}
                      onClick={() =>
                        isMaster &&
                        updateNpcFailures(npc.id, npc.willFailures === num ? num - 1 : num)
                      }
                      className={`p-0.5 rounded transition-all ${
                        isFailed
                          ? 'text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.9)] scale-110'
                          : 'text-gray-600 hover:text-gray-400'
                      } ${isMaster ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
                      title={isMaster ? `Clique para alterar falhas para ${num}` : `Falha ${num}/3`}
                    >
                      <Skull className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 pt-2 flex-1 flex flex-col justify-between space-y-2.5">

        {/* Bonus Description */}
        <div className="text-sm text-gray-100 bg-black/70 rounded-lg p-3 border border-red-900/60 leading-relaxed min-h-[58px] font-sans font-medium">
          <strong className="text-amber-300 font-bold block mb-1 text-xs uppercase tracking-wider font-medieval">
            Bônus de Parceiro:
          </strong>
          <span>{npc.bonus || 'Nenhum bônus passivo listado.'}</span>
        </div>

        {/* Special Rules Indicator */}
        {npc.special && (
          <div className="mt-2 text-xs text-amber-200/95 bg-amber-950/40 border border-amber-800/80 rounded-lg p-2.5 flex items-start gap-2 leading-relaxed font-sans">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{npc.special}</span>
          </div>
        )}

        {/* Withdrawn Notice */}
        {isWithdrawn && (
          <div className="mt-2 text-xs text-blue-200 bg-blue-950/40 border border-blue-700/80 rounded-lg p-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Retirado do combate atual. Salvo do teste de morte e vivo para a próxima batalha.</span>
          </div>
        )}
      </div>

      {/* Attack Result Banner if just rolled */}
      {lastAttackResult && (
        <div className="mx-4 my-1.5 p-2.5 rounded-lg bg-red-950 border-2 border-red-500 text-sm text-white animate-in fade-in flex items-center justify-between shadow-lg">
          <span>
            🎲 <strong>Dano: {lastAttackResult.total}</strong> ({lastAttackResult.formula} = [
            {lastAttackResult.rolls.join(', ')}]
            {lastAttackResult.bonus ? ` + ${lastAttackResult.bonus}` : ''})
          </span>
          <span className="text-xs text-amber-300 uppercase font-black">Aço Rubi</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="p-3.5 pt-2 bg-[#120509] border-t-2 border-red-950 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Turn Checkbox or Status buttons */}
        <div className="flex items-center gap-2">
          {isAlive && (isOwner || isMaster) ? (
            <label
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold cursor-pointer select-none transition-all ${
                npc.usedThisRound
                  ? 'bg-red-800 text-white border-2 border-red-400 shadow-md'
                  : 'bg-[#240d16] text-gray-200 hover:text-white border-2 border-red-900/80'
              }`}
              title="Marque se este parceiro recebeu ordens nesta rodada"
            >
              <input
                type="checkbox"
                checked={npc.usedThisRound || false}
                onChange={handleToggleUsed}
                className="w-4 h-4 rounded border-red-600 text-red-600 accent-red-600 cursor-pointer"
              />
              <span>{npc.usedThisRound ? 'Ordem Dada' : 'Dar Ordem'}</span>
            </label>
          ) : isWounded ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenRescue && onOpenRescue(npc)}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 border-2 border-emerald-400 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-md"
                title="Usar um Curador para resgatar este parceiro em segurança"
              >
                <Heart className="w-3.5 h-3.5 text-emerald-300" />
                <span>Resgatar (Curador)</span>
              </button>
              <button
                onClick={handleHeal}
                className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 text-xs font-bold rounded-lg flex items-center gap-1"
                title="Curar normalmente via item/magia"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Curar</span>
              </button>
            </div>
          ) : null}

          {/* Master Kill / Revive Buttons in Action Footer */}
          {isMaster && (
            isDead ? (
              <button
                onClick={handleRevive}
                className="px-3.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 border-2 border-emerald-500 text-emerald-100 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
                title="Reviver parceiro automaticamente e zerar falhas (Controle de Mestre)"
              >
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>Reviver (Mestre)</span>
              </button>
            ) : (
              <button
                onClick={handleKill}
                className="px-2.5 py-1.5 bg-red-950/90 hover:bg-red-900 border-2 border-red-600/90 text-red-300 hover:text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow transition-all cursor-pointer"
                title="Matar este parceiro automaticamente (Controle de Mestre)"
              >
                <Skull className="w-3.5 h-3.5 text-red-400" />
                <span>Matar</span>
              </button>
            )
          )}
        </div>

        {/* Right: Attack button and Special Modals */}
        <div className="flex items-center gap-2">
          {/* Attack Button */}
          {npc.attack && !isDead && !isWithdrawn && (
            <button
              onClick={handleAttack}
              disabled={rollingAttack || isWounded}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 medieval-button shadow ${
                isWounded ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={`Rolar ataque: ${npc.attack}`}
            >
              <Swords className="w-4 h-4 text-amber-200" />
              <span>{npc.attack}</span>
            </button>
          )}

          {/* Special Buttons for Borus, Rizzelena, Lisandra */}
          {['borus', 'rizzelena', 'lisandra'].includes(npc.id) && !isDead && !isWithdrawn && (
            <button
              onClick={() => onOpenSpecial && onOpenSpecial(npc)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold medieval-button-gold flex items-center gap-1.5 shadow"
              title="Habilidade especial deste parceiro"
            >
              <Sparkles className="w-4 h-4 text-amber-100" />
              <span>Especial</span>
            </button>
          )}

          {/* Transfer Button */}
          {(isOwner || isMaster) && !isDead && !isWithdrawn && (
            <button
              onClick={() => onOpenTransfer && onOpenTransfer(npc)}
              className="p-2 rounded-lg text-gray-300 hover:text-amber-300 hover:bg-black/60 transition-colors border border-transparent hover:border-amber-600/60"
              title="Transferir / Passar parceiro para outro jogador"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
