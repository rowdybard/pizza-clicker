import { useState, useEffect } from 'react';

export default function ManagerDesk({ children, deliveryGame, onDeliveryComplete }) {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isDesktop) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center gap-16 p-8 font-sans text-white overflow-hidden">
      {/* CRT Monitor - Left Side */}
      <div className="flex flex-col w-[500px] shrink-0 transform -rotate-2">
        {/* Monitor Bezel Header */}
        <div className="bg-zinc-900 p-4 rounded-t-2xl border-x-4 border-t-4 border-zinc-700 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] flex justify-between items-center">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase font-bold">PizzaOS // Dispatch v1.0</div>
        </div>
        
        {/* Monitor Screen */}
        <div className="h-[450px] bg-black border-x-8 border-b-16 border-t-8 border-zinc-800 rounded-b-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative p-2 flex flex-col justify-center items-center overflow-hidden">
          {/* CRT Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20 opacity-50"></div>
          
          {deliveryGame ? (
            <div className="w-full h-full relative z-10 scale-[1.05]">
              {deliveryGame}
            </div>
          ) : (
            <div className="text-green-500/70 font-mono text-center z-10">
              <p className="text-xl mb-2 animate-pulse">&gt; SYSTEM IDLE _</p>
              <p className="text-xs opacity-50">Awaiting Time Warp Deliveries...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tablet - Right Side */}
      <div className="w-[420px] h-[850px] rounded-[40px] border-[14px] border-zinc-900 shadow-2xl ring-4 ring-black/50 shrink-0 overflow-hidden relative bg-zinc-900">
        <div className="w-full h-full overflow-y-auto" style={{scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 #18181b'}}>
          {children}
        </div>
      </div>
    </div>
  );
}
