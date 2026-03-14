import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, Pizza, Building2, Flame, Globe2, 
  Lock, MousePointerClick, CircleDollarSign, 
  ShieldQuestion, CheckCircle2, Crown, Terminal, 
  TrendingDown, Briefcase, Zap, Rocket, Truck, 
  Clock, Ghost, Eye, X, Camera, Mouse, Droplets, Shield
} from 'lucide-react';

// --- THE EXPANDED DATABASE (Full 55-slot capacity) ---
const AWARDS_DB = [
  // 1. THE TREASURY ROADMAP (Money Milestones)
  { id: 'money_1', title: 'Open for Business', isSecret: false, isUnlocked: true, desc: 'Earn your first dollar. The empire begins.', icon: <CircleDollarSign size={40} className="text-amber-500" /> },
  { id: 'money_2', title: 'In the Black', isSecret: false, isUnlocked: true, desc: 'Reach $10,000 in the bank. You are officially profitable.', icon: <CircleDollarSign size={40} className="text-amber-500" /> },
  { id: 'money_3', title: 'Millionaire', isSecret: false, isUnlocked: true, desc: 'Reach $1,000,000. Time to buy a yacht.', icon: <CircleDollarSign size={40} className="text-amber-500" /> },
  { id: 'money_4', title: 'Billionaire', isSecret: false, isUnlocked: false, desc: 'Goal: Reach $1,000,000,000. Welcome to the three comma club.', icon: <CircleDollarSign size={40} className="text-zinc-600" /> },
  { id: 'money_5', title: 'Trillionaire', isSecret: false, isUnlocked: false, desc: 'Goal: Reach $1,000,000,000,000. Small countries borrow from you.', icon: <CircleDollarSign size={40} className="text-zinc-600" /> },
  { id: 'money_6', title: 'Quadrillionaire', isSecret: false, isUnlocked: false, desc: 'Goal: Reach $1,000,000,000,000,000. Math starts breaking down.', icon: <CircleDollarSign size={40} className="text-zinc-600" /> },
  { id: 'money_7', title: 'Beyond Counting', isSecret: false, isUnlocked: false, desc: 'Goal: Max out the integer limit. Pure economic singularity.', icon: <Star size={40} className="text-zinc-600" /> },

  // 2. THE PRODUCTION ROADMAP (Pizza Milestones)
  { id: 'prod_1', title: 'First Bake', isSecret: false, isUnlocked: true, desc: 'You baked a pizza. It probably tastes okay.', icon: <Pizza size={40} className="text-orange-500" /> },
  { id: 'prod_2', title: 'Local Legend', isSecret: false, isUnlocked: true, desc: 'Baked 10,000 pizzas. The neighborhood knows your name.', icon: <Flame size={40} className="text-orange-500" /> },
  { id: 'prod_3', title: 'Pizza Magnate', isSecret: false, isUnlocked: false, desc: 'Goal: Bake 1,000,000 Pizzas', icon: <Building2 size={40} className="text-zinc-600" /> },
  { id: 'prod_4', title: 'National Chain', isSecret: false, isUnlocked: false, desc: 'Goal: Bake 100,000,000 Pizzas', icon: <Truck size={40} className="text-zinc-600" /> },
  { id: 'prod_5', title: 'Global Empire', isSecret: false, isUnlocked: false, desc: 'Goal: Bake 10 Billion Pizzas', icon: <Globe2 size={40} className="text-zinc-600" /> },
  { id: 'prod_6', title: 'Factory Planet', isSecret: false, isUnlocked: false, desc: 'Goal: Bake 1 Trillion Pizzas. The crust consumes all.', icon: <Globe2 size={40} className="text-zinc-600" /> },
  { id: 'prod_7', title: 'Universal Crust', isSecret: false, isUnlocked: false, desc: 'Goal: Bake 1 Quadrillion Pizzas.', icon: <Rocket size={40} className="text-zinc-600" /> },

  // 3. THE CARPAL TUNNEL SERIES (Clicking)
  { id: 'click_1', title: 'Warming Up', isSecret: false, isUnlocked: true, desc: 'Manually clicked the Bake button 100 times.', icon: <MousePointerClick size={40} className="text-blue-500" /> },
  { id: 'click_2', title: 'Carpal Tunnel', isSecret: false, isUnlocked: false, desc: 'Goal: Manually click 10,000 times.', icon: <Zap size={40} className="text-zinc-600" /> },
  { id: 'click_3', title: 'Machine Gun', isSecret: false, isUnlocked: false, desc: 'Goal: Manually click 100,000 times.', icon: <MousePointerClick size={40} className="text-zinc-600" /> },
  { id: 'click_4', title: 'Silicon Smasher', isSecret: false, isUnlocked: false, desc: 'Goal: Manually click 1,000,000 times. Buy a new mouse.', icon: <MousePointerClick size={40} className="text-zinc-600" /> },

  // 4. THE CORPORATE LADDER & LIFESTYLE
  { id: 'pres_1', title: 'Hostile Takeover', isSecret: false, isUnlocked: false, desc: 'Goal: Earn your first Franchise License.', icon: <Briefcase size={40} className="text-zinc-600" /> },
  { id: 'pres_2', title: 'Monopoly', isSecret: false, isUnlocked: false, desc: 'Goal: Hold 50 Franchise Licenses simultaneously.', icon: <Crown size={40} className="text-zinc-600" /> },
  { id: 'time_1', title: 'Shift Worker', isSecret: false, isUnlocked: false, desc: 'Goal: Play for 24 hours total.', icon: <Clock size={40} className="text-zinc-600" /> },

  // 5. THE 11 SYNDICATE RIDDLES (Secret Tier)
  { id: 'rid_1', title: 'The Syndicate Key', isSecret: true, isUnlocked: false, riddle: "A concealed shadow is revealed to those who look closer. Beyond the bank, what is hidden? A very specific balance is the key.", icon: <Lock size={32} className="text-rose-200" /> },
  { id: 'rid_2', title: 'Zero-Day Cipher', isSecret: true, isUnlocked: false, riddle: "The ledger is pristine, but the architecture has a flaw. Tap the un-tappable to shatter the illusion of control.", icon: <Terminal size={32} className="text-rose-200" /> },
  { id: 'rid_3', title: 'The Day Trader', isSecret: true, isUnlocked: false, riddle: "The Obsidian Syndicate feasts on the panicked. To join the table, you must intentionally bleed your own portfolio.", icon: <TrendingDown size={32} className="text-rose-200" /> },
  { id: 'rid_4', title: 'Rival CEO', isSecret: true, isUnlocked: false, riddle: "Pride is a liability. True power comes when you are willing to liquidate your soul to the corporate machine.", icon: <Building2 size={32} className="text-rose-200" /> },
  { id: 'rid_5', title: 'Alleyway Barnaby', isSecret: true, isUnlocked: false, riddle: "Where there is smoke, there is a free meal. Some clients prefer the taste of failure.", icon: <ShieldQuestion size={32} className="text-rose-200" /> },
  { id: 'rid_6', title: 'Late-Night Dave', isSecret: true, isUnlocked: false, riddle: "The best deals are made when the sun is dead. We are technically closed, but the oven is still hot.", icon: <Clock size={32} className="text-rose-200" /> },
  { id: 'rid_7', title: 'The Phantom Driver', isSecret: true, isUnlocked: false, riddle: "Execute a maneuver when the ledger reads zero. The ghost walks only when the factory is silent.", icon: <Ghost size={32} className="text-rose-200" /> },
  { id: 'rid_8', title: 'Michelin Critic', isSecret: true, isUnlocked: false, riddle: "True art cannot be bought, it must go completely viral against all mathematical odds.", icon: <Star size={32} className="text-rose-200" /> },
  { id: 'rid_9', title: 'The Office Intern', isSecret: true, isUnlocked: false, riddle: "Repetition breeds insanity, or in our case, efficiency. Drop the package at the same desk until they notice.", icon: <Briefcase size={32} className="text-rose-200" /> },
  { id: 'rid_10', title: 'The Watcher', isSecret: true, isUnlocked: false, riddle: "Patience is the currency of the elite. Do absolutely nothing, and watch the world burn.", icon: <Eye size={32} className="text-rose-200" /> },
  { id: 'rid_11', title: 'The Obsidian Truth', isSecret: true, isUnlocked: false, riddle: "A Trillion dollars in the bank, yet you refuse to sell your soul. The Syndicate respects a stubborn king.", icon: <Crown size={32} className="text-rose-200" /> }
];

