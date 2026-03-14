import React, { useState, useEffect, useRef } from 'react';
import { Pizza, Users, TrendingUp, Globe } from 'lucide-react';

const GLOBAL_PIZZAS_GOAL = 1000000000; // 1 billion pizzas goal

export default function GlobalProgressBar({ currentGlobalPizzas = 0 }) {
  const [displayPizzas, setDisplayPizzas] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [formattedPizzas, setFormattedPizzas] = useState('0');
  const animationRef = useRef(null);
  const previousPizzas = useRef(0);

  // Smooth number animation - faster and more responsive
  const animateNumber = (from, to, duration = 300) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * easeOutCubic;
      
      setDisplayPizzas(Math.floor(current));
      setDisplayProgress((current / GLOBAL_PIZZAS_GOAL) * 100);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Format number with commas (full number)
  const formatNumber = (num) => {
    return num.toLocaleString('en-US');
  };

  // Update when global pizzas change
  useEffect(() => {
    if (currentGlobalPizzas !== previousPizzas.current) {
      animateNumber(previousPizzas.current, currentGlobalPizzas);
      previousPizzas.current = currentGlobalPizzas;
    }
  }, [currentGlobalPizzas]);

  // Update formatted display
  useEffect(() => {
    setFormattedPizzas(formatNumber(displayPizzas));
  }, [displayPizzas]);

  return (
    <div className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-lg px-3 py-2">
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
              {displayProgress.toFixed(1)}%
            </div>
            <div className="text-xs text-zinc-500">1B Goal</div>
          </div>
        </div>
      </div>

      {/* Compact Progress Bar */}
      <div className="mt-1.5">
        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(displayProgress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
