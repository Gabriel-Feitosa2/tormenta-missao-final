import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const NPCS_FILE = path.join(DATA_DIR, 'npcs.json');
const SESSION_FILE = path.join(DATA_DIR, 'session.json');

const INITIAL_PLAYERS = [
  { id: 'player-1', name: 'Jogador 1', characterName: 'Personagem 1' },
  { id: 'player-2', name: 'Jogador 2', characterName: 'Personagem 2' },
  { id: 'player-3', name: 'Jogador 3', characterName: 'Personagem 3' },
  { id: 'player-4', name: 'Jogador 4', characterName: 'Personagem 4' },
  { id: 'player-5', name: 'Jogador 5', characterName: 'Personagem 5' },
];

const RIZZELENA_TABLE = [
  { roll: 1, effect: '+35 PV temporários', accumulable: true },
  { roll: 2, effect: '+10 PM temporários', accumulable: true },
  { roll: 3, effect: '+2 em teste de resistências até o fim da cena', accumulable: false },
  { roll: 4, effect: '+1d6 em um teste à sua escolha até o fim do dia', accumulable: true },
  { roll: 5, effect: '+35 PV e +10 PM temporários', accumulable: true },
  { roll: 6, effect: '-1 de custo de PM para habilidades de classe', accumulable: false },
];

const LISANDRA_OPTIONS = [
  { id: 'heal_50', title: 'Curar 50 PV', description: 'Cura 50 pontos de vida do personagem.' },
  { id: 'mana_5', title: 'Recuperar 5 PM', description: 'Recupera 5 pontos de mana.' },
  { id: 'tests_2', title: '+2 em Testes', description: 'Ganha +2 em todos os testes pela rodada.' },
  { id: 'attacks_4', title: '+4 em Ataques', description: 'Ganha +4 em testes de ataque pela rodada.' },
  { id: 'damage_burst', title: 'Explosão Natural (8d8+15)', description: 'Causa 8d8+15 de dano em alcance curto (Aço Rubi ignora RD de Lefeu).' },
];

class StateManager {
  constructor() {
    this.state = null;
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(SESSION_FILE)) {
      try {
        const raw = fs.readFileSync(SESSION_FILE, 'utf-8');
        this.state = JSON.parse(raw);
        // Ensure new schema fields exist if upgrading
        if (!this.state.combatInstance) {
          this.state.combatInstance = { id: 1, name: 'Combate 1: Entrada na Tormenta', active: true };
        }
        if (this.state.combatTurn === undefined) {
          this.state.combatTurn = this.state.combatRound || 1;
        }
        if (this.state.willGlobalBonus === undefined) {
          this.state.willGlobalBonus = 0;
        }
        delete this.state.combatWave;
        delete this.state.combatRound;

        // Ensure avatars exist on all NPCs and dynamically match files on disk
        this.refreshAvatarsFromDisk();

        console.log('[StateManager] Sessão recuperada com sucesso.');
        return;
      } catch (err) {
        console.error('[StateManager] Erro ao ler session.json, recriando...', err);
      }
    }

