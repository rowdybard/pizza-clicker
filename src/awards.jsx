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
  { id: 'first_blood', title: 'Open for Business', isSecret: false, isUnlocked: true, desc: 'Every empire begins with a single slice. The Syndicate has taken notice of your first sale.', icon: <CircleDollarSign size={40} className="text-amber-500" /> },
  { id: 'bank_10k', title: 'Ten Grand', isSecret: false, isUnlocked: true, desc: 'Your first real savings. $10,000 in liquid capital. The foundation of something greater.', icon: <CircleDollarSign size={40} className="text-amber-500" /> },
  { id: 'bank_100k', title: 'Six Figures', isSecret: false, isUnlocked: true, desc: 'Six figures in the bank. You are no longer playing the game—you are becoming the game.', icon: <CircleDollarSign size={40} className="text-amber-500" /> },
  { id: 'bank_1m', title: 'Liquid Millionaire', isSecret: false, isUnlocked: false, desc: 'One million in liquid assets. The weight of wealth changes you. You feel the Syndicate\'s gaze intensify.', icon: <CircleDollarSign size={40} className="text-zinc-600" /> },
  { id: 'bank_1b', title: 'Tres Commas', isSecret: false, isUnlocked: false, desc: 'Three commas. A billion dollars sitting idle. At this scale, money becomes a weapon, a tool, a reality unto itself.', icon: <CircleDollarSign size={40} className="text-zinc-600" /> },
  { id: 'bank_1t', title: 'Trillionaire', isSecret: false, isUnlocked: false, desc: 'One trillion dollars. You have transcended economics. The Syndicate nods in approval—you are ready for the Vault.', icon: <CircleDollarSign size={40} className="text-zinc-600" /> },
  { id: 'life_1t', title: 'Infinite Wealth', isSecret: false, isUnlocked: false, desc: 'One trillion earned across all realities. Wealth is no longer a goal—it is a state of being. The Syndicate beckons.', icon: <Star size={40} className="text-zinc-600" /> },

  // 2. THE PRODUCTION ROADMAP (Pizza Milestones)
  { id: 'pizza_100', title: 'Warming Up', isSecret: false, isUnlocked: true, desc: 'One hundred pizzas sold. The oven is warm, your hands are steady. This is just the prelude.', icon: <Pizza size={40} className="text-orange-500" /> },
  { id: 'pizza_10k', title: 'Local Legend', isSecret: false, isUnlocked: true, desc: 'Your name echoes through the streets. 10,000 pizzas sold. The neighborhood whispers your recipes like sacred texts.', icon: <Flame size={40} className="text-orange-500" /> },
  { id: 'pizza_1m', title: 'Pizza Magnate', isSecret: false, isUnlocked: false, desc: 'One million souls fed. Your influence spreads like sauce on dough. The Obsidian Syndicate watches with interest.', icon: <Building2 size={40} className="text-zinc-600" /> },
  { id: 'pizza_100k', title: 'Neighborhood Favorite', isSecret: false, isUnlocked: false, desc: 'One hundred thousand pizzas. You are no longer a chef—you are an institution. A pillar of the community.', icon: <Truck size={40} className="text-zinc-600" /> },
  { id: 'pizza_10m', title: 'National Chain', isSecret: false, isUnlocked: false, desc: 'Ten million pizzas across the nation. Your brand is everywhere. The Syndicate takes note of your expansion.', icon: <Globe2 size={40} className="text-zinc-600" /> },
  { id: 'pizza_1b', title: 'Global Dominance', isSecret: false, isUnlocked: false, desc: 'One billion pizzas sold worldwide. Nations rise and fall on your supply chain. You are no longer in the pizza business—you ARE the pizza business.', icon: <Globe2 size={40} className="text-zinc-600" /> },
  { id: 'pizza_1t', title: 'Universal Crust', isSecret: false, isUnlocked: false, desc: 'One trillion pizzas baked across all realities. The crust transcends space and time.', icon: <Rocket size={40} className="text-zinc-600" /> },

  // 3. THE CARPAL TUNNEL SERIES (Clicking)
  { id: 'click_100', title: 'Finger Stretches', isSecret: false, isUnlocked: true, desc: 'One hundred clicks. Your fingers learn the rhythm. Click. Profit. Repeat. The mantra begins.', icon: <MousePointerClick size={40} className="text-blue-500" /> },
  { id: 'clicker_1k', title: 'Carpal Tunnel', isSecret: false, isUnlocked: false, desc: 'Your fingers have become instruments of profit. 1,000 clicks. Each one a prayer to the god of commerce.', icon: <Zap size={40} className="text-zinc-600" /> },
  { id: 'click_10k', title: 'Clicking Machine', isSecret: false, isUnlocked: false, desc: 'Ten thousand clicks. You and the pizza are one. The boundary between action and intention dissolves.', icon: <MousePointerClick size={40} className="text-zinc-600" /> },
  { id: 'click_100k', title: 'The Auto-Clicker', isSecret: false, isUnlocked: false, desc: 'One hundred thousand clicks. Are you clicking, or is the universe clicking through you? The Syndicate knows the answer.', icon: <MousePointerClick size={40} className="text-zinc-600" /> },

  // 4. THE CORPORATE LADDER & LIFESTYLE
  { id: 'sellout', title: 'Corporate Sellout', isSecret: false, isUnlocked: false, desc: 'You sold your soul for a Franchise License. But was it really yours to begin with? The cycle begins anew.', icon: <Briefcase size={40} className="text-zinc-600" /> },
  { id: 'combo_max', title: 'On Fire!', isSecret: false, isUnlocked: false, desc: 'Time bends to your will. 100x combo achieved. You have touched the edge of what the Syndicate calls "The Flow State."', icon: <Zap size={40} className="text-zinc-600" /> },
  { id: 'perfect_pull', title: 'Chef\'s Kiss', isSecret: false, isUnlocked: false, desc: 'Perfection achieved. The oven reveals its secrets only to those who listen. This is the first step toward mastery.', icon: <Flame size={40} className="text-zinc-600" /> },
  { id: 'combo_10', title: 'Heating Up', isSecret: false, isUnlocked: false, desc: 'Ten-click combo. The rhythm accelerates. You feel the heat building, the momentum gathering.', icon: <Zap size={40} className="text-zinc-600" /> },
  { id: 'combo_50', title: 'Blazing Fast', isSecret: false, isUnlocked: false, desc: 'Fifty-click combo. Your hands are a blur. Time itself seems to slow around you. The Syndicate calls this "temporal dilation."', icon: <Zap size={40} className="text-zinc-600" /> },
  { id: 'perfect_10', title: 'Oven Master', isSecret: false, isUnlocked: false, desc: 'Ten perfect pizzas. You have learned to read the oven\'s language. Heat, time, and intuition become one.', icon: <Flame size={40} className="text-zinc-600" /> },
  { id: 'perfect_50', title: 'Flawless Execution', isSecret: false, isUnlocked: false, desc: 'Fifty perfect pizzas. Perfection is no longer luck—it is your default state. The oven obeys your will.', icon: <Flame size={40} className="text-zinc-600" /> },
  { id: 'delivery_first', title: 'Road Trip', isSecret: false, isUnlocked: false, desc: 'The first delivery through the time-warped routes. You have glimpsed the temporal network the Syndicate controls.', icon: <Truck size={40} className="text-zinc-600" /> },
  { id: 'delivery_10', title: 'Logistics Master', isSecret: false, isUnlocked: false, desc: 'Ten journeys through folded space. You begin to understand: the map is not the territory. The territory is whatever you make it.', icon: <Truck size={40} className="text-zinc-600" /> },
  { id: 'delivery_50', title: 'Logistics Expert', isSecret: false, isUnlocked: false, desc: 'Fifty deliveries through the warped routes. You navigate the impossible with ease. The Syndicate\'s temporal network is yours to command.', icon: <Rocket size={40} className="text-zinc-600" /> },
  { id: 'delivery_250', title: 'Worldwide Shipping', isSecret: false, isUnlocked: false, desc: 'Two hundred fifty deliveries across space and time. You have mastered the art of being everywhere at once.', icon: <Rocket size={40} className="text-zinc-600" /> },
  { id: 'rep_500', title: 'Rising Star', isSecret: false, isUnlocked: false, desc: 'Five hundred reputation points. People speak your name with reverence. Your star is ascending.', icon: <Star size={40} className="text-zinc-600" /> },
  { id: 'rep_10k', title: 'Household Name', isSecret: false, isUnlocked: false, desc: 'Ten thousand reputation. You are legend. Children dream of your pizzas. The Syndicate sees potential.', icon: <Star size={40} className="text-zinc-600" /> },

  // 5. THE 11 SYNDICATE RIDDLES (Secret Tier)
  { id: 'dispo_sadge', title: 'Scammed Outta Dispo', isSecret: true, isUnlocked: false, riddle: "Exactly $13.00. A very specific balance. The Syndicate smiles. You have found the first key hidden in plain sight.", icon: <Lock size={32} className="text-rose-200" /> },
  { id: 'secret_2', title: 'Zero-Day Cipher', isSecret: true, isUnlocked: false, riddle: "The ledger is pristine, but the architecture has a flaw. Tap the un-tappable to shatter the illusion of control.", icon: <Terminal size={32} className="text-rose-200" /> },
  { id: 'secret_3', title: 'The Day Trader', isSecret: true, isUnlocked: false, riddle: "The Obsidian Syndicate feasts on the panicked. To join the table, you must intentionally bleed your own portfolio.", icon: <TrendingDown size={32} className="text-rose-200" /> },
  { id: 'secret_4', title: 'Rival CEO', isSecret: true, isUnlocked: false, riddle: "Pride is a liability. True power comes when you are willing to liquidate your soul to the corporate machine.", icon: <Building2 size={32} className="text-rose-200" /> },
  { id: 'secret_5', title: 'Alleyway Barnaby', isSecret: true, isUnlocked: false, riddle: "Where there is smoke, there is a free meal. Some clients prefer the taste of failure.", icon: <ShieldQuestion size={32} className="text-rose-200" /> },
  { id: 'secret_6', title: 'Late-Night Dave', isSecret: true, isUnlocked: false, riddle: "The best deals are made when the sun is dead. We are technically closed, but the oven is still hot.", icon: <Clock size={32} className="text-rose-200" /> },
  { id: 'secret_7', title: 'The Phantom Driver', isSecret: true, isUnlocked: false, riddle: "Execute a maneuver when the ledger reads zero. The ghost walks only when the factory is silent.", icon: <Ghost size={32} className="text-rose-200" /> },
  { id: 'secret_8', title: 'Michelin Critic', isSecret: true, isUnlocked: false, riddle: "True art cannot be bought, it must go completely viral against all mathematical odds.", icon: <Star size={32} className="text-rose-200" /> },
  { id: 'secret_9', title: 'The Office Intern', isSecret: true, isUnlocked: false, riddle: "Repetition breeds insanity, or in our case, efficiency. Drop the package at the same desk until they notice.", icon: <Briefcase size={32} className="text-rose-200" /> },
  { id: 'secret_10', title: 'The Watcher', isSecret: true, isUnlocked: false, riddle: "Patience is the currency of the elite. Do absolutely nothing, and watch the world burn.", icon: <Eye size={32} className="text-rose-200" /> },
  { id: 'secret_11', title: 'The Obsidian Truth', isSecret: true, isUnlocked: false, riddle: "A Trillion dollars in the bank, yet you refuse to sell your soul. The Syndicate respects a stubborn king.", icon: <Crown size={32} className="text-rose-200" /> },

  // 6. ADDITIONAL REGULAR ACHIEVEMENTS
  { id: 'billionaire', title: 'Pizza Billionaire', isSecret: false, isUnlocked: false, desc: 'One billion dollars. Money is just numbers now. The Syndicate whispers: "This is only the beginning."', icon: <Crown size={40} className="text-zinc-600" /> },
  { id: 'life_10k', title: 'Humble Beginnings', isSecret: false, isUnlocked: false, desc: 'Your first $10,000 earned. Every fortune starts somewhere. The Syndicate remembers its own humble origins.', icon: <CircleDollarSign size={40} className="text-zinc-600" /> },
  { id: 'life_10m', title: 'Crust Fund', isSecret: false, isUnlocked: false, desc: 'Ten million earned across all timelines. Your legacy grows. The dough rises, as do you.', icon: <CircleDollarSign size={40} className="text-zinc-600" /> }
];

