import React, { createContext, useContext, useState, useEffect } from 'react';
import { socket } from '../socket';

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(socket.connected);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tormenta_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Dramatic roll modal triggers
  const [activeWillTestResult, setActiveWillTestResult] = useState(null);
  const [activeInjuryResult, setActiveInjuryResult] = useState(null);
  const [activeWoundsTestResult, setActiveWoundsTestResult] = useState(null);

  // Active dialogs
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [transferNpcData, setTransferNpcData] = useState(null);
  const [specialDialogData, setSpecialDialogData] = useState(null);
  const [rescueModalData, setRescueModalData] = useState(null); // { woundedNpc }

  useEffect(() => {
    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onStateUpdate(newState) {
      setState(newState);
    }
    function onWillTestBroadcast(result) {
      setActiveWillTestResult(result);
    }
    function onInjuryBroadcast(result) {
      setActiveInjuryResult(result);
    }
    function onWoundsBroadcast(result) {
      setActiveWoundsTestResult(result);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('state_update', onStateUpdate);
    socket.on('will_test_broadcast', onWillTestBroadcast);
    socket.on('injury_test_broadcast', onInjuryBroadcast);
    socket.on('wounds_test_broadcast', onWoundsBroadcast);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('state_update', onStateUpdate);
      socket.off('will_test_broadcast', onWillTestBroadcast);
      socket.off('injury_test_broadcast', onInjuryBroadcast);
      socket.off('wounds_test_broadcast', onWoundsBroadcast);
    };
  }, []);

  const loginMaster = (pin) => {
    return new Promise((resolve) => {
      socket.emit('login_master', { pin }, (res) => {
        if (res.success) {
          const user = { role: 'master', name: 'Mestre da Tormenta' };
          setCurrentUser(user);
          localStorage.setItem('tormenta_user', JSON.stringify(user));
        }
        resolve(res);
      });
    });
  };

  const loginPlayer = (playerId) => {
    const player = state?.players?.find((p) => p.id === playerId);
    const user = {
      role: 'player',
      playerId,
      name: player ? player.name : 'Jogador',
      characterName: player ? player.characterName : '',
    };
    setCurrentUser(user);
    localStorage.setItem('tormenta_user', JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tormenta_user');
  };

  const updatePlayerInfo = (playerId, name, characterName) => {
    return new Promise((resolve) => {
      socket.emit('update_player_info', { playerId, name, characterName }, (res) => {
        if (currentUser?.playerId === playerId) {
          const updated = { ...currentUser, name, characterName };
          setCurrentUser(updated);
          localStorage.setItem('tormenta_user', JSON.stringify(updated));
        }
        resolve(res);
      });
    });
  };

  const claimNpc = (playerId, npcId) => {
    return new Promise((resolve) => {
      socket.emit('claim_npc', { playerId, npcId }, resolve);
    });
  };

  const releaseNpc = (npcId) => {
    return new Promise((resolve) => {
      socket.emit('release_npc', { npcId }, resolve);
    });
  };

  const transferNpc = (fromPlayerId, toPlayerId, npcId) => {
    return new Promise((resolve) => {
      socket.emit('transfer_npc', { fromPlayerId, toPlayerId, npcId }, resolve);
    });
  };

  const toggleNpcUsed = (npcId, isUsed) => {
    return new Promise((resolve) => {
      socket.emit('toggle_npc_used', { npcId, isUsed }, resolve);
    });
  };

  const setWillDC = (dc) => {
    return new Promise((resolve) => {
      socket.emit('set_will_dc', { dc }, resolve);
    });
  };

  const setWillGlobalBonus = (bonus) => {
    return new Promise((resolve) => {
      socket.emit('set_will_global_bonus', { bonus }, resolve);
    });
  };

  const rollWillTest = (dc, globalBonus, targetMode) => {
    return new Promise((resolve) => {
      socket.emit('roll_will_test', { dc, globalBonus, targetMode }, resolve);
    });
  };

  const updateNpcFailures = (npcId, newFailures) => {
    return new Promise((resolve) => {
      socket.emit('update_npc_failures', { npcId, newFailures }, resolve);
    });
  };

  const updateNpcAvatar = (npcId, avatarUrl) => {
    return new Promise((resolve) => {
      socket.emit('update_npc_avatar', { npcId, avatarUrl }, resolve);
    });
  };

  const healNpc = (npcId, healerInfo) => {
    return new Promise((resolve) => {
      socket.emit('heal_npc', { npcId, healerInfo }, resolve);
    });
  };

  const killNpc = (npcId, reason = 'Decreto do Mestre') => {
    return new Promise((resolve) => {
      socket.emit('kill_npc', { npcId, reason }, resolve);
    });
  };

  const reviveNpc = (npcId, resetFailures = true) => {
    return new Promise((resolve) => {
      socket.emit('revive_npc', { npcId, resetFailures }, resolve);
    });
  };

  const rescueWithHealer = (curadorId, woundedNpcId) => {
    return new Promise((resolve) => {
      const actorName = currentUser ? currentUser.name : 'Jogador';
      socket.emit('rescue_with_healer', { curadorId, woundedNpcId, actorName }, resolve);
    });
  };

  const rollTurnEndInjury = (playerId) => {
    return new Promise((resolve) => {
      socket.emit('roll_turn_end_injury', { playerId }, resolve);
    });
  };

  const rollCombatWounds = () => {
    return new Promise((resolve) => {
      socket.emit('roll_combat_wounds', {}, resolve);
    });
  };

  const advanceTurn = () => {
    return new Promise((resolve) => {
      socket.emit('advance_turn', {}, resolve);
    });
  };

  const startNewCombat = (name) => {
    return new Promise((resolve) => {
      socket.emit('start_new_combat', { name }, resolve);
    });
  };

  const rollNpcAttack = (npcId, actorName) => {
    return new Promise((resolve) => {
      socket.emit('roll_npc_attack', { npcId, actorName }, resolve);
    });
  };

  const toggleBorusWerewolf = (npcId, active) => {
    return new Promise((resolve) => {
      socket.emit('toggle_borus_werewolf', { npcId, active }, resolve);
    });
  };

  const rollBorusControl = (actorName) => {
    return new Promise((resolve) => {
      socket.emit('roll_borus_control', { actorName }, resolve);
    });
  };

  const rollRizzelenaFood = (actorName) => {
    return new Promise((resolve) => {
      socket.emit('roll_rizzelena_food', { actorName }, resolve);
    });
  };

  const selectLisandraOption = (actorName, optionId) => {
    return new Promise((resolve) => {
      socket.emit('select_lisandra_option', { actorName, optionId }, resolve);
    });
  };

  const resetSession = (pin) => {
    return new Promise((resolve) => {
      socket.emit('reset_session', { pin }, resolve);
    });
  };

  const importSession = (sessionData) => {
    return new Promise((resolve) => {
      socket.emit('import_session', { sessionData }, resolve);
    });
  };

  return (
    <GameContext.Provider
      value={{
        state,
        connected,
        currentUser,
        loginMaster,
        loginPlayer,
        logout,
        updatePlayerInfo,
        claimNpc,
        releaseNpc,
        transferNpc,
        toggleNpcUsed,
        setWillDC,
        setWillGlobalBonus,
        rollWillTest,
        updateNpcFailures,
        updateNpcAvatar,
        healNpc,
        killNpc,
        reviveNpc,
        rescueWithHealer,
        rollTurnEndInjury,
        rollCombatWounds,
        advanceTurn,
        advanceRound: advanceTurn, // alias
        startNewCombat,
        rollNpcAttack,
        toggleBorusWerewolf,
        rollBorusControl,
        rollRizzelenaFood,
        selectLisandraOption,
        resetSession,
        importSession,
        // Modals
        activeWillTestResult,
        setActiveWillTestResult,
        activeInjuryResult,
        setActiveInjuryResult,
        activeWoundsTestResult,
        setActiveWoundsTestResult,
        draftModalOpen,
        setDraftModalOpen,
        transferNpcData,
        setTransferNpcData,
        specialDialogData,
        setSpecialDialogData,
        rescueModalData,
        setRescueModalData,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame deve ser usado dentro de GameProvider');
  return context;
};
