import React, { useState, useRef, useEffect } from 'react';
import { 
  Star, Pizza, Building2, Flame, Globe2, 
  Lock, MousePointerClick, CircleDollarSign, 
  ShieldQuestion, CheckCircle2, Crown, Terminal, 
  TrendingDown, Briefcase, Zap, Rocket, Truck, 
  Clock, Ghost, Eye
} from 'lucide-react';

// --- THE EXPANDED DATABASE (Template for your 55 items) ---
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

  // 4. THE CORPORATE LADDER (Prestige)
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
  // Default to showing the first unlocked award in the focus panel
  const [selectedAward, setSelectedAward] = useState(AWARDS_DB[0]);
  const [showModal, setShowModal] = useState(false);
  const focusPanelRef = useRef(null);

  const unlockedCount = AWARDS_DB.filter(a => a.isUnlocked).length;
  const totalCount = AWARDS_DB.length;

  const handleAwardClick = (award) => {
    setSelectedAward(award);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // Scroll to award when selection changes (mobile-friendly)
  useEffect(() => {
    // Find the clicked award button and scroll it into view
    const awardButton = document.querySelector(`[data-award-id="${selectedAward.id}"]`);
    if (awardButton) {
      // On mobile, use center; on desktop, use nearest for better UX
      const isMobile = window.innerWidth < 768;
      awardButton.scrollIntoView({ behavior: 'smooth', block: isMobile ? 'center' : 'nearest' });
    }
  }, [selectedAward]);

  return (
    // Self-contained scroll viewport to override App.jsx hidden overflow
    <div className="h-[100dvh] w-full overflow-y-auto overscroll-y-contain bg-[#1c1c1e] text-zinc-100 p-3 sm:p-6 md:p-8 font-sans flex flex-col items-center pb-32">
      
      {/* HEADER */}
      <div className="w-full max-w-4xl mb-4 md:mb-6 flex flex-row justify-between items-end px-1 md:px-2 gap-2">
        <div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-zinc-100 tracking-tight mb-0 md:mb-1">
            Executive Portfolio
          </h1>
          <p className="text-[10px] sm:text-sm text-zinc-400 font-medium hidden sm:block">
            Tap a pin to view its associated dossier.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700/50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl shadow-inner shrink-0">
          <span className="text-[10px] sm:text-sm font-bold text-zinc-300 hidden sm:inline">Completion</span>
          <span className="text-sm sm:text-lg font-black text-amber-500 tabular-nums">
            {unlockedCount} / {totalCount}
          </span>
        </div>
      </div>

      
      {/* --- 2. THE TACTILE GRID (3 wide on mobile) --- */}
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-inner overflow-visible">
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 overflow-visible">
          {AWARDS_DB.map((award) => {
            const isSelected = selectedAward.id === award.id;

            // STATE A: Unlocked (Gold Enamel Pin)
            if (award.isUnlocked) {
              return (
                <div key={award.id} className="relative">
                  <button 
                    data-award-id={award.id}
                    onClick={() => handleAwardClick(award)}
                    className={`relative aspect-square rounded-xl md:rounded-[1.25rem] flex items-center justify-center transition-all duration-200 w-full
                      bg-zinc-800 border-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900
                      ${isSelected && showModal ? 'border-amber-400 scale-110 z-10 shadow-[0_10px_20px_rgba(0,0,0,0.5)]' : 'border-zinc-700 hover:border-zinc-500 hover:scale-105'}`}
                  >
                    <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-zinc-950 rounded-full p-0.5 shadow-md z-20">
                      <CheckCircle2 size={12} strokeWidth={3} className="sm:w-[14px] sm:h-[14px]" />
                    </div>
                    {/* The "Pin" */}
                    <div className="w-3/4 h-3/4 rounded-full bg-gradient-to-br from-yellow-100 via-amber-400 to-amber-600 p-[2px] shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                      <div className="w-full h-full bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-full flex items-center justify-center border border-amber-600/50">
                        <div className="scale-75 drop-shadow-sm">{award.icon}</div>
                      </div>
                    </div>
                  </button>
                  
                  {/* Popover panel attached to this award */}
                  {isSelected && showModal && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-80 z-50 pointer-events-auto">
                      <div className="bg-zinc-800/98 border-2 border-amber-400 rounded-xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl">
                        <button 
                          onClick={closeModal}
                          className="absolute -top-2 -right-2 bg-zinc-900 border border-zinc-700 rounded-full w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors shadow-lg"
                        >
                          <span className="text-sm">×</span>
                        </button>
                        
                        <div className="flex items-center gap-1 mb-2">
                          <CheckCircle2 size={12} className="text-amber-500" />
                          <span className="text-xs font-black text-amber-500 uppercase tracking-wider">Verified</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white mb-2">{award.title}</h3>
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{award.desc}</p>
                      </div>
                      {/* Arrow pointing to icon */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-amber-400"></div>
                    </div>
                  )}
                </div>
              );
            }

            // STATE B: Syndicate Secret (Wax Seal / Locked Folder)
            if (award.isSecret) {
              return (
                <div key={award.id} className="relative">
                  <button 
                    data-award-id={award.id}
                    onClick={() => handleAwardClick(award)}
                    className={`relative aspect-square rounded-xl md:rounded-[1.25rem] flex items-center justify-center transition-all duration-200 w-full
                      bg-zinc-950 border-2 shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-zinc-900
                      ${isSelected && showModal ? 'border-rose-500 scale-110 z-10 shadow-[0_10px_20px_rgba(0,0,0,0.5)]' : 'border-rose-900/20 hover:border-rose-800/50 hover:scale-105'}`}
                  >
                    {/* The "Wax Seal" */}
                    <div className="w-2/3 h-2/3 rounded-full bg-gradient-to-br from-rose-700 to-rose-950 border border-rose-900 shadow-xl flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/20 mix-blend-overlay"></div>
                      <div className="scale-75 text-rose-300 opacity-90">{award.icon}</div>
                    </div>
                  </button>
                  
                  {/* Popover panel for secret awards */}
                  {isSelected && showModal && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-80 z-50 pointer-events-auto">
                      <div className="bg-zinc-800/98 border-2 border-rose-500 rounded-xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl">
                        <button 
                          onClick={closeModal}
                          className="absolute -top-2 -right-2 bg-zinc-900 border border-zinc-700 rounded-full w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors shadow-lg"
                        >
                          <span className="text-sm">×</span>
                        </button>
                        
                        <div className="flex items-center gap-1 mb-2">
                          <Lock size={12} className="text-rose-500" />
                          <span className="text-xs font-black text-rose-500 uppercase tracking-wider">Encrypted</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-zinc-100 mb-2">Classified</h3>
                        <div className="bg-rose-950/30 border border-rose-900/50 p-2 rounded-lg">
                          <p className="text-xs sm:text-sm text-rose-200/80 italic leading-relaxed font-serif">"{award.riddle}"</p>
                        </div>
                      </div>
                      {/* Arrow pointing to icon */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-rose-500"></div>
                    </div>
                  )}
                </div>
              );
            }

            // STATE C: Normal Locked (Recessed Silhouette)
            return (
              <div key={award.id} className="relative">
                <button 
                  data-award-id={award.id}
                  onClick={() => handleAwardClick(award)}
                  className={`relative aspect-square rounded-xl md:rounded-[1.25rem] flex items-center justify-center transition-all duration-200 w-full
                    bg-zinc-800/30 border-2 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900
                    ${isSelected && showModal ? 'border-zinc-400 scale-110 z-10 shadow-[0_10px_20px_rgba(0,0,0,0.5)] bg-zinc-800/60' : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50'}`}
                >
                  {/* INDENTED 3D SHADOW EFFECT (Lightened): 
                    - brightness-150 forces the dark zinc-600 icons into a highly visible silver/gray.
                    - drop-shadow adds a crisp 1px bright rim to the bottom edge simulating a light source from above.
                    - opacity-80 ensures it blends into the background without disappearing.
                  */}
                  <div className="scale-[0.85] brightness-150 drop-shadow-[0_1px_1px_rgba(255,255,255,0.15)] opacity-80 transition-all duration-200">
                    {award.icon}
                  </div>
                </button>
                
                {/* Popover panel for locked awards */}
                {isSelected && showModal && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 sm:w-80 z-50 pointer-events-auto">
                    <div className="bg-zinc-800/98 border-2 border-zinc-400 rounded-xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl">
                      <button 
                        onClick={closeModal}
                        className="absolute -top-2 -right-2 bg-zinc-900 border border-zinc-700 rounded-full w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors shadow-lg"
                      >
                        <span className="text-sm">×</span>
                      </button>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <div className="w-2 h-2 rounded-full bg-zinc-600" />
                        <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">Pending</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white mb-2">{award.title}</h3>
                      <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{award.desc}</p>
                    </div>
                    {/* Arrow pointing to icon */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-zinc-400"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>


      </div>

    </div>
  );
}
