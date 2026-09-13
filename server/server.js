import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { stateManager, RIZZELENA_TABLE, LISANDRA_OPTIONS } from './stateManager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/state', (req, res) => {
  res.json(stateManager.getState());
});

app.get('/api/tables', (req, res) => {
  res.json({
    rizzelena: RIZZELENA_TABLE,
    lisandra: LISANDRA_OPTIONS,
  });
});

// Dynamic NPC image resolver: matches any extension (.png, .jpg, .jpeg, .webp, .gif) case-insensitively
const publicNpcs = path.join(__dirname, '..', 'client', 'public', 'npcs');

app.get('/npcs/:filename', (req, res, next) => {
  const reqFile = req.params.filename;
  const parsed = path.parse(reqFile);
  const baseName = parsed.name.toLowerCase();

  if (!fs.existsSync(publicNpcs)) {
    return next();
  }

  try {
    const files = fs.readdirSync(publicNpcs);

    // 1. Exact match (case-insensitive)
    const exact = files.find((f) => f.toLowerCase() === reqFile.toLowerCase());
    if (exact) {
      return res.sendFile(path.join(publicNpcs, exact), {
        headers: { 'Cache-Control': 'no-cache' },
      });
    }

    // 2. Match by baseName with preferred image extensions
    const PREFERRED_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    for (const ext of PREFERRED_EXTS) {
      const match = files.find((f) => f.toLowerCase() === `${baseName}${ext}`);
      if (match) {
        return res.sendFile(path.join(publicNpcs, match), {
          headers: { 'Cache-Control': 'no-cache' },
        });
      }
    }

    // 3. Fallback: Any file starting with baseName
    const prefixMatch = files.find((f) => path.parse(f).name.toLowerCase() === baseName);
    if (prefixMatch) {
      return res.sendFile(path.join(publicNpcs, prefixMatch), {
        headers: { 'Cache-Control': 'no-cache' },
      });
    }
  } catch (err) {
    console.error('[NPC Avatar Resolver] Erro ao ler pasta de npcs:', err);
  }

  // If no image file found, return 404 directly so img triggers onError instead of receiving HTML
  return res.status(404).send('NPC image not found');
});

// Serve client public assets directly
const clientPublic = path.join(__dirname, '..', 'client', 'public');
app.use(express.static(clientPublic));

