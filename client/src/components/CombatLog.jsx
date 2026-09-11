import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  ScrollText,
  Flame,
  Swords,
  AlertTriangle,
  Heart,
  Sparkles,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const CombatLog = () => {
  const { state } = useGame();
  const [filter, setFilter] = useState('all'); // 'all' | 'will_test' | 'attack' | 'injury' | 'special' | 'heal'
  const [expanded, setExpanded] = useState(true);

  if (!state || !state.combatLogs) return null;

  const logs = state.combatLogs.filter((l) => {
    if (filter === 'all') return true;
    return l.type === filter;
  });

  const getLogIcon = (type, severity) => {
    switch (type) {
      case 'will_test':
        return <Flame className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />;
      case 'attack':
        return <Swords className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />;
      case 'injury':
        return <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />;
      case 'wave_end':
        return <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
      case 'heal':
        return <Heart className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
      case 'special':
        return <Sparkles className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />;
      default:
        return <ScrollText className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="medieval-panel rounded-xl border-2 border-red-800 shadow-2xl overflow-hidden mt-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1c080e] to-[#120509] px-5 py-3.5 border-b-2 border-red-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScrollText className="w-5 h-5 text-red-400" />
          <h3 className="font-medieval font-black text-base sm:text-lg text-white">
            Crônicas da Batalha (Log em Tempo Real)
          </h3>
          <span className="text-xs text-amber-300/90 font-mono font-bold">({logs.length} eventos)</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Filter Pills */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'will_test', label: 'Vontade' },
              { id: 'attack', label: 'Ataques' },
              { id: 'injury', label: 'Ferimentos' },
              { id: 'special', label: 'Especiais' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1 rounded-md transition-all ${
                  filter === f.id
                    ? 'bg-red-700 text-white font-black shadow border border-red-400'
                    : 'text-gray-300 hover:text-white bg-black/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-300 hover:text-white p-1.5 rounded hover:bg-white/10"
            title={expanded ? 'Recolher Log' : 'Expandir Log'}
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Log Feed */}
      {expanded && (
        <div className="p-4 max-h-[380px] overflow-y-auto space-y-2.5 bg-[#0f0407]">
          {logs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 italic font-sans">
              Nenhum evento registrado ainda.
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg text-sm border-2 transition-all flex items-start gap-3 ${
                  log.severity === 'danger'
                    ? 'bg-red-950/60 border-red-700 text-red-100 shadow-md'
                    : log.severity === 'warning'
                    ? 'bg-amber-950/50 border-amber-700 text-amber-100 shadow-md'
                    : log.severity === 'success'
                    ? 'bg-emerald-950/50 border-emerald-700 text-emerald-100 shadow-md'
                    : 'bg-[#1a0910] border-red-950 text-gray-200'
                }`}
              >
                {getLogIcon(log.type, log.severity)}

                <div className="flex-1 min-w-0 font-sans">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medieval font-black text-sm text-white tracking-wide">
                      {log.title}
                    </span>
                    <span className="text-xs text-gray-300 font-mono font-bold">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed break-words font-medium">{log.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