    this.resetState();
  }

  resetState() {
    const rawNpcs = JSON.parse(fs.readFileSync(NPCS_FILE, 'utf-8'));
    const npcs = {};

    rawNpcs.forEach((npc) => {
      npcs[npc.id] = {
        ...npc,
        avatar: npc.avatar || `/npcs/${npc.id}.png`,
        ownerId: null,
        status: 'alive', // 'alive' | 'wounded' | 'withdrawn' | 'dead'
        willFailures: 0, // 0 to 3
        usedThisRound: false,
        borusWerewolf: false,
        borusLostControl: false,
        riverStreak: 1,
        activeBuffs: [],
      };
    });

    this.state = {
      version: 2,
      masterPin: process.env.MASTER_PIN || 'tormenta20',
      willTestDC: 20,
      willGlobalBonus: 0,
      combatInstance: { id: 1, name: 'Combate 1: Entrada na Tormenta', active: true },
      combatTurn: 1,
      players: INITIAL_PLAYERS.map((p) => ({ ...p })),
      npcs,
      combatLogs: [
        {
          id: 'init-log',
          timestamp: new Date().toISOString(),
          type: 'system',
          severity: 'info',
          title: 'A Missão Final Começou',
          message: 'Painel de Parceiros de Tormenta inicializado. Que os deuses tenham piedade de Arton.',
        },
      ],
      lastWillTest: null,
      lastWoundsTest: null,
    };

    this.refreshAvatarsFromDisk();
    this.save();
    console.log('[StateManager] Novo estado inicializado e salvo.');
  }

  refreshAvatarsFromDisk() {
    const publicNpcs = path.join(__dirname, '..', 'client', 'public', 'npcs');
    if (!fs.existsSync(publicNpcs) || !this.state?.npcs) return;
    try {
      const files = fs.readdirSync(publicNpcs);
      const VALID_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
      Object.values(this.state.npcs).forEach((npc) => {
        // Auto-resolve if empty or pointing to default /npcs/ path
        if (!npc.avatar || npc.avatar.startsWith('/npcs/')) {
          const match = files.find((f) => {
            const parsed = path.parse(f);
            return (
              parsed.name.toLowerCase() === npc.id.toLowerCase() &&
              VALID_EXTS.includes(parsed.ext.toLowerCase())
            );
          });
          if (match) {
            npc.avatar = `/npcs/${match}`;
          } else if (!npc.avatar) {
            npc.avatar = `/npcs/${npc.id}.png`;
          }
        }
      });
    } catch (e) {
      console.error('[StateManager] Erro ao sincronizar avatares:', e);
    }
  }

  save() {
    try {
      fs.writeFileSync(SESSION_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[StateManager] Erro ao salvar sessão no disco:', err);
    }
  }

  getState() {
    this.refreshAvatarsFromDisk();
    return this.state;
  }

  addLog(entry) {
    const logItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.state.combatLogs.unshift(logItem);
    if (this.state.combatLogs.length > 200) {
      this.state.combatLogs = this.state.combatLogs.slice(0, 200);
    }
    return logItem;
  }

  updatePlayer(playerId, updates) {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return null;

    if (updates.name !== undefined) player.name = updates.name.trim() || player.name;
    if (updates.characterName !== undefined) player.characterName = updates.characterName.trim() || player.characterName;

    this.addLog({
      type: 'system',
      severity: 'info',
      title: 'Slot Atualizado',
      message: `${player.name} (${player.characterName}) atualizou seus dados.`,
    });

    this.save();
    return player;
  }

  claimNpc(playerId, npcId) {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) throw new Error('Jogador não encontrado.');

    const npc = this.state.npcs[npcId];
    if (!npc) throw new Error('NPC não encontrado.');

    if (npc.ownerId && npc.ownerId !== playerId) {
      const currentOwner = this.state.players.find((p) => p.id === npc.ownerId);
      throw new Error(`Este parceiro já pertence a ${currentOwner ? currentOwner.name : 'outro jogador'}.`);
    }

    const currentOwnedCount = Object.values(this.state.npcs).filter((n) => n.ownerId === playerId).length;
    if (currentOwnedCount >= 8 && npc.ownerId !== playerId) {
      throw new Error('Limite máximo de 8 parceiros atingido para este jogador.');
    }

    npc.ownerId = playerId;

    this.addLog({
      type: 'draft',
      severity: 'info',
      title: 'Parceiro Recrutado',
      message: `${player.name} recrutou ${npc.name} para o seu time de parceiros.`,
    });

    this.save();
    return npc;
  }

  releaseNpc(npcId) {
    const npc = this.state.npcs[npcId];
    if (!npc) throw new Error('NPC não encontrado.');

    const oldOwner = this.state.players.find((p) => p.id === npc.ownerId);
    npc.ownerId = null;
    npc.usedThisRound = false;

    this.addLog({
      type: 'draft',
      severity: 'info',
      title: 'Parceiro Liberado',
      message: `${npc.name} foi devolvido para a reserva${oldOwner ? ` por ${oldOwner.name}` : ''}.`,
    });

    this.save();
    return npc;
  }

  transferNpc(fromPlayerId, toPlayerId, npcId) {
    const fromPlayer = this.state.players.find((p) => p.id === fromPlayerId);
    const toPlayer = this.state.players.find((p) => p.id === toPlayerId);
    if (!fromPlayer || !toPlayer) throw new Error('Jogador de origem ou destino inválido.');

    const npc = this.state.npcs[npcId];
    if (!npc) throw new Error('NPC não encontrado.');
    if (npc.ownerId !== fromPlayerId) throw new Error('O NPC não pertence a este jogador.');

    const targetOwnedCount = Object.values(this.state.npcs).filter((n) => n.ownerId === toPlayerId).length;
    if (targetOwnedCount >= 8) {
      throw new Error(`${toPlayer.name} já possui o limite de 8 parceiros.`);
    }

    npc.ownerId = toPlayerId;

    this.addLog({
      type: 'trade',
      severity: 'warning',
      title: 'Parceiro Transferido',
      message: `${fromPlayer.name} transferiu o comando de ${npc.name} para ${toPlayer.name}.`,
    });

    this.save();
    return npc;
  }

  toggleNpcUsed(npcId, isUsed) {
    const npc = this.state.npcs[npcId];
    if (!npc) throw new Error('NPC não encontrado.');
    npc.usedThisRound = isUsed !== undefined ? isUsed : !npc.usedThisRound;
    this.save();
    return npc;
  }

  setWillDC(newDC) {
    const dc = parseInt(newDC, 10);
    if (isNaN(dc) || dc < 1) throw new Error('CD inválida.');
    this.state.willTestDC = dc;

    this.addLog({
      type: 'system',
      severity: 'warning',
      title: 'Dificuldade da Tormenta Alterada',
      message: `O Mestre definiu a CD do Teste de Vontade para ${dc}.`,
    });

    this.save();
    return dc;
  }

  setWillGlobalBonus(bonus) {
    const val = parseInt(bonus, 10) || 0;
    this.state.willGlobalBonus = val;

    this.addLog({
      type: 'system',
      severity: 'info',
      title: 'Bônus Global de Vontade Ajustado',
      message: `O Mestre ajustou o Bônus Global de Vontade para ${val >= 0 ? `+${val}` : val}.`,
    });

    this.save();
    return val;
  }

  rollWillTest({ dc, globalBonus, targetMode = 'active' }) {
    const targetDC = dc !== undefined ? parseInt(dc, 10) : this.state.willTestDC;
    this.state.willTestDC = targetDC;

    if (globalBonus !== undefined) {
      this.state.willGlobalBonus = parseInt(globalBonus, 10) || 0;
    }
    const currentGlobalBonus = this.state.willGlobalBonus || 0;

    const allNpcs = Object.values(this.state.npcs);
    const targets = allNpcs.filter((npc) => {
      if (npc.status === 'dead') return false; // dead partners don't test
      if (targetMode === 'active') return npc.ownerId !== null;
      return true; // all alive/wounded/withdrawn in the session
    });

    if (targets.length === 0) {
      throw new Error('Nenhum parceiro vivo disponível para o teste.');
    }

    let totalPassed = 0;
    let totalFailed = 0;
    let totalDied = 0;
    const results = [];

    targets.forEach((npc) => {
      const owner = this.state.players.find((p) => p.id === npc.ownerId);
      const ownerName = owner ? owner.name : 'Reserva';

      if (npc.isImmune) {
        results.push({
          npcId: npc.id,
          npcName: npc.name,
          ownerName,
          roll: null,
          baseWill: 'Imune',
          globalBonus: 0,
          total: null,
          dc: targetDC,
          passed: true,
          isImmune: true,
          oldFailures: npc.willFailures,
          newFailures: npc.willFailures,
          isDead: false,
        });
        totalPassed++;
        return;
      }

      const roll = Math.floor(Math.random() * 20) + 1;
      const baseWill = typeof npc.will === 'number' ? npc.will : 0;
      const total = roll + baseWill + currentGlobalBonus;
      const passed = total >= targetDC;

      const oldFailures = npc.willFailures;
      let newFailures = oldFailures;
      let isDead = false;

      if (passed) {
        totalPassed++;
      } else {
        totalFailed++;
        newFailures = Math.min(3, oldFailures + 1);
        npc.willFailures = newFailures;
        if (newFailures >= 3) {
          npc.status = 'dead';
          isDead = true;
          totalDied++;
        }
      }

      results.push({
        npcId: npc.id,
        npcName: npc.name,
        ownerName,
        roll,
        baseWill,
        globalBonus: currentGlobalBonus,
        total,
        dc: targetDC,
        passed,
        isImmune: false,
        oldFailures,
        newFailures,
        isDead,
      });
    });

    this.state.lastWillTest = {
      timestamp: new Date().toISOString(),
      dc: targetDC,
      globalBonus: currentGlobalBonus,
      targetMode,
      totalTargets: targets.length,
      totalPassed,
      totalFailed,
      totalDied,
      results,
    };

    let logTitle = `Teste de Vontade da Tormenta (CD ${targetDC}${currentGlobalBonus !== 0 ? ` | Bônus Global: ${currentGlobalBonus >= 0 ? `+${currentGlobalBonus}` : currentGlobalBonus}` : ''})`;
    let logSeverity = totalDied > 0 ? 'danger' : totalFailed > 0 ? 'warning' : 'success';
    let summaryMsg = `${results.length} parceiros testados: ${totalPassed} Sucessos, ${totalFailed} Falhas.`;
    if (totalDied > 0) {
      const deadNames = results.filter((r) => r.isDead).map((r) => r.npcName).join(', ');
      summaryMsg += ` 💀 ${totalDied} parceiro(s) sucumbiram à Tormenta: ${deadNames}!`;
    }

    this.addLog({
      type: 'will_test',
      severity: logSeverity,
      title: logTitle,
      message: summaryMsg,
      details: { dc: targetDC, globalBonus: currentGlobalBonus, results },
    });

    this.save();
    return this.state.lastWillTest;
  }

  updateNpcFailures(npcId, newFailures) {
    const npc = this.state.npcs[npcId];
    if (!npc) throw new Error('NPC não encontrado.');

    const failures = Math.max(0, Math.min(3, parseInt(newFailures, 10)));
    npc.willFailures = failures;
    if (failures >= 3) {
      npc.status = 'dead';
    } else if (npc.status === 'dead' && failures < 3) {
      npc.status = 'alive';
    }

    this.addLog({
      type: 'system',
      severity: failures === 3 ? 'danger' : 'info',
      title: 'Ajuste de Falhas de Vontade',
      message: `O Mestre ajustou as falhas de Vontade de ${npc.name} para ${failures}/3.${failures >= 3 ? ' (Morto)' : ''}`,
    });

    this.save();
    return npc;
  }

  updateNpcAvatar(npcId, avatarUrl) {
    const npc = this.state.npcs[npcId];
    if (!npc) throw new Error('NPC não encontrado.');

    npc.avatar = avatarUrl || `/npcs/${npc.id}.png`;
    this.addLog({
      type: 'system',
      severity: 'info',
      title: 'Retrato do Parceiro Atualizado',
      message: `O retrato de ${npc.name} foi atualizado.`,
    });

    this.save();
    return npc;
  }

  healNpc(npcId, healerInfo = 'Cura / Magia') {
    const npc = this.state.npcs[npcId];
    if (!npc) throw new Error('NPC não encontrado.');
    if (npc.status === 'dead') throw new Error('Não é possível curar um parceiro morto com cura normal.');

    npc.status = 'alive';

    this.addLog({
      type: 'heal',
      severity: 'success',
      title: 'Parceiro Curado!',
      message: `${npc.name} recebeu cura (${healerInfo}) e retornou ao combate!`,
    });

    this.save();
    return npc;
  }

  reviveNpc(npcId) {
    const npc = this.state.npcs[npcId];
    if (!npc) throw new Error('NPC não encontrado.');

    npc.status = 'alive';
    npc.willFailures = Math.min(2, npc.willFailures);

    this.addLog({
      type: 'heal',
      severity: 'success',
      title: 'Ressurreição / Restauração Divina',
      message: `${npc.name} foi revivido e suas falhas de Vontade foram reduzidas para ${npc.willFailures}/3.`,
    });

    this.save();
    return npc;
  }

  // --- REGRAS DE RESGATE POR CURADOR ---
  rescueWithHealer(curadorId, woundedNpcId, actorName = 'Jogador') {
    const curador = this.state.npcs[curadorId];
    const wounded = this.state.npcs[woundedNpcId];

    if (!curador || !wounded) throw new Error('Curador ou parceiro ferido não encontrado.');
    if (!curador.isHealer) throw new Error(`${curador.name} não é um parceiro Curador.`);
    if (curador.status !== 'alive') throw new Error(`${curador.name} precisa estar ativo para resgatar.`);
    if (wounded.status !== 'wounded') throw new Error(`${wounded.name} não está ferido.`);

    // Both leave this combat safely!
    curador.status = 'withdrawn';
    wounded.status = 'withdrawn';
    curador.usedThisRound = false;
    wounded.usedThisRound = false;

    this.addLog({
      type: 'heal',
      severity: 'success',
      title: `🛡️ Resgate Seguro por Curador!`,
      message: `${actorName} utilizou o Curador ${curador.name} para resgatar ${wounded.name}! Ambos saíram em segurança deste combate, estão a salvo do teste de morte e estarão vivos para a próxima batalha.`,
    });

    this.save();
    return { curador, wounded };
  }

  rollTurnEndInjury(playerId) {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) throw new Error('Jogador não encontrado.');

    // All alive partners currently controlled by this player
    const playerAlivePartners = Object.values(this.state.npcs).filter(
      (n) => n.ownerId === playerId && n.status === 'alive'
    );

    const usedPartners = playerAlivePartners.filter((n) => n.usedThisRound);
    const usedCount = usedPartners.length;
    const d8Roll = Math.floor(Math.random() * 8) + 1;

    // Regra: mesmo usando 0 parceiros, resultado 1 ou 2 fere. Limiar mínimo é 2 (ou usedCount se for maior)
    const injuryThreshold = Math.max(2, usedCount);
    let injuredNpc = null;

    if (playerAlivePartners.length > 0 && d8Roll <= injuryThreshold) {
      // Qualquer um dos parceiros ativos que o jogador possui pode ser ferido (não apenas os usados)
      const randomIndex = Math.floor(Math.random() * playerAlivePartners.length);
      injuredNpc = playerAlivePartners[randomIndex];
      injuredNpc.status = 'wounded';
    }

    // Reset usedThisRound for this player's partners
    Object.values(this.state.npcs)
      .filter((n) => n.ownerId === playerId)
      .forEach((n) => {
        n.usedThisRound = false;
      });

    let logTitle = `Fim de Turno de ${player.name} (1d8 de Ferimento)`;
    let logMessage = `${player.name} usou ${usedCount} parceiro(s) neste turno (Limiar de risco: ≤ ${injuryThreshold}). Rolou 1d8 = ${d8Roll}. `;
    let logSeverity = 'info';

    if (injuredNpc) {
      logSeverity = 'danger';
      logMessage += `⚠️ Como ${d8Roll} <= ${injuryThreshold}, ${injuredNpc.name} foi atingido e está FERIDO (Fora de Combate)! Sorteado entre os ${playerAlivePartners.length} parceiros do jogador. Pode ser resgatado por um Curador antes do teste de morte.`;
    } else {
      logSeverity = 'success';
      logMessage += `🛡️ Nenhum parceiro foi ferido neste turno (${d8Roll} > ${injuryThreshold}).`;
    }

    this.addLog({
      type: 'injury',
      severity: logSeverity,
      title: logTitle,
      message: logMessage,
      details: { d8Roll, usedCount, injuryThreshold, injuredNpc: injuredNpc ? injuredNpc.name : null },
    });

    this.save();
    return { d8Roll, usedCount, injuryThreshold, injuredNpc, totalActivePartners: playerAlivePartners.length };
  }

  // --- ROLAGEM DE MORTE / SOBREVIVÊNCIA DE FERIDOS PELO MESTRE ---
  rollCombatWounds() {
    // Only test NPCs that are actively 'wounded' (not rescued with 'withdrawn')
    const woundedNpcs = Object.values(this.state.npcs).filter((n) => n.status === 'wounded');
    if (woundedNpcs.length === 0) {
      this.addLog({
        type: 'system',
        severity: 'info',
        title: 'Teste de Sobrevivência de Feridos',
        message: 'Nenhum parceiro ferido na mesa aguardando teste de morte.',
      });
      return { totalTested: 0, results: [] };
    }

    const results = [];
    let diedCount = 0;
    let survivedCount = 0;

    woundedNpcs.forEach((npc) => {
      const roll = Math.floor(Math.random() * 6) + 1; // 1d6
      const isOdd = roll % 2 !== 0;

      if (isOdd) {
        // Did not survive: DEAD permanently
        npc.status = 'dead';
        diedCount++;
        results.push({
          npcId: npc.id,
          npcName: npc.name,
          roll,
          survived: false,
          isThyatis: npc.id === 'khorrbenn',
        });
      } else {
        // Survived wounds: stays 'withdrawn' from this specific combat
        // Does not need to test again in this combat! Can return if cured.
        npc.status = 'withdrawn';
        survivedCount++;
        results.push({
          npcId: npc.id,
          npcName: npc.name,
          roll,
          survived: true,
        });
      }
    });

    let logTitle = `Teste de Morte/Sobrevivência dos Feridos`;
    let logSeverity = diedCount > 0 ? 'danger' : 'success';
    let logMessage = `${woundedNpcs.length} ferido(s) testados: ${survivedCount} sobreviveram fora de combate (resultado par), ${diedCount} faleceram definitivamente (resultado ímpar).`;

    this.addLog({
      type: 'injury',
      severity: logSeverity,
      title: logTitle,
      message: logMessage,
      details: { results },
    });

    this.state.lastWoundsTest = {
      timestamp: new Date().toISOString(),
      totalTested: woundedNpcs.length,
      diedCount,
      survivedCount,
      results,
    };

    this.save();
    return this.state.lastWoundsTest;
  }

  advanceTurn() {
    this.state.combatTurn += 1;
    // reset used flags for alive partners
    Object.values(this.state.npcs).forEach((n) => {
      n.usedThisRound = false;
    });

    this.addLog({
      type: 'system',
      severity: 'info',
      title: `Turno ${this.state.combatTurn} (${this.state.combatInstance.name})`,
      message: `Iniciou-se o Turno ${this.state.combatTurn}! Todos os parceiros ativos estão prontos para receber ordens.`,
    });

    this.save();
    return this.state.combatTurn;
  }

  startNewCombat(combatName) {
    const nextId = (this.state.combatInstance?.id || 1) + 1;
    const name = combatName ? combatName.trim() : `Combate ${nextId}`;

    this.state.combatInstance = {
      id: nextId,
      name,
      active: true,
    };
    this.state.combatTurn = 1;

    // Reset withdrawn partners back to alive if they were saved or survived!
    // (Dead ones remain dead permanently)
    let restoredCount = 0;
    Object.values(this.state.npcs).forEach((n) => {
      n.usedThisRound = false;
      if (n.status === 'withdrawn') {
        n.status = 'alive';
        restoredCount++;
      }
    });

    this.addLog({
      type: 'system',
      severity: 'warning',
      title: `⚔️ Novo Combate Iniciado: ${name}`,
      message: `Começou uma nova instância de combate! ${restoredCount > 0 ? `${restoredCount} parceiro(s) que estavam resgatados/fora de combate retornaram à ativa!` : ''}`,
    });

    this.save();
    return this.state.combatInstance;
  }

  rollNpcAttack(npcId, actorName = 'Jogador') {
    const npc = this.state.npcs[npcId];
    if (!npc) throw new Error('NPC não encontrado.');
    if (!npc.attackDice) throw new Error(`${npc.name} não possui fórmula de ataque.`);
    if (npc.status === 'dead' || npc.status === 'withdrawn') {
      throw new Error(`Parceiro ${npc.status === 'dead' ? 'morto' : 'fora de combate'} não pode atacar.`);
    }

    const { count, sides, bonus, range } = npc.attackDice;
    const rolls = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const val = Math.floor(Math.random() * sides) + 1;
      rolls.push(val);
      sum += val;
    }

    if (npc.id === 'borus' && npc.borusWerewolf) {
      const wRolls = [];
      let wSum = 0;
      for (let i = 0; i < 6; i++) {
        const val = Math.floor(Math.random() * 8) + 1;
        wRolls.push(val);
        wSum += val;
      }
      const total = wSum + 6;
      this.addLog({
        type: 'attack',
        severity: 'danger',
        title: `Ataque FEROZ de Borus (Modo Lobisomem)`,
        message: `${actorName} ordenou o ataque de Borus Lobisomem: 6d8+6 [${wRolls.join(', ')}] + 6 = ${total} de dano! (Aço Rubi ignora RD de Lefeu).`,
        details: { rolls: wRolls, total, formula: '6d8+6' },
      });
      this.save();
      return { rolls: wRolls, sum: wSum, bonus: 6, total, formula: '6d8+6', range: 'corpo a corpo' };
    }

    const total = sum + (bonus || 0);

    this.addLog({
      type: 'attack',
      severity: 'info',
      title: `Ataque de ${npc.name}`,
      message: `${actorName} ordenou o ataque de ${npc.name}: ${npc.attack} [${rolls.join(', ')}]${
        bonus ? ` + ${bonus}` : ''
      } = ${total} de dano (${range})! (Aço Rubi ignora RD de Lefeu).`,
      details: { rolls, sum, bonus, total, formula: npc.attack, range },
    });

    this.save();
    return { rolls, sum, bonus, total, formula: npc.attack, range };
  }

  toggleBorusWerewolf(npcId, active) {
    const npc = this.state.npcs[npcId];
    if (!npc || npc.id !== 'borus') throw new Error('Parceiro inválido.');
    npc.borusWerewolf = active !== undefined ? active : !npc.borusWerewolf;

    this.addLog({
      type: 'special',
      severity: npc.borusWerewolf ? 'danger' : 'info',
      title: npc.borusWerewolf ? '🐺 Borus Transformou-se em Lobisomem!' : 'Borus Voltou à Forma Humana',
      message: npc.borusWerewolf
        ? 'Bônus de ataque virou +4 e +2d6 dano cc. Ataque agora é 6d8+6! Cuidado: ao fim do turno, 1d10 pode fazê-lo perder o controle.'
        : 'Borus acalmou os instintos e retomou a forma normal.',
    });

    this.save();
    return npc;
  }

  rollBorusControl(actorName = 'Jogador') {
    const npc = this.state.npcs['borus'];
    if (!npc) throw new Error('Borus não encontrado.');
    const d10 = Math.floor(Math.random() * 10) + 1;
    const lostControl = d10 === 1 || d10 === 2;
    npc.borusLostControl = lostControl;

    this.addLog({
      type: 'special',
      severity: lostControl ? 'danger' : 'success',
      title: `Teste de Controle do Lobisomem (1d10)`,
      message: `${actorName} rolou 1d10 para o controle de Borus: resultado ${d10}! ${
        lostControl
          ? '💀 PERDEU O CONTROLE! Borus age descontrolado contra amigos ou inimigos!'
          : '🛡️ Manteve o controle da fúria lupina.'
      }`,
      details: { d10, lostControl },
    });

    this.save();
    return { d10, lostControl };
  }

  rollRizzelenaFood(actorName = 'Jogador') {
    const npc = this.state.npcs['rizzelena'];
    if (!npc) throw new Error('Rizzelena não encontrada.');

    const d6 = Math.floor(Math.random() * 6) + 1;
    const item = RIZZELENA_TABLE[d6 - 1];

    this.addLog({
      type: 'special',
      severity: 'success',
      title: `Banquete da Rizzelena (2 PM - 1d6 = ${d6})`,
      message: `${actorName} pagou 2 PM e saboreou a comida da Rizzelena! Efeito: ${item.effect}.`,
      details: { roll: d6, item },
    });

    this.save();
    return { roll: d6, effect: item.effect, accumulable: item.accumulable };
  }

  selectLisandraOption(actorName = 'Jogador', optionId) {
    const opt = LISANDRA_OPTIONS.find((o) => o.id === optionId);
    if (!opt) throw new Error('Opção da Lisandra inválida.');

    let extraRoll = null;
    if (optionId === 'damage_burst') {
      const rolls = [];
      let sum = 0;
      for (let i = 0; i < 8; i++) {
        const val = Math.floor(Math.random() * 8) + 1;
        rolls.push(val);
        sum += val;
      }
      extraRoll = { rolls, total: sum + 15 };
    }

    this.addLog({
      type: 'special',
      severity: 'success',
      title: `Poder da Força da Natureza: Lisandra`,
      message: `${actorName} escolheu para seu turno: ${opt.title} (${opt.description})${
        extraRoll ? ` -> Rolou [${extraRoll.rolls.join(', ')}] + 15 = ${extraRoll.total} de Dano de Natureza!` : ''
      }`,
      details: { optionId, opt, extraRoll },
    });

    this.save();
    return { opt, extraRoll };
  }
}

export const stateManager = new StateManager();
export { RIZZELENA_TABLE, LISANDRA_OPTIONS };
