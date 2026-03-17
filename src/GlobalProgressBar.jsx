import React, { useState, useEffect, useRef } from 'react';
import { Pizza, Users, TrendingUp, Globe, ChevronDown, ChevronUp } from 'lucide-react';

const GLOBAL_PIZZAS_GOAL = 250000000000000000000; // 250 quintillion pizzas goal

export default function GlobalProgressBar({ currentGlobalPizzas = 0, localPendingPizzas = 0, globalBuffMultiplier = 1 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const prevServerTotal = useRef(0);
  const prevLocalPending = useRef(0);

  // Buff detection — active if multiplier > 1 or goal reached
  const isBuffActive = globalBuffMultiplier > 1 || currentGlobalPizzas >= GLOBAL_PIZZAS_GOAL;

  // Precision-safe progress: compute server % and local % separately, then add
  // This avoids (bigNumber + smallNumber) losing the small part
  const serverProgress = (currentGlobalPizzas / GLOBAL_PIZZAS_GOAL) * 100;
  const localProgress = (localPendingPizzas / GLOBAL_PIZZAS_GOAL) * 100;
  const totalProgress = serverProgress + localProgress;
  const progressComplete = totalProgress >= 100;

  // Format the display number — combine server + local using string math for large numbers
  const formatDisplayTotal = () => {
    // For numbers beyond MAX_SAFE_INTEGER, JS can't add small values accurately.
    // Use BigInt for precise display when possible.
    try {
      const serverBig = BigInt(Math.floor(currentGlobalPizzas));
      const localBig = BigInt(Math.floor(localPendingPizzas));
      const total = serverBig + localBig;
      return total.toLocaleString('en-US');
    } catch {
      // Fallback for environments without BigInt
      return Math.floor(currentGlobalPizzas + localPendingPizzas).toLocaleString('en-US');
    }
  };

  const formattedPizzas = formatDisplayTotal();

  // Track changes for logging
  useEffect(() => {
    prevServerTotal.current = currentGlobalPizzas;
    prevLocalPending.current = localPendingPizzas;
  }, [currentGlobalPizzas, localPendingPizzas]);

  return (
    <div className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-lg overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-lg"
      >
        {/* Collapsed state */}
        {!isExpanded && (
          <div className="px-3 py-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-blue-400" />
                <span className="text-xs font-black text-zinc-400 uppercase tracking-wider">Global</span>
                <span className="text-xs font-black text-blue-400 tabular-nums">
                  {totalProgress.toFixed(2)}%
                </span>
                {isBuffActive && (
                  <span className="text-xs font-black text-green-400 uppercase tracking-wider animate-pulse">
                    2X BUFF
                  </span>
                )}
              </div>
              <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden mt-1">
              <div 
                className={`h-full rounded-full transition-all duration-100 ease-out ${
                  progressComplete 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}
                style={{ width: `${Math.min(totalProgress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Expanded state */}
        {isExpanded && (
          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-black text-zinc-300 uppercase tracking-wider">Global Mission</span>
                <Pizza className="w-3 h-3 text-orange-400" />
                <span className="text-sm font-black text-orange-400 tabular-nums">
                  {formattedPizzas}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs font-black text-zinc-400 tabular-nums">
                    {totalProgress.toFixed(2)}%
                  </div>
                  <div className="text-xs text-zinc-500">250Q Goal</div>
                </div>
                <ChevronUp className="w-3 h-3 text-zinc-500" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-1.5">
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-100 ease-out relative ${
                    progressComplete 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                  style={{ width: `${Math.min(totalProgress, 100)}%` }}
                >
                  {progressComplete && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Buff Status Banner */}
            {isBuffActive && (
              <div className="mt-2 px-2 py-1 bg-green-500/10 border border-green-400/30 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-black text-green-400 uppercase tracking-wider">
                    2X Global Production & Click Buff Active
                  </span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </button>
    </div>
  );
}
