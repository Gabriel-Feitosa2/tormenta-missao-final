import { stateManager } from '../server/stateManager.js';

async function runTest() {
  console.log('=== INICIANDO TESTE DE INTEGRAÇÃO DAS NOVAS FUNCIONALIDADES ===');

  stateManager.resetState();
  const state = stateManager.getState();
  console.log(`✓ Instância inicial: ${state.combatInstance.name}, Turno #${state.combatTurn}`);

  // 1. Test Bônus Global de Vontade
  stateManager.setWillGlobalBonus(3);
  console.log(`✓ Bônus Global de Vontade definido: +${stateManager.getState().willGlobalBonus}`);

  // 2. Test Will Test with Global Bonus
  const willTest = stateManager.rollWillTest({ dc: 20, targetMode: 'all' });
  console.log(
    `✓ Teste de Vontade concluído: ${willTest.totalTargets} testados. Sucessos: ${willTest.totalPassed}, Falhas: ${willTest.totalFailed}, Mortos: ${willTest.totalDied}`
  );
  const sample = willTest.results.find((r) => !r.isImmune);
  console.log(`  Exemplo de cálculo: d20 [${sample.roll}] + ${sample.baseWill} (base) + ${sample.globalBonus} (global) = ${sample.total} vs CD ${sample.dc}`);

  // 3. Test Turn-End Injury
  const p1 = state.players[0].id;
  stateManager.claimNpc(p1, 'lonien'); // Curador
  stateManager.claimNpc(p1, 'asora');  // Melee
  stateManager.toggleNpcUsed('asora', true);
  stateManager.toggleNpcUsed('lonien', true);

  // Force asora wounded to test rescue
  state.npcs['asora'].status = 'wounded';
  console.log('✓ Asora definida como Ferida para testar resgate de Curador.');

  // 4. Test Rescue with Healer (Lonien resgata Asora)
  const rescueRes = stateManager.rescueWithHealer('lonien', 'asora', 'Jogador 1');
  console.log(`✓ Resgate realizado: ${rescueRes.curador.name} (${rescueRes.curador.status}) e ${rescueRes.wounded.name} (${rescueRes.wounded.status}) saíram a salvo.`);

  if (state.npcs['asora'].status !== 'withdrawn' || state.npcs['lonien'].status !== 'withdrawn') {
    throw new Error('Falha no status withdrawn após resgate!');
  }

  // 5. Test Combat Wounds for another wounded partner (not rescued)
  state.npcs['k'].status = 'wounded';
  const woundsResult = stateManager.rollCombatWounds();
  console.log(`✓ Teste de Morte de Feridos: ${woundsResult.totalTested} testados. Sobreviveram: ${woundsResult.survivedCount}, Faleceram: ${woundsResult.diedCount}`);

  // 6. Test Advance Turn
  const newTurn = stateManager.advanceTurn();
  console.log(`✓ Turno avançado com sucesso para #${newTurn}`);

  // 7. Test Start New Combat Instance
  const nextCombat = stateManager.startNewCombat('Combate 2: O Coração da Montanha');
  console.log(`✓ Nova Instância de Combate iniciada: ${nextCombat.name} (Turno #${stateManager.getState().combatTurn})`);
  console.log(`✓ Asora restaurada para próximo combate: Status = ${stateManager.getState().npcs['asora'].status}`);

  if (stateManager.getState().npcs['asora'].status !== 'alive') {
    throw new Error('Asora deveria ter sido restaurada para alive no novo combate!');
  }

  // 8. Test Nova Regra de Ferimento 1d8:
  // - Mesmo com 0 parceiros usados, limiar é 2 (1 ou 2 causa ferimento)
  // - Qualquer parceiro ativo do jogador pode se ferir (mesmo os que não foram usados)
  const p2 = state.players[1].id;
  stateManager.claimNpc(p2, 'miriam');
  stateManager.claimNpc(p2, 'borus');
  // Usou 0 parceiros
  const injuryZeroUsed = stateManager.rollTurnEndInjury(p2);
  console.log(`✓ Teste 1d8 com 0 parceiros usados: Limiar = ${injuryZeroUsed.injuryThreshold} (Esperado: 2). Dado: ${injuryZeroUsed.d8Roll}. Ferido: ${injuryZeroUsed.injuredNpc ? injuryZeroUsed.injuredNpc.name : 'Nenhum'}`);
  if (injuryZeroUsed.injuryThreshold !== 2) {
    throw new Error(`Limiar de ferimento deveria ser 2 com 0 usados, mas foi ${injuryZeroUsed.injuryThreshold}`);
  }

  // Garantir que todos estejam vivos para o teste de 5 usados
  state.npcs['miriam'].status = 'alive';
  state.npcs['borus'].status = 'alive';
  stateManager.claimNpc(p2, 'nairo');
  stateManager.claimNpc(p2, 'reka');
  stateManager.claimNpc(p2, 'lue');
  stateManager.toggleNpcUsed('miriam', true);
  stateManager.toggleNpcUsed('borus', true);
  stateManager.toggleNpcUsed('nairo', true);
  stateManager.toggleNpcUsed('reka', true);
  stateManager.toggleNpcUsed('lue', true);
  const injury5Used = stateManager.rollTurnEndInjury(p2);
  console.log(`✓ Teste 1d8 com 5 parceiros usados: Limiar = ${injury5Used.injuryThreshold} (Esperado: 5). Dado: ${injury5Used.d8Roll}. Ferido: ${injury5Used.injuredNpc ? injury5Used.injuredNpc.name : 'Nenhum'}`);
  if (injury5Used.injuryThreshold !== 5) {
    throw new Error(`Limiar de ferimento deveria ser 5 com 5 usados, mas foi ${injury5Used.injuryThreshold}`);
  }

  // 9. Teste de elegibilidade: parceiro NÃO usado pode ser ferido quando outro foi usado
  state.npcs['miriam'].status = 'alive';
  state.npcs['borus'].status = 'alive';
  state.npcs['nairo'].status = 'alive';
  stateManager.toggleNpcUsed('miriam', true); // Só Miriam usada
  // Rodar múltiplas vezes simulando para verificar que borus ou nairo (não usados) podem ser sorteados
  let nonUsedWasInjured = false;
  for (let i = 0; i < 50; i++) {
    state.npcs['miriam'].status = 'alive';
    state.npcs['borus'].status = 'alive';
    state.npcs['nairo'].status = 'alive';
    stateManager.toggleNpcUsed('miriam', true);
    const res = stateManager.rollTurnEndInjury(p2);
    if (res.injuredNpc && (res.injuredNpc.id === 'borus' || res.injuredNpc.id === 'nairo')) {
      nonUsedWasInjured = true;
      console.log(`✓ Parceiro NÃO usado (${res.injuredNpc.name}) foi ferido pelo teste de fim de turno (Confirmando regra solicitada!).`);
      break;
    }
  }
  if (!nonUsedWasInjured) {
    throw new Error('Parceiros não usados deveriam ser elegíveis para ferimento!');
  }

  console.log('=== TODOS OS TESTES PASSARAM COM 100% DE SUCESSO! ===');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('ERRO NO TESTE:', err);
  process.exit(1);
});