export default function ExecutiveStickerbook({ unlockedIds = [] }) {
  const [selectedId, setSelectedId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [gridWidth, setGridWidth] = useState(5); 
  const containerRef = useRef(null);

  const unlockedCount = unlockedIds.length;
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
            const isUnlocked = unlockedIds.includes(award.id);
            
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
                    ${isUnlocked ? 'bg-zinc-800 border-2 border-zinc-700 hover:border-zinc-500' : award.isSecret ? 'bg-zinc-950 border-2 border-rose-900/30' : 'bg-zinc-800/30 border-2 border-zinc-800/50'}
                    ${isSelected ? 'scale-110 shadow-2xl border-white/50' : 'hover:scale-105 shadow-lg'}
                  `}
                >
                  {/* UNLOCKED STATE: Gold Coin */}
                  {isUnlocked ? (
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
                      ${award.isSecret && !isUnlocked ? 'border-rose-500 shadow-rose-500/20' : 'border-zinc-500 shadow-black/80'}
                    `}>
                      <button onClick={() => setSelectedId(null)} className="absolute top-2 right-2 text-zinc-600 hover:text-white transition-colors">
                        <X size={16} />
                      </button>

                      {award.isSecret && !isUnlocked ? (
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
                          <div className={`text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1 ${isUnlocked ? 'text-amber-500' : 'text-zinc-500'}`}>
                             {isUnlocked ? <CheckCircle2 size={12} /> : <div className="w-2 h-2 rounded-full bg-zinc-700" />}
                             {isUnlocked ? 'Verified Asset' : 'Pending Dossier'}
                          </div>
                          <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">{award.title}</h3>
                          <p className="text-sm text-zinc-400 leading-snug font-medium">{award.desc}</p>
                        </>
                      )}
                    </div>
                    {/* Tail Arrow: STEMS FROM BOTTOM RIGHT IF ON RIGHT COLUMN */}
                    <div className={`w-4 h-4 bg-zinc-900 border-b-2 border-r-2 transform rotate-45 absolute -bottom-2
                      ${isFirstCol ? 'left-6' : isLastCol ? 'right-6' : 'left-1/2 -translate-x-1/2'}
                      ${award.isSecret && !isUnlocked ? 'border-rose-500' : 'border-zinc-500'}
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
                    ${isUnlocked ? 'bg-amber-400/10 border-amber-500' : award.isSecret ? 'bg-rose-900/20 border-rose-700' : 'bg-zinc-800 border-zinc-700'}
                  `}>
                    <div className={isUnlocked ? 'scale-150' : 'scale-125 opacity-50'}>{award.icon}</div>
                  </div>
                  
                  <div className="w-full">
                    {award.isSecret && !isUnlocked ? (
                      <>
                        <span className="text-xs font-black text-rose-500 tracking-[0.2em] uppercase">Encrypted Dossier</span>
                        <h2 className="text-2xl font-black text-white mt-1 uppercase">Classified</h2>
                        <div className="mt-4 bg-rose-950/40 border border-rose-900/50 p-4 rounded-2xl italic font-serif text-rose-100/90 leading-relaxed text-sm">
                          "{award.riddle}"
                        </div>
                      </>
                    ) : (
                      <>
                        <span className={`text-xs font-black tracking-[0.2em] uppercase ${isUnlocked ? 'text-amber-500' : 'text-zinc-500'}`}>
                           {isUnlocked ? 'Verified Asset' : 'Pending Goal'}
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