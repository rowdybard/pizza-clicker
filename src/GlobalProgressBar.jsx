import React, { useState, useEffect, useRef } from 'react';
import { Pizza, Users, TrendingUp, Globe } from 'lucide-react';

const GLOBAL_PIZZAS_GOAL = 1000000000; // 1 billion pizzas goal

export default function GlobalProgressBar({ currentGlobalPizzas = 0 }) {
  const [displayPizzas, setDisplayPizzas] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [formattedPizzas, setFormattedPizzas] = useState('0');
  const animationRef = useRef(null);
  const previousPizzas = useRef(0);

  // Smooth count-up animation
  const animateCountUp = (from, to, duration = 1000) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = from + (to - from) * easeOutQuart;
      
      setDisplayPizzas(Math.floor(current));
      setDisplayProgress((current / GLOBAL_PIZZAS_GOAL) * 100);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Format number with K, M, B notation
  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num.toString();
    }
  };

  // Update when global pizzas change
  useEffect(() => {
    if (currentGlobalPizzas !== previousPizzas.current) {
      animateCountUp(previousPizzas.current, currentGlobalPizzas);
      previousPizzas.current = currentGlobalPizzas;
    }
  }, [currentGlobalPizzas]);

  // Update formatted display
  useEffect(() => {
    setFormattedPizzas(formatNumber(displayPizzas));
  }, [displayPizzas]);

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
            style={{ width: `${Math.min(displayProgress, 100)}%` }}
          >
            {displayProgress > 5 && (
              <span className="text-xs font-black text-white tabular-nums">
                {displayProgress.toFixed(1)}%
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
          {displayProgress < 1 ? 
            "The journey begins..." :
            displayProgress < 25 ?
              "Keep baking! We're just getting started!" :
            displayProgress < 50 ?
              "Great progress! Halfway there!" :
            displayProgress < 75 ?
              "Amazing! The world is hungry!" :
            displayProgress < 99 ?
              "Incredible! So close to the goal!" :
              "🎉 GOAL REACHED! The world is fed! 🎉"
          }
        </p>
      </div>
    </div>
  );
}