// Serve frontend in production build if present
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// Socket.io Real-time Events
io.on('connection', (socket) => {
  // Send current state on connection
  socket.emit('state_update', stateManager.getState());

  // Master Login
  socket.on('login_master', ({ pin }, callback) => {
    const valid = pin === (process.env.MASTER_PIN || 'tormenta20');
    if (valid) {
      callback({ success: true });
    } else {
      callback({ success: false, message: 'PIN do Mestre incorreto!' });
    }
  });

  // Player Slot Update
  socket.on('update_player_info', ({ playerId, name, characterName }, callback) => {
    try {
      stateManager.updatePlayer(playerId, { name, characterName });
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Draft / Claim NPC
  socket.on('claim_npc', ({ playerId, npcId }, callback) => {
    try {
      stateManager.claimNpc(playerId, npcId);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Release NPC
  socket.on('release_npc', ({ npcId }, callback) => {
    try {
      stateManager.releaseNpc(npcId);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Transfer NPC
  socket.on('transfer_npc', ({ fromPlayerId, toPlayerId, npcId }, callback) => {
    try {
      stateManager.transferNpc(fromPlayerId, toPlayerId, npcId);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Mark/Unmark NPC used this round
  socket.on('toggle_npc_used', ({ npcId, isUsed }, callback) => {
    try {
      stateManager.toggleNpcUsed(npcId, isUsed);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Set Will DC
  socket.on('set_will_dc', ({ dc }, callback) => {
    try {
      stateManager.setWillDC(dc);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Set Global Will Bonus
  socket.on('set_will_global_bonus', ({ bonus }, callback) => {
    try {
      stateManager.setWillGlobalBonus(bonus);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Mass Will Test
  socket.on('roll_will_test', ({ dc, globalBonus, targetMode }, callback) => {
    try {
      const testResult = stateManager.rollWillTest({ dc, globalBonus, targetMode });
      io.emit('state_update', stateManager.getState());
      io.emit('will_test_broadcast', testResult);
      if (callback) callback({ success: true, result: testResult });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Manual failure count override
  socket.on('update_npc_failures', ({ npcId, newFailures }, callback) => {
    try {
      stateManager.updateNpcFailures(npcId, newFailures);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Update NPC Avatar
  socket.on('update_npc_avatar', ({ npcId, avatarUrl }, callback) => {
    try {
      const npc = stateManager.updateNpcAvatar(npcId, avatarUrl);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true, npc });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Heal NPC
  socket.on('heal_npc', ({ npcId, healerInfo }, callback) => {
    try {
      stateManager.healNpc(npcId, healerInfo);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Kill NPC (Master Command)
  socket.on('kill_npc', ({ npcId, reason }, callback) => {
    try {
      stateManager.killNpc(npcId, reason);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Revive NPC (Master Command)
  socket.on('revive_npc', ({ npcId, resetFailures }, callback) => {
    try {
      stateManager.reviveNpc(npcId, resetFailures !== undefined ? resetFailures : true);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Rescue with Healer
  socket.on('rescue_with_healer', ({ curadorId, woundedNpcId, actorName }, callback) => {
    try {
      const result = stateManager.rescueWithHealer(curadorId, woundedNpcId, actorName);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true, result });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Turn End 1d8 Injury Roll
  socket.on('roll_turn_end_injury', ({ playerId }, callback) => {
    try {
      const result = stateManager.rollTurnEndInjury(playerId);
      io.emit('state_update', stateManager.getState());
      io.emit('injury_test_broadcast', { playerId, ...result });
      if (callback) callback({ success: true, result });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Combat Wounds Death/Survival Roll
  socket.on('roll_combat_wounds', ({}, callback) => {
    try {
      const result = stateManager.rollCombatWounds();
      io.emit('state_update', stateManager.getState());
      io.emit('wounds_test_broadcast', result);
      if (callback) callback({ success: true, result });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Roll NPC Attack
  socket.on('roll_npc_attack', ({ npcId, actorName }, callback) => {
    try {
      const result = stateManager.rollNpcAttack(npcId, actorName);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true, result });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Borus Werewolf Toggle
  socket.on('toggle_borus_werewolf', ({ npcId, active }, callback) => {
    try {
      stateManager.toggleBorusWerewolf(npcId, active);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Borus Control Roll (1d10)
  socket.on('roll_borus_control', ({ actorName }, callback) => {
    try {
      const result = stateManager.rollBorusControl(actorName);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true, result });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Rizzelena Food Roll (1d6)
  socket.on('roll_rizzelena_food', ({ actorName }, callback) => {
    try {
      const result = stateManager.rollRizzelenaFood(actorName);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true, result });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Lisandra Power Selection
  socket.on('select_lisandra_option', ({ actorName, optionId }, callback) => {
    try {
      const result = stateManager.selectLisandraOption(actorName, optionId);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true, result });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Advance Turn
  socket.on('advance_turn', ({}, callback) => {
    try {
      const turn = stateManager.advanceTurn();
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true, turn });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Alias for backward compatibility
  socket.on('advance_round', ({}, callback) => {
    try {
      const turn = stateManager.advanceTurn();
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true, turn });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Start New Combat Instance
  socket.on('start_new_combat', ({ name }, callback) => {
    try {
      const combatInstance = stateManager.startNewCombat(name);
      io.emit('state_update', stateManager.getState());
      if (callback) callback({ success: true, combatInstance });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // Reset Session
  socket.on('reset_session', ({ pin }, callback) => {
    const valid = pin === (process.env.MASTER_PIN || 'tormenta20');
    if (!valid) {
      return callback({ success: false, message: 'PIN inválido para resetar a sessão.' });
    }
    stateManager.resetState();
    io.emit('state_update', stateManager.getState());
    callback({ success: true });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Cliente desconectado: ${socket.id}`);
  });
});

// Fallback to index.html for client routing
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    res.sendFile(path.join(clientDist, 'index.html'));
  } else {
    res.send('Tormenta 20 - API Server ativo.');
  }
});

server.listen(PORT, () => {
  console.log(`⚔️ [Tormenta Missão Final] Servidor rodando na porta ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});
