import React, { useState, useEffect } from 'react';
import { Pizza, Users, TrendingUp, Globe } from 'lucide-react';
import { getGlobalPizzas, getGlobalProgress, getFormattedGlobalPizzas } from './redis';

export default function GlobalProgressBar() {
  const [globalPizzas, setGlobalPizzas] = useState(0);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [formattedPizzas, setFormattedPizzas] = useState('0');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch global pizza data
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const [total, progress, formatted] = await Promise.all([
          getGlobalPizzas(),
          getGlobalProgress(),
          getFormattedGlobalPizzas()
        ]);
        
        setGlobalPizzas(total);
        setGlobalProgress(progress);
        setFormattedPizzas(formatted);
      } catch (error) {
        console.error('Error fetching global data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGlobalData();
    
    // Update every 30 seconds
    const interval = setInterval(fetchGlobalData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-zinc-700 rounded mb-2"></div>
        <div className="h-3 bg-zinc-700 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 shadow-inner">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider">Global Pizza Mission</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Users className="w-3 h-3" />
          <span>Worldwide</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-zinc-900 rounded-full h-6 overflow-hidden border border-zinc-600">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
            style={{ width: `${globalProgress}%` }}
          >
            {globalProgress > 5 && (
              <span className="text-xs font-black text-white tabular-nums">
                {globalProgress.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        
        {/* Milestone markers */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          {[25, 50, 75].map((milestone) => (
            <div
              key={milestone}
              className="w-0.5 h-4 bg-zinc-600"
              style={{ left: `${milestone}%` }}
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <Pizza className="w-4 h-4 text-orange-400" />
          <span className="text-lg font-black text-orange-400 tabular-nums">
            {formattedPizzas}
          </span>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-zinc-500 font-medium">Goal</div>
          <div className="text-sm font-black text-zinc-300 tabular-nums">1B Pizzas</div>
        </div>
      </div>

      {/* Progress message */}
      <div className="mt-2 text-center">
        <p className="text-xs text-zinc-400 font-medium">
          {globalProgress < 1 ? 
            "The journey begins..." :
            globalProgress < 25 ?
              "Keep baking! We're just getting started!" :
            globalProgress < 50 ?
              "Great progress! Halfway there!" :
            globalProgress < 75 ?
              "Amazing! The world is hungry!" :
            globalProgress < 99 ?
              "Incredible! So close to the goal!" :
              "🎉 GOAL REACHED! The world is fed! 🎉"
          }
        </p>
      </div>
    </div>
  );
}