export default function ExecutiveStickerbook() {
  const [selectedId, setSelectedId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [gridWidth, setGridWidth] = useState(5); 
  const containerRef = useRef(null);

  const unlockedCount = AWARDS_DB.filter(a => a.isUnlocked).length;
  const totalCount = AWARDS_DB.length;

  // Responsive Detection & Grid Column Tracking
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      // Logic must match Tailwind grid-cols exactly
      if (width >= 768) setGridWidth(5); // md:grid-cols-5
      else if (width >= 640) setGridWidth(4); // sm:grid-cols-4
      else setGridWidth(3); // default grid-cols-3
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggle = (id) => setSelectedId(selectedId === id ? null : id);

  return (
    <div className="h-[100dvh] w-full overflow-y-auto overscroll-y-contain bg-[#111112] text-zinc-100 p-4 md:p-10 font-sans flex flex-col items-center">
      
      {/* HEADER SECTION */}
      <div className="w-full max-w-4xl mb-8 flex flex-row justify-between items-end gap-2 px-2">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-zinc-100 tracking-tight uppercase">Executive Portfolio</h1>
          <p className="text-[10px] sm:text-xs text-zinc-500 font-bold tracking-widest mt-1 uppercase">Sticker Ledger v2.3 (Full Database)</p>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/50 px-4 py-2 rounded-xl shadow-inner shrink-0">
          <span className="text-xs sm:text-sm font-black text-amber-500 tabular-nums uppercase">
            {unlockedCount} / {totalCount} COLLECTED
          </span>
        </div>
      </div>

      {/* THE GRID CONTAINER */}
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-[2rem] p-4 sm:p-8 shadow-2xl relative mb-60">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 sm:gap-6 relative">
          {AWARDS_DB.map((award, index) => {
            const isSelected = selectedId === award.id;
            
            // Boundary Handling for Desktop Popovers
            const colIndex = index % gridWidth;
            const isFirstCol = colIndex === 0;
            const isLastCol = colIndex === gridWidth - 1;

            return (
              <div 
                key={award.id} 
                className="relative"
                style={{ zIndex: isSelected ? 100 : 1 }}
              >
                {/* ACHIEVEMENT PIN BUTTON */}
                <button
                  onClick={() => handleToggle(award.id)}
                  className={`w-full aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 relative group
                    ${award.isUnlocked ? 'bg-zinc-800 border-2 border-zinc-700 hover:border-zinc-500' : award.isSecret ? 'bg-zinc-950 border-2 border-rose-900/30' : 'bg-zinc-800/30 border-2 border-zinc-800/50'}
                    ${isSelected ? 'scale-110 shadow-2xl border-white/50' : 'hover:scale-105 shadow-lg'}
                  `}
                >
                  {/* UNLOCKED STATE: Gold Coin */}
                  {award.isUnlocked ? (
                    <div className="w-3/4 h-3/4 rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 p-[2px] shadow-lg">
                      <div className="w-full h-full bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-full flex items-center justify-center border border-amber-600/30">
                        <div className="scale-75 sm:scale-90 opacity-90">{award.icon}</div>
                      </div>
                      <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-zinc-950 rounded-full p-0.5 shadow-md border-2 border-zinc-900">
                        <CheckCircle2 size={12} strokeWidth={4} />
                      </div>
                    </div>
                  ) : award.isSecret ? (
                    <div className="w-2/3 h-2/3 rounded-full bg-gradient-to-br from-rose-700 to-rose-950 border border-rose-900 shadow-xl flex items-center justify-center relative overflow-hidden opacity-80">
                      <div className="absolute inset-0 bg-black/20 mix-blend-overlay"></div>
                      <div className="scale-75 text-rose-300">{award.icon}</div>
                    </div>
                  ) : (
                    <div className="scale-[0.85] brightness-150 drop-shadow-[0_1px_1px_rgba(255,255,255,0.15)] opacity-50 grayscale">
                      {award.icon}
                    </div>
                  )}
                </button>

                {/* DESKTOP INLINE POPOVER */}
                {isSelected && !isMobile && (
                  <div 
                    className={`absolute bottom-[115%] w-64 sm:w-80 transition-all duration-200 animate-in zoom-in-95 fade-in pointer-events-auto
                      ${isFirstCol ? 'left-0 origin-bottom-left' : isLastCol ? 'right-0 origin-bottom-right' : 'left-1/2 -translate-x-1/2 origin-bottom'}
                    `}
                  >
                    <div className={`p-4 rounded-2xl border-2 shadow-2xl backdrop-blur-xl bg-zinc-900/98
                      ${award.isSecret && !award.isUnlocked ? 'border-rose-500 shadow-rose-500/20' : 'border-zinc-500 shadow-black/80'}
                    `}>
                      <button onClick={() => setSelectedId(null)} className="absolute top-2 right-2 text-zinc-600 hover:text-white transition-colors">
                        <X size={16} />
                      </button>

                      {award.isSecret && !award.isUnlocked ? (
                        <>
                          <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Lock size={12} /> Encrypted File
                          </div>
                          <h3 className="text-lg font-black text-white mb-2 uppercase">Classified</h3>
                          <div className="bg-rose-950/30 border border-rose-900/50 p-3 rounded-xl italic font-serif text-sm text-rose-200/90 leading-relaxed">
                            "{award.riddle}"
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={`text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1 ${award.isUnlocked ? 'text-amber-500' : 'text-zinc-500'}`}>
                             {award.isUnlocked ? <CheckCircle2 size={12} /> : <div className="w-2 h-2 rounded-full bg-zinc-700" />}
                             {award.isUnlocked ? 'Verified Asset' : 'Pending Dossier'}
                          </div>
                          <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">{award.title}</h3>
                          <p className="text-sm text-zinc-400 leading-snug font-medium">{award.desc}</p>
                        </>
                      )}
                    </div>
                    {/* Tail Arrow: STEMS FROM BOTTOM RIGHT IF ON RIGHT COLUMN */}
                    <div className={`w-4 h-4 bg-zinc-900 border-b-2 border-r-2 transform rotate-45 absolute -bottom-2
                      ${isFirstCol ? 'left-6' : isLastCol ? 'right-6' : 'left-1/2 -translate-x-1/2'}
                      ${award.isSecret && !award.isUnlocked ? 'border-rose-500' : 'border-zinc-500'}
                    `} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE MODAL OVERLAY */}
      {isMobile && selectedId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <button onClick={() => setSelectedId(null)} className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white">
              <X size={20} />
            </button>
            
            {(() => {
              const award = AWARDS_DB.find(a => a.id === selectedId);
              if (!award) return null;
              return (
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center border-2 shadow-inner
                    ${award.isUnlocked ? 'bg-amber-400/10 border-amber-500' : award.isSecret ? 'bg-rose-900/20 border-rose-700' : 'bg-zinc-800 border-zinc-700'}
                  `}>
                    <div className={award.isUnlocked ? 'scale-150' : 'scale-125 opacity-50'}>{award.icon}</div>
                  </div>
                  
                  <div className="w-full">
                    {award.isSecret && !award.isUnlocked ? (
                      <>
                        <span className="text-xs font-black text-rose-500 tracking-[0.2em] uppercase">Encrypted Dossier</span>
                        <h2 className="text-2xl font-black text-white mt-1 uppercase">Classified</h2>
                        <div className="mt-4 bg-rose-950/40 border border-rose-900/50 p-4 rounded-2xl italic font-serif text-rose-100/90 leading-relaxed text-sm">
                          "{award.riddle}"
                        </div>
                      </>
                    ) : (
                      <>
                        <span className={`text-xs font-black tracking-[0.2em] uppercase ${award.isUnlocked ? 'text-amber-500' : 'text-zinc-500'}`}>
                           {award.isUnlocked ? 'Verified Asset' : 'Pending Goal'}
                        </span>
                        <h2 className="text-3xl font-black text-white mt-1 uppercase tracking-tight">{award.title}</h2>
                        <p className="mt-3 text-zinc-400 font-medium leading-relaxed">{award.desc}</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Global CSS for scrollbars */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}} />
    </div>
  );
}