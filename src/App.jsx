import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { 
  Pizza, Car, Store, TrendingUp, TrendingDown, ShoppingCart, 
  DollarSign, ChefHat, Users, Award, Star, Zap, Clock, Building,
  Plane, Rocket, Gem, Crown, Coffee, MousePointerClick, Flame,
  Trophy, Droplets, Sparkles, CheckCircle, Lock, Settings, Save, Download, Upload, AlertTriangle,
  Map, Home, Briefcase, Moon, Mic, MicOff, ScrollText, MapPin, Package
} from 'lucide-react';

const SAVE_KEY = 'pizzaTycoonSave_v10';

// --- WEB AUDIO SYNTHESIZER (singleton context, always resumed) ---
let _audioCtx = null;
const getAudioCtx = () => {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
};
let _isMuted = false;
const playSound = (type) => {
  if (_isMuted) return;
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.05);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'chaching') {
      [800, 1200].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.12, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.08);
        osc.start(now + i * 0.07); osc.stop(now + i * 0.07 + 0.08);
      });
    } else if (type === 'sizzle') {
      const bufSize = ctx.sampleRate * 0.5;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      src.buffer = buf; src.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      src.start(now); src.stop(now + 0.5);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    }
  } catch (e) { /* AudioContext blocked silently */ }
};

// --- ANTI-CORRUPTION SAVE SANITIZER ---
const safeNum = (val, fallback = 0) => {
  const parsed = Number(val);
  return (typeof parsed === 'number' && !isNaN(parsed)) ? parsed : fallback;
};

// --- ACHIEVEMENT DEFINITIONS ---
const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'Open for Business', desc: 'Sell your first pizza.', req: (s) => s.totalPizzasSold >= 1 },
  { id: 'pizza_10k', name: 'Local Legend', desc: 'Sell 10,000 pizzas total.', req: (s) => s.totalPizzasSold >= 10000 },
  { id: 'pizza_1m', name: 'Pizza Magnate', desc: 'Sell 1,000,000 pizzas total.', req: (s) => s.totalPizzasSold >= 1000000 },
  { id: 'clicker_1k', name: 'Carpal Tunnel', desc: 'Click the pizza 1,000 times.', req: (s) => s.totalClicks >= 1000 },
  { id: 'combo_max', name: 'On Fire!', desc: 'Reach a 100x Click Combo.', req: (s) => s.combo >= 100 },
  { id: 'perfect_pull', name: 'Chef\'s Kiss', desc: 'Pull a Perfect pizza from the oven.', req: (s) => s.perfectBakes >= 1 },
  { id: 'delivery_first', name: 'Road Trip', desc: 'Complete your first map delivery.', req: (s) => s.deliveriesCompleted >= 1 },
  { id: 'delivery_10', name: 'Logistics Master', desc: 'Complete 10 map deliveries.', req: (s) => s.deliveriesCompleted >= 10 },
  { id: 'dispo_sadge', name: 'Scammed Outta Dispo', desc: 'Have exactly $13.00 in the bank.', req: (s) => Math.round(s.money * 100) === 1300 },
  { id: 'sellout', name: 'Corporate Sellout', desc: 'Prestige your restaurant for the first time.', req: (s) => s.franchiseLicenses > 0 },
  { id: 'billionaire', name: 'Pizza Billionaire', desc: 'Earn $1,000,000,000 lifetime.', req: (s) => s.lifetimeMoney >= 1000000000 },

  // Bank Balance
  { id: 'bank_10k', name: 'Ten Grand', desc: 'Save $10,000 in the bank.', req: (s) => s.money >= 10000 },
  { id: 'bank_100k', name: 'Six Figures', desc: 'Save $100,000 in the bank.', req: (s) => s.money >= 100000 },
  { id: 'bank_1m', name: 'Liquid Millionaire', desc: 'Save $1,000,000 in the bank.', req: (s) => s.money >= 1000000 },
  { id: 'bank_1b', name: 'Tres Commas', desc: 'Save $1,000,000,000 in the bank.', req: (s) => s.money >= 1000000000 },
  { id: 'bank_1t', name: 'Trillionaire', desc: 'Save $1,000,000,000,000 in the bank.', req: (s) => s.money >= 1000000000000 },

  // Lifetime Earnings
  { id: 'life_10k', name: 'Humble Beginnings', desc: 'Earn $10,000 lifetime.', req: (s) => s.lifetimeMoney >= 10000 },
  { id: 'life_10m', name: 'Pizza Empire', desc: 'Earn $10,000,000 lifetime.', req: (s) => s.lifetimeMoney >= 10000000 },
  { id: 'life_1t', name: 'Infinite Wealth', desc: 'Earn $1,000,000,000,000 lifetime.', req: (s) => s.lifetimeMoney >= 1000000000000 },

  // Total Pizzas Sold
  { id: 'pizza_100', name: 'Warming Up', desc: 'Sell 100 pizzas total.', req: (s) => s.totalPizzasSold >= 100 },
  { id: 'pizza_100k', name: 'Neighborhood Favorite', desc: 'Sell 100,000 pizzas total.', req: (s) => s.totalPizzasSold >= 100000 },
  { id: 'pizza_10m', name: 'National Chain', desc: 'Sell 10,000,000 pizzas total.', req: (s) => s.totalPizzasSold >= 10000000 },
  { id: 'pizza_1b', name: 'Global Dominance', desc: 'Sell 1,000,000,000 pizzas total.', req: (s) => s.totalPizzasSold >= 1000000000 },

  // Clicking
  { id: 'click_100', name: 'Finger Stretches', desc: 'Click the pizza 100 times.', req: (s) => s.totalClicks >= 100 },
  { id: 'click_10k', name: 'Clicking Machine', desc: 'Click the pizza 10,000 times.', req: (s) => s.totalClicks >= 10000 },
  { id: 'click_100k', name: 'The Auto-Clicker', desc: 'Click the pizza 100,000 times.', req: (s) => s.totalClicks >= 100000 },

  // Combos
  { id: 'combo_10', name: 'Heating Up', desc: 'Reach a 10x Click Combo.', req: (s) => s.combo >= 10 },
  { id: 'combo_50', name: 'Blazing Fast', desc: 'Reach a 50x Click Combo.', req: (s) => s.combo >= 50 },

  // Perfect Bakes
  { id: 'perfect_10', name: 'Oven Master', desc: 'Pull 10 Perfect pizzas from the oven.', req: (s) => s.perfectBakes >= 10 },
  { id: 'perfect_50', name: 'Flawless Execution', desc: 'Pull 50 Perfect pizzas from the oven.', req: (s) => s.perfectBakes >= 50 },

  // Deliveries
  { id: 'delivery_50', name: 'Logistics Expert', desc: 'Complete 50 map deliveries.', req: (s) => s.deliveriesCompleted >= 50 },
  { id: 'delivery_250', name: 'Worldwide Shipping', desc: 'Complete 250 map deliveries.', req: (s) => s.deliveriesCompleted >= 250 },

  // Reputation
  { id: 'rep_500', name: 'Rising Star', desc: 'Gain 500 Reputation.', req: (s) => s.reputation >= 500 },
  { id: 'rep_10k', name: 'Household Name', desc: 'Gain 10,000 Reputation.', req: (s) => s.reputation >= 10000 },

  // Franchise
  { id: 'franchise_5',  name: 'Corporate Board',    desc: 'Gain 5 Franchise Licenses.',   req: (s) => s.franchiseLicenses >= 5  },
  { id: 'franchise_10', name: 'Pizza Conglomerate',  desc: 'Gain 10 Franchise Licenses.',  req: (s) => s.franchiseLicenses >= 10 },
  { id: 'franchise_25', name: 'Global Syndicate',    desc: 'Gain 25 Franchise Licenses.',  req: (s) => s.franchiseLicenses >= 25 },
  { id: 'franchise_50', name: 'Pizza Empire',       desc: 'Gain 50 Franchise Licenses.',  req: (s) => s.franchiseLicenses >= 50 },
  { id: 'franchise_100', name: 'Galactic Dominance', desc: 'Gain 100 Franchise Licenses.', req: (s) => s.franchiseLicenses >= 100 },
  { id: 'franchise_150', name: 'Universal Control', desc: 'Gain 150 Franchise Licenses.', req: (s) => s.franchiseLicenses >= 150 },
  { id: 'franchise_200', name: 'Dimensional Overlord', desc: 'Gain 200 Franchise Licenses.', req: (s) => s.franchiseLicenses >= 200 },
  { id: 'franchise_250', name: 'Pizza God',          desc: 'Gain 250 Franchise Licenses.',  req: (s) => s.franchiseLicenses >= 250 },

  // Lifetime earnings — deep progression
  { id: 'life_1q',  name: 'Quadrillionaire',   desc: 'Earn $1,000,000,000,000,000 lifetime.',              req: (s) => s.lifetimeMoney >= 1e15  },
  { id: 'life_1qi', name: 'Beyond Counting',   desc: 'Earn one quintillion dollars lifetime.',             req: (s) => s.lifetimeMoney >= 1e18  },

  // Pizza volume — long-haul
  { id: 'pizza_10b', name: 'Factory Planet',   desc: 'Sell 10 billion pizzas total.',                      req: (s) => s.totalPizzasSold >= 1e10 },
  { id: 'pizza_1t',  name: 'Universe Fed',     desc: 'Sell 1 trillion pizzas total.',                      req: (s) => s.totalPizzasSold >= 1e12 },

  // Late upgrades
  { id: 'upgrade_wagyu',     name: 'Premium Grade', desc: 'Purchase a Wagyu Topping upgrade.',              req: (s) => (s.inventory?.wagyu || 0) >= 1          },
  { id: 'upgrade_antimatter',name: 'Beyond Physics', desc: 'Purchase an Antimatter Crust upgrade.',         req: (s) => (s.inventory?.antimatterCrust || 0) >= 1 },
  { id: 'upgrade_neural',    name: 'Mind Over Pizza', desc: 'Purchase a Neural Clicker upgrade.',           req: (s) => (s.inventory?.neuralClicker || 0) >= 1  },

  // Specific Upgrades
  { id: 'upgrade_michelin', name: 'Fine Dining', desc: 'Purchase a Michelin Star upgrade.', req: (s) => (s.inventory?.michelin || 0) >= 1 },
];

const DESTINATIONS = [
  { id: 'suburb',   name: 'Local Suburbs',     warpSeconds: 180,  rushSeconds: 0,  vipToken: false, cooldown: 60,   icon: <Home     className="w-8 h-8 text-green-400"  />, bg: 'from-green-900/20 to-slate-800',  border: 'border-green-500/30',  color: 'text-green-400',  label: '3 Min Idle Drop',              desc: 'Instantly collect 3 minutes of your current idle production.',
    unlockReq: { pizzas: 50,    stars: 0, lifetime: 0       }, unlockHint: 'Sell 50 pizzas to open local routes.' },
  { id: 'downtown', name: 'Downtown Office',    warpSeconds: 900,  rushSeconds: 60, vipToken: false, cooldown: 300,  icon: <Briefcase className="w-8 h-8 text-blue-400"   />, bg: 'from-blue-900/20 to-slate-800',   border: 'border-blue-500/30',   color: 'text-blue-400',   label: '15 Min Drop + Dinner Rush',   desc: 'Collect 15 minutes of idle production and trigger a 60-second Dinner Rush.',
    unlockReq: { pizzas: 0,     stars: 1, lifetime: 0       }, unlockHint: 'Reach 1-star reputation to unlock city routes.' },
  { id: 'mansion',  name: 'Billionaire Estate', warpSeconds: 7200,  rushSeconds: 0,   vipToken: true,  cooldown: 1800,  icon: <Gem      className="w-8 h-8 text-purple-400" />, bg: 'from-purple-900/20 to-slate-800',  border: 'border-purple-500/30',  color: 'text-purple-400',  label: '2 Hr Drop + VIP Token',        desc: 'Collect 2 hours of idle production and earn a permanent VIP Token (+5% to everything).',
    unlockReq: { pizzas: 0,     stars: 3, lifetime: 10000,   licenses: 0 }, unlockHint: 'Reach 3-star rep and earn $10,000 lifetime to access elite clients.' },
  { id: 'station', name: 'Orbital Pizza Station', warpSeconds: 43200, rushSeconds: 120, vipToken: true,  cooldown: 7200,  icon: <Rocket   className="w-8 h-8 text-cyan-400"   />, bg: 'from-cyan-900/20 to-slate-800',    border: 'border-cyan-500/30',    color: 'text-cyan-400',    label: '12 Hr Drop + Rush + VIP Token', desc: 'Supply the orbital station: 12 hours of idle production, a 2-minute Dinner Rush, and a VIP Token.',
    unlockReq: { pizzas: 0,     stars: 4, lifetime: 0,       licenses: 5 }, unlockHint: 'Reach 5 Franchise Licenses and 4-star rep to unlock orbital contracts.' },
];

// --- UPGRADE DEFINITIONS ---
const UPGRADES = [
  { id: 'pizzaCutter', name: 'Pro Cutter', type: 'click', baseCost: 150, multi: 1.65, baseValue: 0.75, reqStars: 0, icon: <MousePointerClick className="text-orange-400" /> },
  { id: 'doughSpinner', name: 'Dough Spinner', type: 'click', baseCost: 8000, multi: 1.65, baseValue: 7, reqStars: 1, icon: <Sparkles className="text-orange-400" /> },
  { id: 'laserSlicer', name: 'Laser Slicer', type: 'click', baseCost: 120000, multi: 1.65, baseValue: 50, reqStars: 2, icon: <Zap className="text-orange-400" /> },
  { id: 'hyperPress', name: 'Hyper Press', type: 'click', baseCost: 1200000, multi: 1.65, baseValue: 300, reqStars: 3, icon: <Rocket className="text-orange-400" /> },
  { id: 'quantumTap', name: 'Quantum Tap', type: 'click', baseCost: 50000000, multi: 1.65, baseValue: 2000, reqStars: 4, icon: <Zap className="text-orange-400" /> },
  { id: 'neuralClicker', name: 'Neural Clicker', type: 'click', baseCost: 5000000000, multi: 1.65, baseValue: 15000, reqStars: 5, icon: <Crown className="text-orange-400" /> },
  { id: 'doughRoller', name: 'Auto-Roller', type: 'production', baseCost: 75, multi: 1.18, baseValue: 0.33, reqStars: 0, icon: <ChefHat className="text-blue-400" /> },
  { id: 'lineCook', name: 'Line Cook', type: 'production', baseCost: 450, multi: 1.18, baseValue: 0.8, reqStars: 1, icon: <Users className="text-blue-400" /> },
  { id: 'driver', name: 'Prep Station', type: 'production', baseCost: 2800, multi: 1.18, baseValue: 4, reqStars: 2, icon: <Flame className="text-blue-400" /> },
  { id: 'franchise', name: 'Ghost Kitchen', type: 'production', baseCost: 25000, multi: 1.18, baseValue: 25, reqStars: 3, icon: <Store className="text-blue-400" /> },
  { id: 'drone', name: 'Robo Kitchen', type: 'production', baseCost: 180000, multi: 1.18, baseValue: 100, reqStars: 4, icon: <Zap className="text-blue-400" /> },
  { id: 'orbital', name: 'Mega Facility', type: 'production', baseCost: 1500000, multi: 1.18, baseValue: 500, reqStars: 5, icon: <Rocket className="text-blue-400" /> },
  { id: 'darkKitchen', name: 'Dark Kitchen Grid', type: 'production', baseCost: 20000000, multi: 1.18, baseValue: 2500, reqStars: 5, icon: <Moon className="text-blue-400" /> },
  { id: 'pizzaMatrix', name: 'Pizza Matrix', type: 'production', baseCost: 2000000000, multi: 1.18, baseValue: 15000, reqStars: 5, icon: <Building className="text-blue-400" /> },
  { id: 'soda', name: 'Soda Combos', type: 'quality', baseCost: 350, multi: 1.72, baseValue: 2.00, reqStars: 0, icon: <Coffee className="text-amber-400" /> },
  { id: 'garlicCrust', name: 'Garlic Crust', type: 'quality', baseCost: 800, multi: 1.72, baseValue: 4.00, reqStars: 1, icon: <Award className="text-amber-400" /> },
  { id: 'premiumMeat', name: 'Premium Meats', type: 'quality', baseCost: 5000, multi: 1.72, baseValue: 8.00, reqStars: 2, icon: <Pizza className="text-amber-400" /> },
  { id: 'woodFire', name: 'Wood-Fired Oven', type: 'quality', baseCost: 45000, multi: 1.72, baseValue: 1.50, reqStars: 3, icon: <Zap className="text-amber-400" /> },
  { id: 'truffles', name: 'Artisan Truffles', type: 'quality', baseCost: 250000, multi: 1.72, baseValue: 3.75, reqStars: 4, icon: <Gem className="text-amber-400" /> },
  { id: 'michelin', name: 'Michelin Star', type: 'quality', baseCost: 2000000, multi: 1.72, baseValue: 12.00, reqStars: 5, icon: <Crown className="text-amber-400" /> },
  { id: 'wagyu', name: 'Wagyu Topping', type: 'quality', baseCost: 80000000, multi: 1.72, baseValue: 37.50, reqStars: 5, icon: <Flame className="text-amber-400" /> },
  { id: 'antimatterCrust', name: 'Antimatter Crust', type: 'quality', baseCost: 10000000000, multi: 1.72, baseValue: 225.00, reqStars: 5, icon: <Sparkles className="text-amber-400" /> },
];

const MILESTONES = [10, 25, 50, 100, 250];
const MILESTONE_MULTS_OVERRIDE = [2.5, 2.0, 1.75, 1.5, 1.25];
const STAR_THRESHOLDS = [0, 500, 3000, 15000, 75000, 400000];
const FRANCHISE_BASE_COST = 5e12; // scaled down so licenses 5-15 are reachable

const AccSection = ({ sKey, icon, label, accentBorder, accentBg, accentText, valueColor, rows, statsOpen, setStatsOpen }) => {
  const open = statsOpen[sKey];
  return (
    <div className={`bg-zinc-900/60 border ${accentBorder} rounded-xl overflow-hidden`}>
      <button
        onClick={() => setStatsOpen(prev => ({ ...prev, [sKey]: !prev[sKey] }))}
        className={`w-full px-4 py-2.5 ${accentBg} flex items-center justify-between gap-2 hover:brightness-110 transition-all`}
      >
        <div className="flex items-center gap-2">
          <span className={accentText}>{icon}</span>
          <span className={`text-xs font-black uppercase tracking-widest ${accentText}`}>{label}</span>
        </div>
        <span className={`text-xs font-black ${accentText} transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-zinc-800/60">
          {rows.map(({ label: rl, value, sub }) => (
            <div key={rl} className="px-4 py-3 flex flex-col gap-0.5">
              <div className="text-sm font-black uppercase tracking-widest text-zinc-500">{rl}</div>
              <div className={`font-display text-lg ${valueColor} tabular-nums leading-tight`}>{value}</div>
              <div className="text-sm text-zinc-600 font-bold">{sub}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const loadSaveData = () => {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Save load failed", e);
  }
  return null;
};

const computeOfflineEarnings = (data) => {
  if (!data?.lastSaveTime || !data?.inventory) return null;
  const goneMs = Date.now() - data.lastSaveTime;
  const goneSec = Math.min(goneMs / 1000, 8 * 3600); // cap at 8 hours
  if (goneSec < 30) return null; // ignore tiny gaps
  if (goneSec < 0) return null; // prevent negative time calculations

  // Reproduce the same upgrade math from the component
  const inv = data.inventory || {};
  const licenses = safeNum(data.franchiseLicenses, 0);
  const vipToks  = safeNum(data.vipTokens, 0);
  const achievements = (data.unlockedAchievements || []).length;
  const flourShares = safeNum(data.marketShares?.flour, 0);
  const pepShares   = safeNum(data.marketShares?.pepperoni, 0);

  const getMult = (count) => {
    let m = 1;
    MILESTONES.forEach((ms, i) => { if (count >= ms) m *= MILESTONE_MULTS_OVERRIDE[i]; });
    return m;
  };

  // Reproduce star level from saved reputation
  const rep = safeNum(data.reputation, 0);
  const starScale = Math.min(2.0, 1 + (licenses * 0.15));
  const scaledThresholds = STAR_THRESHOLDS.map((t, i) => i === 0 ? 0 : Math.floor(t * starScale));
  const starLevel = scaledThresholds.filter(t => rep >= t).length - 1;

  let prodRate = 0, pizzaPrice = 2.50;
  UPGRADES.forEach(u => {
    const count = safeNum(inv[u.id], 0);
    if (u.type === 'production') prodRate  += u.baseValue * count * getMult(count);
    if (u.type === 'quality')    pizzaPrice += u.baseValue * count;
  });

  const franchiseMult   = Math.min(25, licenses <= 10
    ? 1 + (licenses * 1.2)
    : (1 + 10 * 1.2) * Math.pow(1.20, licenses - 10));
  const starPowerMult   = Math.pow(1.6, starLevel);
  const achievementMult = 1 + (achievements * 0.03);
  const vipMult         = 1 + (vipToks * 0.08);
  const flourMult       = 1 + (flourShares * 0.001);
  const pepMult         = 1 + (pepShares * 0.001);

  const licenseFloor   = licenses > 0 ? 2 * Math.pow(1.4, licenses) : 0;
  const finalProdRate  = (prodRate + licenseFloor) * franchiseMult * starPowerMult * vipMult * flourMult;
  const finalPrice     = pizzaPrice * achievementMult * vipMult * pepMult;
  const profitPerSec   = finalProdRate * finalPrice;
  const pizzasPerSec   = finalProdRate;

  if (profitPerSec <= 0) return null;

  // Apply 50% offline efficiency
  const efficiency = 0.5;
  const moneyEarned  = Math.max(0, profitPerSec * goneSec * efficiency);
  const pizzasEarned = Math.max(0, pizzasPerSec * goneSec * efficiency);

  return {
    goneMs,
    goneSec,
    moneyEarned,
    pizzasEarned,
    profitPerSec,
    efficiency,
  };
};

export default function App() {
  // --- DESKTOP DETECTION & EMERGENCY UNLOCK ---
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);
  useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.touchAction = 'manipulation';
    
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [initialData] = useState(() => loadSaveData());
  // Compute offline earnings once at load time — reused for both state init and modal display
  const _offlineCalc = useState(() => {
    const d = loadSaveData();
    return { data: d, report: computeOfflineEarnings(d) };
  })[0];
  const [offlineReport, setOfflineReport] = useState(() => _offlineCalc.report);

  // --- CORE STATE ---
  const [money, setMoney] = useState(() => {
    const savedMoney = safeNum(_offlineCalc.data?.money, 0);
    const offlineEarnings = _offlineCalc.report?.moneyEarned ?? 0;
    return Math.max(savedMoney, savedMoney + offlineEarnings);
  });
  const [totalPizzasSold, setTotalPizzasSold] = useState(() => {
    const savedPizzas = safeNum(_offlineCalc.data?.totalPizzasSold, 0);
    const offlinePizzas = _offlineCalc.report?.pizzasEarned ?? 0;
    return Math.max(savedPizzas, savedPizzas + offlinePizzas);
  });
  const [reputation, setReputation] = useState(safeNum(initialData?.reputation, 0));
  const [lifetimeMoney, setLifetimeMoney] = useState(() => {
    const savedLifetimeMoney = safeNum(_offlineCalc.data?.lifetimeMoney, 0);
    const offlineEarnings = _offlineCalc.report?.moneyEarned ?? 0;
    return Math.max(savedLifetimeMoney, savedLifetimeMoney + offlineEarnings);
  });
  const [franchiseLicenses, setFranchiseLicenses] = useState(safeNum(initialData?.franchiseLicenses, 0));
  const [inventory, setInventory] = useState(initialData?.inventory || {});

  // --- STATS, COMBO, & MAP STATE ---
  const [totalClicks, setTotalClicks] = useState(safeNum(initialData?.totalClicks, 0));
  const [perfectBakes, setPerfectBakes] = useState(safeNum(initialData?.perfectBakes, 0));
  const [unlockedAchievements, setUnlockedAchievements] = useState(initialData?.unlockedAchievements || []);
  
  const [combo, setCombo] = useState(0);
  const [comboDecayTimer, setComboDecayTimer] = useState(0);
  const [smoothCps, setSmoothCps] = useState(0);
  
  const clickTimestampsRef = useRef([]);
  const [recentCps, setRecentCps] = useState(0);

  const [deliveriesCompleted, setDeliveriesCompleted] = useState(safeNum(initialData?.deliveriesCompleted, 0));
  const [vipTokens, setVipTokens] = useState(safeNum(initialData?.vipTokens, 0));
  const [deliveryCooldowns, setDeliveryCooldowns] = useState(initialData?.deliveryCooldowns || {});

  // --- SYNDICATE STATE ---
  const [goldenSlices, setGoldenSlices] = useState(safeNum(initialData?.goldenSlices, 0));
  const [syndicatePerks, setSyndicatePerks] = useState(() => ({
    shadowCapital:  initialData?.syndicatePerks?.shadowCapital  ?? false,
    quantumOven:    initialData?.syndicatePerks?.quantumOven    ?? false,
    insiderTrading: initialData?.syndicatePerks?.insiderTrading ?? false,
    autoArm:        initialData?.syndicatePerks?.autoArm        ?? false,
    timeLoop:       initialData?.syndicatePerks?.timeLoop       ?? false,
    realityBend:    initialData?.syndicatePerks?.realityBend    ?? false,
    infiniteOven:   initialData?.syndicatePerks?.infiniteOven   ?? false,
    marketGod:      initialData?.syndicatePerks?.marketGod      ?? false,
    pizzaSingularity: initialData?.syndicatePerks?.pizzaSingularity ?? false,
    goldenTouch:    initialData?.syndicatePerks?.goldenTouch    ?? false,
    ascension:      initialData?.syndicatePerks?.ascension      ?? false,
    goldenPowerCount: initialData?.syndicatePerks?.goldenPowerCount ?? 0,
  }));

  // --- MARKET STATE ---
  const [marketUnlocked, setMarketUnlocked] = useState(initialData?.marketUnlocked || false);
  const [marketShares, setMarketShares] = useState(initialData?.marketShares || { flour: 0, cheese: 0, pepperoni: 0, truffles: 0 });
  const [marketPrices, setMarketPrices] = useState(initialData?.marketPrices || { flour: 15, cheese: 60, pepperoni: 250, truffles: 1200 });
  const [marketTrends, setMarketTrends] = useState({ flour: 1, cheese: 1, pepperoni: 1, truffles: 1 });
  const [portfolioDelta, setPortfolioDelta] = useState(initialData?.portfolioDelta ?? null);
  const [marketCostBasis, setMarketCostBasis] = useState(initialData?.marketCostBasis || { flour: 0, cheese: 0, pepperoni: 0, truffles: 0 });
  const [marketHistory, setMarketHistory] = useState(initialData?.marketHistory || { flour: Array(20).fill(15), cheese: Array(20).fill(60), pepperoni: Array(20).fill(250), truffles: Array(20).fill(1200) });

  // --- MODAL STATE ---
  const [corpOfficeOpen, setCorpOfficeOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [buyMultiplier, setBuyMultiplier] = useState(1); // Can be 1, 10, or 'MAX'

  // --- SPECIAL DELIVERY STATE ---
  const [specialDelivery, setSpecialDelivery] = useState(null);
  const [deliveryGame, setDeliveryGame] = useState(null);

  const calculateCost = (upgrade, currentCount, amount) => {
    let totalCost = 0;
    for (let i = 0; i < amount; i++) totalCost += Math.floor(upgrade.baseCost * Math.pow(upgrade.multi, currentCount + i));
    return totalCost;
  };

  const calculateMax = (upgrade, currentCount) => {
    let cost = 0;
    let amount = 0;
    let simulatedMoney = money;
    while (true) {
      const nextCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.multi, currentCount + amount));
      if (simulatedMoney >= nextCost) {
        simulatedMoney -= nextCost;
        cost += nextCost;
        amount++;
      } else break;
    }
    return { amount: Math.max(1, amount), cost: amount > 0 ? cost : Math.floor(upgrade.baseCost * Math.pow(upgrade.multi, currentCount)) };
  };

  // --- JUICE STATE ---
  const [isShaking, setIsShaking] = useState(false);
  const [frenzyMultiplier, setFrenzyMultiplier] = useState(1);
  const [goldenSliceEvent, setGoldenSliceEvent] = useState(null);

  // --- MONEY LOG STATE ---
  const [moneyLog, setMoneyLog] = useState([]);
  const pendingClickRef = useRef({ total: 0, count: 0, lastFlush: Date.now() });

  // --- EVENT VISUAL STATE ---
  const [marketCrashBanner, setMarketCrashBanner] = useState(false);
  const [instantCashPopup, setInstantCashPopup] = useState(null); // dollar amount string

  // --- MARKET MANIPULATION STATE ---
  const [marketCooldowns, setMarketCooldowns] = useState({ rumors: 0, squeeze: 0 });
  const [manipTarget, setManipTarget] = useState('flour');

  // --- VISUAL & MODAL STATE ---
  const [activeTab, setActiveTab] = useState('upgrades'); 
  const [achievementToasts, setAchievementToasts] = useState([]);
  const [clickPopups, setClickPopups] = useState([]);
  const [rushTimeLeft, setRushTimeLeft] = useState(0);
  const [vipTimeLeft, setVipTimeLeft] = useState(0);
  const [vipSpawned, setVipSpawned] = useState(false);
  const [sideOrder, setSideOrder] = useState(null); 
  const [cleanBoostTimer, setCleanBoostTimer] = useState(0);
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  const [showAscendModal, setShowAscendModal] = useState(false);
  const [showParchmentModal, setShowParchmentModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [importText, setImportText] = useState("");
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [hudSettingsOpen, setHudSettingsOpen] = useState(false);
  const [upgradeFilter, setUpgradeFilter] = useState('all');
  const [statsOpen, setStatsOpen] = useState({ production: true, clicking: false, lifetime: false, prestige: false, owned: false });
  const [revealedUpgrades, setRevealedUpgrades] = useState(() => {
    // Load from save, or default to first upgrade of each type
    const saved = initialData?.revealedUpgrades;
    if (saved && Array.isArray(saved)) return new Set(saved);
    const fallback = new Set();
    ['click','production','quality'].forEach(type => {
      const first = UPGRADES.find(u => u.type === type);
      if (first) fallback.add(first.id);
    });
    return fallback;
  });

  // --- UPGRADE REVEAL EFFECT ---
  useEffect(() => {
    setRevealedUpgrades(prev => {
      const next = new Set(prev);
      ['click','production','quality'].forEach(type => {
        const path = UPGRADES.filter(u => u.type === type);
        path.forEach((upgrade, idx) => {
          if (idx === 0) { next.add(upgrade.id); return; }
          const prev_upgrade = path[idx - 1];
          const prevCount = safeNum(inventory?.[prev_upgrade.id], 0);
          const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.multi, safeNum(inventory?.[upgrade.id], 0)));
          if (prevCount >= 1 && money >= cost * 0.8 && starLevel >= upgrade.reqStars) {
            next.add(upgrade.id);
          }
        });
      });
      return next;
    });
  // eslint-disable-next-line
  }, [money, inventory]);

  // --- DERIVED STATS MATH ---
  const prestigeStarScale = Math.min(2.0, 1 + (franchiseLicenses * 0.15));
  const scaledStarThresholds = STAR_THRESHOLDS.map((t, i) => i === 0 ? 0 : Math.floor(t * prestigeStarScale));
  const starLevel = scaledStarThresholds.filter(t => reputation >= t).length - 1;
  const nextStarReq = scaledStarThresholds[starLevel + 1] || scaledStarThresholds[scaledStarThresholds.length - 1];

  const getMilestoneMultiplier = useCallback((count) => {
    let multiplier = 1;
    MILESTONES.forEach((m, i) => { if (count >= m) multiplier *= MILESTONE_MULTS_OVERRIDE[i]; });
    return multiplier;
  }, []);
  const getNextMilestone = (count) => MILESTONES.find(m => count < m) || 'MAX';

  // Piecewise: first 5 licenses cheap (sqrt of small pool), rest on steep curve. Hard cap at 250.
  const MAX_LICENSES = 250;
  const _earlyRaw = Math.sqrt(lifetimeMoney / 150000);
  const earlyLicenses = Math.min(5, Number.isFinite(_earlyRaw) ? Math.floor(_earlyRaw) : 5);
  const _mainRaw = Math.sqrt(Math.max(0, lifetimeMoney) / FRANCHISE_BASE_COST);
  const mainLicenses = Number.isFinite(_mainRaw) ? Math.floor(_mainRaw) : MAX_LICENSES;
  const totalEarnableLicenses = Math.min(MAX_LICENSES, earlyLicenses + mainLicenses);
  const nextLicenseCost = (() => {
    if (totalEarnableLicenses >= MAX_LICENSES) return Infinity;
    const n = totalEarnableLicenses;
    if (n < 5) return Math.pow(n + 1, 2) * 150000;
    return Math.pow(n - 4, 2) * FRANCHISE_BASE_COST;
  })();
  const pendingLicenses = Math.max(0, totalEarnableLicenses - franchiseLicenses);
  // Licenses boost production + click. Steeper scaling to make runs 5+ viable.
  const franchiseMultiplier = Math.min(100, franchiseLicenses <= 10
    ? 1 + (franchiseLicenses * 1.2)
    : (1 + 10 * 1.2) * Math.pow(1.20, franchiseLicenses - 10));
  // Licenses boost pizza price: +25% per license (compounding)
  const franchisePriceMultiplier = Math.pow(1.25, franchiseLicenses);
  // Star level gives a compounding production+click bonus (1.6^stars)
  const starPowerMultiplier = Math.pow(1.6, starLevel);
  // Price-side multipliers (flat, additive base)
  const achievementMultiplier = 1 + (unlockedAchievements.length * 0.03);
  const vipTokenMultiplier = 1 + (vipTokens * 0.08);

  const { baseProductionRate, basePizzaPrice, baseClickPower } = useMemo(() => {
    let prod = 0, price = 2.50, click = 1;
    UPGRADES.forEach(u => {
      const count = safeNum(inventory?.[u.id], 0);
      const multi = getMilestoneMultiplier(count);
      if (u.type === 'production') prod  += (u.baseValue * count * multi);
      if (u.type === 'quality')    price += u.baseValue * count;
      if (u.type === 'click')      click += (u.baseValue * count * multi);
    });
    return { baseProductionRate: prod, basePizzaPrice: price, baseClickPower: click };
  }, [inventory, getMilestoneMultiplier]);

  const isRush = rushTimeLeft > 0;
  const isClean = cleanBoostTimer > 0;
  const heatBarPct = comboDecayTimer / 20;
  const comboMultiplier = (combo >= 100 && heatBarPct > 0) ? 3 : 1 + (combo * 0.01);
  
  const flourSynergyMult = 1 + Math.min(marketShares.flour * 0.001, 0.5); // Cap at 50% bonus
  const pepperoniSynergyMult = 1 + Math.min(marketShares.pepperoni * 0.001, 0.5); // Cap at 50% bonus

  // Vault perk multipliers
  const realityBendMult = syndicatePerks.realityBend ? 2 : 1;
  const goldenTouchMult = syndicatePerks.goldenTouch ? 3 : 1;
  const goldenPowerMult = 1 + (syndicatePerks.goldenPowerCount * 0.05); // 5% per purchase

  // License passive floor: guaranteed pizzas/sec even with no upgrades (much more conservative)
  const licenseProductionFloor = franchiseLicenses > 0 ? Math.sqrt(franchiseLicenses) * 0.5 : 0;
  // Production and click both benefit from licenses + star power
  const franchisedProduction = (baseProductionRate + licenseProductionFloor) * franchiseMultiplier * starPowerMultiplier * vipTokenMultiplier * flourSynergyMult * realityBendMult * goldenPowerMult;
  const franchisedPrice = basePizzaPrice * franchisePriceMultiplier * achievementMultiplier * vipTokenMultiplier * pepperoniSynergyMult * realityBendMult;
  
  // Ascension perk: clicks gain +10% of /sec production
  const synergisticClickBonus = syndicatePerks.ascension ? (displayProfitPerSec * 0.10) / pizzaPrice : 0;
  const franchisedClick = (baseClickPower + synergisticClickBonus) * franchiseMultiplier * starPowerMultiplier * vipTokenMultiplier * goldenPowerMult;
  
  const productionRate = isRush ? franchisedProduction * 2 : franchisedProduction;
  const pizzaPrice = isRush ? franchisedPrice * 1.25 : franchisedPrice;
  const currentClickPower = franchisedClick * (isClean ? 2 : 1) * comboMultiplier * frenzyMultiplier; 
  
  const idlePizzasPerSec = productionRate;
  const activePizzasPerSec = smoothCps * currentClickPower;
  const totalDisplayPizzasPerSec = idlePizzasPerSec + activePizzasPerSec;
  
  const idleProfitPerSec = idlePizzasPerSec * pizzaPrice * goldenTouchMult;
  const activeProfitPerSec = activePizzasPerSec * pizzaPrice * goldenTouchMult;
  const displayProfitPerSec = idleProfitPerSec + activeProfitPerSec;

  const getCost = (upgrade) => Math.floor(upgrade.baseCost * Math.pow(upgrade.multi, safeNum(inventory?.[upgrade.id], 0)));

  // --- DISHWASHING INTERACTION STATE ---
  const lastScrubPos = useRef({ x: 0, y: 0 });

  const handleScrubStart = (e) => {
    let clientX = 0, clientY = 0;
    if (e.type.includes('touch') && e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    lastScrubPos.current = { x: clientX, y: clientY };
  };

  const handleScrub = (e) => {
    if (!sideOrder || sideOrder.type !== 'dishes' || sideOrder.status !== 'dirty') return;

    let clientX = 0, clientY = 0;
    if (e.type.includes('touch') && e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const dx = clientX - lastScrubPos.current.x;
    const dy = clientY - lastScrubPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
        lastScrubPos.current = { x: clientX, y: clientY };
        setSideOrder(prev => {
            if (!prev || prev.type !== 'dishes' || prev.status !== 'dirty') return prev;
            const newProg = prev.progress + 2; 
            if (newProg >= prev.required) {
                setCleanBoostTimer(60);
                return { ...prev, progress: prev.required, status: 'clean' };
            }
            return { ...prev, progress: newProg };
        });
    }
  };


  // --- MONEY LOG HELPER ---
  // category: 'click' | 'idle' | 'oven' | 'delivery' | 'market' | 'golden' | 'spend'
  const pushLog = useCallback((category, label, amount) => {
    const entry = { id: Date.now() + Math.random(), ts: Date.now(), category, label, amount };
    setMoneyLog(prev => [entry, ...prev].slice(0, 200));
  }, []);

  // --- CORE ACTIONS ---
  const handleBakeAndBox = (e) => {
    playSound('pop');
    const moneyEarned = pizzaPrice * currentClickPower;

    setMoney(prev => prev + moneyEarned);
    setLifetimeMoney(prev => prev + moneyEarned);
    setTotalPizzasSold(prev => prev + currentClickPower);
    setReputation(prev => prev + Math.ceil(currentClickPower * 0.1));
    setTotalClicks(prev => prev + 1);

    // Accumulate clicks for log — flush every 5s regardless of click rate
    const pc = pendingClickRef.current;
    pc.total += moneyEarned;
    pc.count += 1;
    const flushNow = Date.now();
    if (flushNow - pc.lastFlush > 5000 && pc.count > 0) {
      pushLog('click', `${pc.count} click${pc.count > 1 ? 's' : ''}`, pc.total);
      pc.total = 0; pc.count = 0; pc.lastFlush = flushNow;
    }

    setCombo(prev => Math.min(prev + 1, 100));
    setComboDecayTimer(10); 
    
    engineRefs.current.clicksThisSecond += 1;
    engineRefs.current.lastClickTime = Date.now();
    engineRefs.current.clickTimestamps.push(Date.now());

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? (e.clientX - rect.left) + (Math.random() * 40 - 20) : rect.width / 2 + (Math.random() * 40 - 20);
    const y = e.clientY ? (e.clientY - rect.top) + (Math.random() * 40 - 20) : rect.height / 2 + (Math.random() * 40 - 20);
    
    const now = Date.now();
    setClickPopups(prev => [...prev, { id: now + Math.random(), x, y, value: fmt(moneyEarned), expiresAt: now + 1000 }]);
  };

  const handlePullFromOven = () => {
    if (!sideOrder || sideOrder.status !== 'cooking') return;

    const p = sideOrder.progress;
    let status = 'undercooked';
    let multi = 1;
    let repBonus = 0;

    // Infinite Oven perk: instant perfect with 10× rewards
    if (syndicatePerks.infiniteOven) {
        status = 'perfect';
        multi = 50; // 5× normal perfect × 10× infinite oven bonus
        repBonus = 25;
        setPerfectBakes(prev => prev + 1);
        playSound('chaching');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
    } else if (p >= 75 && p <= 88) {
        status = 'perfect';
        multi = 5; 
        repBonus = 25; 
        setPerfectBakes(prev => prev + 1);
        playSound('chaching');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
    } else if (p > 88) {
        status = 'burnt';
        multi = 0;
        playSound('error');
    }

    const profitSec = Math.max(productionRate, 1) * pizzaPrice;
    const baseReward = sideOrder.type === 'wings' ? profitSec * 45 : profitSec * 20;
    const finalReward = baseReward * multi;

    setSideOrder(prev => ({ ...prev, status, rewardEarned: finalReward }));
    
    if (finalReward > 0) {
        setMoney(m => m + finalReward);
        setLifetimeMoney(m => m + finalReward);
        pushLog('oven', `${status === 'perfect' ? '🔥 Perfect' : 'Oven'} Pull (${sideOrder.type === 'wings' ? 'Wings' : 'Bread'})`, finalReward);
        if (repBonus > 0) setReputation(r => r + repBonus);
        
        // Pizza Cascade perk: 20% chance to spawn new side order from perfect pulls
        if (syndicatePerks.pizzaSingularity && status === 'perfect' && Math.random() < 0.2) {
          const types = ['wings', 'bread'];
          const newType = types[Math.floor(Math.random() * types.length)];
          setSideOrder({
            type: newType,
            progress: 0,
            required: 100,
            status: 'dirty'
          });
          playSound('pop');
        }
    }
  };

  const triggerVIP = () => {
    setVipTimeLeft(0);
    setVipSpawned(false);
    setRushTimeLeft(30); 
  };

  const buyUpgrade = (upgrade) => {
    const currentCount = safeNum(inventory?.[upgrade.id], 0);
    const atMaxBoost = currentCount >= MILESTONES[MILESTONES.length - 1]; // 250 is max
    
    if (atMaxBoost) return; // Don't allow buying if at max boost
    
    const cost = getCost(upgrade);
    if (money >= cost) {
      setMoney(prev => prev - cost);
      setInventory(prev => ({ ...prev, [upgrade.id]: currentCount + 1 }));
      pushLog('spend', `🛒 Buy ${upgrade.name}`, -cost);
    }
  };

  const buyUpgradeN = (upgrade, n) => {
    const currentCount = safeNum(inventory?.[upgrade.id], 0);
    const maxBoost = MILESTONES[MILESTONES.length - 1]; // 250 is max
    const allowedPurchases = Math.max(0, maxBoost - currentCount);
    const actualPurchases = Math.min(n, allowedPurchases);
    
    if (actualPurchases === 0) return; // Don't allow buying if at max boost
    
    let totalCost = 0;
    for (let i = 0; i < actualPurchases; i++) {
      totalCost += Math.floor(upgrade.baseCost * Math.pow(upgrade.multi, currentCount + i));
    }
    if (money >= totalCost) {
      setMoney(prev => prev - totalCost);
      setInventory(prev => ({ ...prev, [upgrade.id]: currentCount + actualPurchases }));
      pushLog('spend', `🛒 Buy ${actualPurchases}× ${upgrade.name}`, -totalCost);
    }
  };

  const handleGoldenSliceClick = () => {
    if (!goldenSliceEvent) return;
    const { type } = goldenSliceEvent;
    playSound('chaching');
    if (type === 'frenzy') {
      setFrenzyMultiplier(7);
      setTimeout(() => setFrenzyMultiplier(1), 15000);
    } else if (type === 'marketCrash') {
      setMarketPrices(prev => {
        const next = {};
        Object.keys(prev).forEach(k => { next[k] = parseFloat((prev[k] * 0.4).toFixed(2)); });
        return next;
      });
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      setMarketCrashBanner(true);
      setTimeout(() => setMarketCrashBanner(false), 4000);
    } else if (type === 'instantCash') {
      const WARP_CAP = 1e6;
      const ips = engineRefs.current.idleProfitPerSec;
      const efficiency = 1 / (1 + ips / WARP_CAP);
      const bonus = Math.min(ips * 600 * efficiency, 1e12);
      setMoney(m => m + bonus);
      setLifetimeMoney(lm => lm + bonus);
      pushLog('golden', '✨ Golden Slice — Instant Cash', bonus);
      setInstantCashPopup(bonus);
      setTimeout(() => setInstantCashPopup(null), 3500);
    }
    setGoldenSliceEvent(null);
  };

  const triggerDelivery = (dest) => {
    const cooldownRemaining = deliveryCooldowns[dest.id] || 0;
    if (cooldownRemaining > 0) return;

    const WARP_CAP = 1e6; // softcap threshold: $1M/sec idle
    const warpEfficiency = 1 / (1 + idleProfitPerSec / WARP_CAP);
    const warpMoney = idleProfitPerSec * dest.warpSeconds * warpEfficiency;
    const warpPizzas = idlePizzasPerSec * dest.warpSeconds * warpEfficiency;
    const warpRep = Math.ceil(Math.sqrt(idlePizzasPerSec) * 0.25) * dest.warpSeconds * warpEfficiency;

    setMoney(m => m + warpMoney);
    setLifetimeMoney(m => m + warpMoney);
    pushLog('delivery', `🚗 Delivery — ${dest.name}`, warpMoney);
    setTotalPizzasSold(tp => tp + warpPizzas);
    setReputation(r => r + warpRep);

    if (dest.rushSeconds > 0) {
      setRushTimeLeft(prev => prev + dest.rushSeconds);
    }
    if (dest.vipToken) {
      const tokens = dest.id === 'station' ? 2 : 1;
      setVipTokens(t => t + tokens);
    }

    playSound('chaching');
    setDeliveriesCompleted(d => d + 1);
    setDeliveryCooldowns(prev => ({ ...prev, [dest.id]: dest.cooldown }));
  };

  const confirmPrestige = () => {
    const newLicenses = franchiseLicenses + pendingLicenses;
    setFranchiseLicenses(newLicenses);
    // Starting cash: $500 * licenses^2, or shadowCapital if larger
    const licenseStartMoney = 500 * Math.pow(newLicenses, 2);
    setMoney(Math.max(syndicatePerks.shadowCapital ? 100000 : 0, licenseStartMoney));
    setReputation(0); setTotalPizzasSold(0); setRushTimeLeft(0); setVipTimeLeft(0);
    setVipSpawned(false); setSideOrder(null); setCombo(0); setDeliveryCooldowns({});
    setInventory({});
    pushLog('spend', `🏢 Prestige +${pendingLicenses} License${pendingLicenses > 1 ? 's' : ''}`, 0);
    setShowPrestigeModal(false);
  };

  // --- SETTINGS ACTIONS ---
  const handleExportSave = () => {
    const data = { 
       money, totalPizzasSold, reputation, lifetimeMoney, franchiseLicenses, inventory, 
       totalClicks, perfectBakes, unlockedAchievements, deliveriesCompleted, vipTokens,
       marketUnlocked, marketShares, goldenSlices, syndicatePerks, marketCooldowns, manipTarget, deliveryCooldowns, revealedUpgrades: Array.from(revealedUpgrades)
    };
    navigator.clipboard.writeText(btoa(JSON.stringify(data)));
    alert("Save code copied to clipboard!");
  };

  const handleImportSave = () => {
    try {
      if (!importText) return;
      const decoded = JSON.parse(atob(importText));
      if (decoded.money !== undefined) {
        setMoney(safeNum(decoded.money)); setTotalPizzasSold(safeNum(decoded.totalPizzasSold)); setReputation(safeNum(decoded.reputation));
        setLifetimeMoney(safeNum(decoded.lifetimeMoney)); setFranchiseLicenses(safeNum(decoded.franchiseLicenses));
        setInventory(decoded.inventory || {}); setTotalClicks(safeNum(decoded.totalClicks)); setPerfectBakes(safeNum(decoded.perfectBakes));
        setUnlockedAchievements(decoded.unlockedAchievements || []);
        setDeliveriesCompleted(safeNum(decoded.deliveriesCompleted)); setVipTokens(safeNum(decoded.vipTokens));
        setMarketUnlocked(decoded.marketUnlocked || false);
        setMarketShares(decoded.marketShares || { flour: 0, cheese: 0, pepperoni: 0, truffles: 0 });
        if (decoded.goldenSlices !== undefined) setGoldenSlices(safeNum(decoded.goldenSlices));
        if (decoded.syndicatePerks) setSyndicatePerks(p => ({ ...p, ...decoded.syndicatePerks }));
        if (decoded.marketCooldowns) setMarketCooldowns(decoded.marketCooldowns);
        if (decoded.manipTarget) setManipTarget(decoded.manipTarget);
        if (decoded.deliveryCooldowns) setDeliveryCooldowns(decoded.deliveryCooldowns);
        if (decoded.revealedUpgrades) setRevealedUpgrades(new Set(decoded.revealedUpgrades));
        setShowSettings(false); setImportText("");
      }
    } catch (e) {
      alert("Invalid save code!");
    }
  };

  const handleHardReset = () => {
    localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  };

  const handleManualSave = () => {
    const data = { 
       money, totalPizzasSold, reputation, lifetimeMoney, franchiseLicenses, inventory, 
       totalClicks, perfectBakes, unlockedAchievements, deliveriesCompleted, vipTokens,
       marketUnlocked, marketShares, goldenSlices, syndicatePerks, marketCooldowns, manipTarget, deliveryCooldowns, revealedUpgrades: Array.from(revealedUpgrades), lastSaveTime: Date.now() 
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    alert("Game saved successfully!");
  };

  const idleLogTickRef = useRef(0);
  const pushLogRef = useRef(null);
  useEffect(() => { pushLogRef.current = pushLog; }, [pushLog]);

  // --- HIGH PERFORMANCE ENGINE REF CACHING ---
  const engineRefs = useRef({
      idleProfitPerSec: 0, idlePizzasPerSec: 0, idleRepPerSec: 0,
      lastClickTime: Date.now(), clicksThisSecond: 0,
      rushTimeLeft: 0, vipSpawned: false, hasStarted: false,
      clickTimestamps: [], // ring buffer for rolling CPS
      syndicatePerks: { shadowCapital: false, quantumOven: false, insiderTrading: false, autoArm: false },
      currentClickPower: 1, pizzaPrice: 2.5, idleClickMoney: 0,
  });
  useEffect(() => {
      engineRefs.current.idleProfitPerSec = idleProfitPerSec;
      engineRefs.current.idlePizzasPerSec = idlePizzasPerSec;
      engineRefs.current.idleRepPerSec = Math.ceil(Math.sqrt(idlePizzasPerSec));
      engineRefs.current.rushTimeLeft = rushTimeLeft;
      engineRefs.current.vipSpawned = vipSpawned;
      engineRefs.current.hasStarted = totalPizzasSold > 0;
      engineRefs.current.syndicatePerks = syndicatePerks;
      engineRefs.current.currentClickPower = currentClickPower;
      engineRefs.current.pizzaPrice = pizzaPrice;
      engineRefs.current.idleClickMoney = currentClickPower * pizzaPrice;
  }, [idleProfitPerSec, idlePizzasPerSec, rushTimeLeft, vipSpawned, totalPizzasSold, syndicatePerks, currentClickPower, pizzaPrice]);

  // 1. The 100ms Smooth Ticker & Combo Engine
  useEffect(() => {
      const smoothTick = setInterval(() => {
          const state = engineRefs.current;
          
          if (state.idlePizzasPerSec > 0) {
              setMoney(m => m + (state.idleProfitPerSec / 10));
              setLifetimeMoney(lm => lm + (state.idleProfitPerSec / 10));
              setTotalPizzasSold(tp => tp + (state.idlePizzasPerSec / 10));
              setReputation(r => r + (state.idleRepPerSec / 10));
          }

          const timeSinceClick = Date.now() - state.lastClickTime;
          if (timeSinceClick > 2000) {
              // Flush any pending click batch to log when player stops clicking
              const pc = pendingClickRef.current;
              if (pc.count > 0) {
                pushLogRef.current?.('click', `${pc.count} click${pc.count > 1 ? 's' : ''}`, pc.total);
                pc.total = 0; pc.count = 0; pc.lastFlush = Date.now();
              }
              setCombo(prev => prev > 0 ? 0 : prev);
              setComboDecayTimer(prev => prev > 0 ? 0 : prev);
          } else {
              const nextDecay = 20 - Math.floor(timeSinceClick / 100);
              setComboDecayTimer(prev => prev === nextDecay ? prev : nextDecay);
          }

          // Sweep expired click popups (replaces N individual setTimeouts)
          const now = Date.now();
          setClickPopups(prev => prev.length > 0 ? prev.filter(p => p.expiresAt > now) : prev);

          // Rolling 3s CPS — trim old timestamps and count remainder
          const cutoff = now - 3000;
          engineRefs.current.clickTimestamps = engineRefs.current.clickTimestamps.filter(t => t > cutoff);
          const rollingCps = engineRefs.current.clickTimestamps.length / 3;
          setSmoothCps(prev => prev === rollingCps ? prev : rollingCps);
      }, 100);
      return () => clearInterval(smoothTick);
  }, []);

  // 2. The 1000ms Action & Event Loop
  useEffect(() => {
      const eventTick = setInterval(() => {
          const state = engineRefs.current;

          setRecentCps(state.clicksThisSecond);
          state.clicksThisSecond = 0; 

          const timerSlowdown = syndicatePerks.timeLoop ? 0.2 : 1; // 5× slower = decrement by 0.2 instead of 1
          setRushTimeLeft(prev => Math.max(0, prev - timerSlowdown));
          setCleanBoostTimer(prev => Math.max(0, prev - timerSlowdown));

          setVipTimeLeft(prev => {
              if (prev > 0) return Math.max(0, prev - timerSlowdown);
              if (prev === 0 && state.rushTimeLeft === 0 && state.hasStarted && !state.vipSpawned && Math.random() < 0.002) {
                  setVipSpawned(true); return 10;
              }
              if (prev === 0 && state.vipSpawned) setVipSpawned(false);
              return 0;
          });

          setSideOrder(prevOrder => {
              if (!prevOrder && !state.vipSpawned && state.rushTimeLeft === 0 && state.hasStarted && Math.random() < 0.035) {
                  const roll = Math.random();
                  if (roll < 0.3) return { type: 'dishes', progress: 0, required: 100, status: 'dirty' };
                  const isWings = roll > 0.65;
                  return { type: isWings ? 'wings' : 'bread', progress: 0, status: 'cooking', speed: isWings ? 3 : 1.8 };
              }
              return prevOrder;
          });

          setDeliveryCooldowns(prev => {
              const next = { ...prev };
              Object.keys(next).forEach(k => { next[k] = Math.max(0, next[k] - 1); });
              return next;
          });

          // Golden Slice event spawning (0.5% chance per second)
          setGoldenSliceEvent(prev => {
            if (prev) {
              if (Date.now() > prev.expiresAt) return null;
              return prev;
            }
            if (!state.hasStarted || Math.random() >= 0.005) return prev;
            // Only include marketCrash if market is unlocked
            const types = marketUnlocked ? ['frenzy', 'marketCrash', 'instantCash'] : ['frenzy', 'instantCash'];
            return {
              id: Date.now(),
              type: types[Math.floor(Math.random() * types.length)],
              x: 10 + Math.random() * 70,
              y: 10 + Math.random() * 70,
              expiresAt: Date.now() + 15000,
            };
          });

          // Market manipulation cooldowns (global)
          const marketCooldownReduction = syndicatePerks.marketGod ? 0.25 : 1; // 75% faster = decrement by 0.25 instead of 1
          setMarketCooldowns(prev => ({
            rumors:  Math.max(0, prev.rumors  - marketCooldownReduction),
            squeeze: Math.max(0, prev.squeeze - marketCooldownReduction),
          }));

          // Idle income log — batch every 30s
          idleLogTickRef.current = (idleLogTickRef.current || 0) + 1;
          if (idleLogTickRef.current >= 30 && state.idleProfitPerSec > 0) {
            const idleBatch = state.idleProfitPerSec * 30;
            pushLogRef.current('idle', '⚙️ Idle Production (30s)', idleBatch);
            idleLogTickRef.current = 0;
          }

          // autoArm perk: simulate 1 free click per second
          if (state.syndicatePerks.autoArm && state.hasStarted) {
              const autoMoney = state.idleClickMoney;
              setMoney(m => m + autoMoney);
              setLifetimeMoney(lm => lm + autoMoney);
              setTotalPizzasSold(tp => tp + state.currentClickPower);
              setReputation(r => r + Math.ceil(state.currentClickPower * 0.1));
              setTotalClicks(tc => tc + 1);
          }

      }, 1000);
      return () => clearInterval(eventTick);
  }, []);

  // 3. Fast Mini-Game Loop (For the oven progress bar)
  // quantumOven perk: halves the speed multiplier, making it much easier to hit 'perfect'
  useEffect(() => {
    if (!sideOrder || sideOrder.status !== 'cooking') return;
    const tick = setInterval(() => {
      setSideOrder(prev => {
        if (!prev || prev.status !== 'cooking') return prev;
        const speedMult = engineRefs.current.syndicatePerks.quantumOven ? 1 : 2;
        const nextProg = prev.progress + (prev.speed * speedMult);
        if (nextProg >= 100) return { ...prev, progress: 100, status: 'burnt', rewardEarned: 0 };
        return { ...prev, progress: nextProg };
      });
    }, 100);
    return () => clearInterval(tick);
  }, [sideOrder?.status, sideOrder?.speed]);

  // 4. Modal Cleanup Loop
  useEffect(() => {
    if (sideOrder && sideOrder.status === 'burnt' && sideOrder.rewardEarned === 0) {
        const timer = setTimeout(() => setSideOrder(null), 2000);
        return () => clearTimeout(timer);
    }
    if (sideOrder && sideOrder.status === 'undercooked') {
        const timer = setTimeout(() => setSideOrder(null), 2000);
        return () => clearTimeout(timer);
    }
    if (sideOrder && sideOrder.status === 'perfect') {
        const timer = setTimeout(() => setSideOrder(null), 2500);
        return () => clearTimeout(timer);
    }
    if (sideOrder && sideOrder.status === 'clean') {
        const timer = setTimeout(() => setSideOrder(null), 1500);
        return () => clearTimeout(timer);
    }
    if (sideOrder && sideOrder.type === 'dishes' && sideOrder.status === 'dirty') {
        const timer = setTimeout(() => setSideOrder(null), 8000);
        return () => clearTimeout(timer);
    }
  }, [sideOrder?.status, sideOrder?.rewardEarned]);

  // 5. Achievement Loop
  useEffect(() => {
     const stateSnapshot = { totalPizzasSold, totalClicks, perfectBakes, money, franchiseLicenses, lifetimeMoney, combo, deliveriesCompleted, reputation, inventory };
     let newlyUnlocked = [];
     ACHIEVEMENTS.forEach(ach => {
        if (!unlockedAchievements.includes(ach.id) && ach.req(stateSnapshot)) {
           newlyUnlocked.push(ach.id);
           const popupId = Date.now() + Math.random();
           setAchievementToasts(prev => [...prev, { id: popupId, name: ach.name }]);
           setTimeout(() => setAchievementToasts(prev => prev.filter(t => t.id !== popupId)), 4000);
        }
     });
     if (newlyUnlocked.length > 0) setUnlockedAchievements(prev => [...prev, ...newlyUnlocked]);
  }, [totalPizzasSold, totalClicks, perfectBakes, franchiseLicenses, lifetimeMoney, unlockedAchievements, deliveriesCompleted, inventory]);

  // --- SAVE SYSTEM ---
  const saveStateRef = useRef();
  // Use a ref to always have fresh values without triggering re-renders
  saveStateRef.current = { money, totalPizzasSold, reputation, lifetimeMoney, franchiseLicenses, inventory, totalClicks, perfectBakes, unlockedAchievements, deliveriesCompleted, vipTokens, marketUnlocked, marketShares, marketPrices, marketHistory, portfolioDelta, marketCostBasis, goldenSlices, syndicatePerks, marketCooldowns, manipTarget, deliveryCooldowns, revealedUpgrades: Array.from(revealedUpgrades) };

  useEffect(() => {
    const saveLoop = setInterval(() => {
      if (saveStateRef.current) localStorage.setItem(SAVE_KEY, JSON.stringify({ ...saveStateRef.current, lastSaveTime: Date.now() }));
    }, 2000);
    return () => clearInterval(saveLoop);
  }, []);

  // 6. Special Delivery Timer Loop
  useEffect(() => {
    // Check if player has at least one delivery unlocked
    const hasAnyDelivery = DESTINATIONS.some(dest => {
      const req = dest.unlockReq;
      return totalPizzasSold >= req.pizzas && starLevel >= req.stars && lifetimeMoney >= req.lifetime && franchiseLicenses >= (req.licenses || 0);
    });

    if (!hasAnyDelivery) return;

    const specialDeliveryTick = setInterval(() => {
      setSpecialDelivery(prev => {
        // If there's already a special delivery, don't create a new one
        if (prev) return prev;
        
        // 20% chance every 30 seconds (roughly every 6-8 minutes on average)
        if (Math.random() < 0.2) {
          const expiresAt = Date.now() + 45000; // 45 seconds to accept
          return {
            id: `special-${Date.now()}`,
            expiresAt,
            rewardMultiplier: 2.0, // 2x rewards
            created: Date.now()
          };
        }
        return prev;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(specialDeliveryTick);
  }, [totalPizzasSold, starLevel, lifetimeMoney, franchiseLicenses]);

  // Clean up expired special deliveries
  useEffect(() => {
    const cleanup = setInterval(() => {
      setSpecialDelivery(prev => {
        if (prev && Date.now() > prev.expiresAt) {
          return null; // Remove expired delivery
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  // --- MARKET PRICE ENGINE ---
  useEffect(() => {
    // Baseline "fair value" — prices drift back toward these over time
    const MARKET_BASE = { flour: 15, cheese: 60, pepperoni: 250, truffles: 1500 };
    // Absolute floor — can't crash below 20% of baseline
    const MARKET_FLOOR = { flour: 3, cheese: 12, pepperoni: 50, truffles: 300 };
    const marketTick = setInterval(() => {
      setMarketPrices(prev => {
        const next = { ...prev };
        const nextTrends = {};
        Object.keys(next).forEach(key => {
          const base  = MARKET_BASE[key];
          const floor = MARKET_FLOOR[key];
          const cur   = next[key];

          // Mean reversion pull: nudges price 4% back toward baseline each tick
          const reversion = (base - cur) / base * 0.04;
          // Volatility damping: full ±12% near baseline, shrinks to ±3% far from it
          const deviation = Math.abs(cur - base) / base; // 0 at base, grows with distance
          const dampedVol = 0.12 * Math.max(0.25, 1 - deviation * 0.8);
          const randomChange = (Math.random() * dampedVol * 2) - dampedVol;
          
          let newPrice = cur * (1 + randomChange + reversion);
          if (newPrice < floor) newPrice = floor * (1 + Math.random() * 0.05);

          nextTrends[key] = newPrice > cur ? 1 : -1;
          next[key] = parseFloat(newPrice.toFixed(2));
        });
        setMarketTrends(nextTrends);
        
        // Session P&L: current holding value minus total cost basis
        setPortfolioDelta(() => {
          const sharesSnap = saveStateRef.current?.marketShares || { flour: 0, cheese: 0, pepperoni: 0, truffles: 0 };
          const basisSnap  = saveStateRef.current?.marketCostBasis || { flour: 0, cheese: 0, pepperoni: 0, truffles: 0 };
          const curVal  = Object.keys(sharesSnap).reduce((s, k) => s + sharesSnap[k] * (next[k] || 0), 0);
          const totCost = Object.values(basisSnap).reduce((s, v) => s + v, 0);
          return totCost > 0 ? curVal - totCost : null;
        });
        
        setMarketHistory(prevH => {
          const nextH = {};
          Object.keys(prevH).forEach(key => { nextH[key] = [...prevH[key].slice(-19), next[key]]; });
          return nextH;
        });
        return next;
      });
    }, syndicatePerks.insiderTrading ? 7500 : 15000);
    return () => clearInterval(marketTick);
  }, [syndicatePerks.insiderTrading]);


  // Cookie Clicker-style large number naming
  const BIG_NAMES = [ [1e303, 'Centillion'], [1e100, 'Googol'], [1e63,  'Vigintillion'], [1e60,  'Novemdecillion'], [1e57,  'Octodecillion'], [1e54,  'Septendecillion'], [1e51,  'Sexdecillion'], [1e48,  'Quindecillion'], [1e45,  'Quattuordecillion'], [1e42,  'Tredecillion'], [1e39,  'Duodecillion'], [1e36,  'Undecillion'], [1e33,  'Decillion'], [1e30,  'Nonillion'], [1e27,  'Octillion'], [1e24,  'Septillion'], [1e21,  'Sextillion'], [1e18,  'Quintillion'], [1e15,  'Quadrillion'], [1e12,  'Trillion'], [1e9,   'Billion'], [1e6,   'Million'], [1e3,   'Thousand'] ];
  const BIG_ABBR = [ [1e303, 'Ce'], [1e100, 'Gg'], [1e63,  'Vg'], [1e60,  'Nvd'], [1e57,  'Otd'], [1e54,  'Spd'], [1e51,  'Sxd'], [1e48,  'Qnd'], [1e45,  'Qtd'], [1e42,  'Trd'], [1e39,  'Dud'], [1e36,  'Und'], [1e33,  'Dc'], [1e30,  'No'], [1e27,  'Oc'], [1e24,  'Sp'], [1e21,  'Sx'], [1e18,  'Qi'], [1e15,  'Qu'], [1e12,  'T'], [1e9,   'B'], [1e6,   'M'], [1e3,   'K'] ];

  const fmt = (n) => {
    if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return isFinite(n) ? '∞' : '0';
    const abs = Math.abs(n);
    for (const [thresh, abbr] of BIG_ABBR) {
      if (abs >= thresh) {
        const num = (n / thresh).toFixed(2);
        return <span>{num}<span className="text-sm text-zinc-400 ml-0.5">{abbr}</span></span>;
      }
    }
    return n.toFixed(2);
  };

  const fmtInt = (n) => {
    if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return isFinite(n) ? '∞' : '0';
    const abs = Math.abs(n);
    for (const [thresh, abbr] of BIG_ABBR) {
      if (abs >= thresh) {
        const num = (n / thresh).toFixed(2);
        return <span>{num}<span className="text-sm text-zinc-400 ml-0.5">{abbr}</span></span>;
      }
    }
    return Math.floor(n).toLocaleString();
  };

  const numWords = (n) => {
    const abs = Math.abs(n);
    for (const [thresh, name] of BIG_NAMES) {
      if (abs >= thresh) return `${(n / thresh).toFixed(2)} ${name}`;
    }
    return null;
  };

  const Num = ({ value, prefix = '', suffix = '', decimals = 2 }) => {
    const abs = Math.abs(value);
    if (abs < 1e3) return <span>{prefix}{value.toFixed(decimals)}{suffix}</span>;
    return <span>{prefix}{fmt(value)}{suffix}</span>;
  };

  const formatTime = (seconds) => {
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const appBgClass = franchiseLicenses >= 5
    ? 'bg-stone-950 text-stone-100'
    : franchiseLicenses >= 1
    ? 'bg-zinc-900 text-zinc-100'
    : 'bg-zinc-900 text-zinc-100';

  const hasTruffles = (inventory?.truffles || 0) > 0;
  const hasWoodFire = (inventory?.woodFire || 0) > 0;
  const hasMichelin = (inventory?.michelin || 0) > 0;
  const hasPremiumMeat = (inventory?.premiumMeat || 0) > 0;
  const hasGarlicCrust = (inventory?.garlicCrust || 0) > 0;

  const pizzaColorClass = isRush
    ? 'text-red-400'
    : hasTruffles
    ? 'text-cyan-300'
    : hasPremiumMeat
    ? 'text-rose-500'
    : hasGarlicCrust
    ? 'text-yellow-400'
    : 'text-orange-400';

  return (
    <div className="min-h-[100dvh] bg-[#050505] lg:bg-zinc-950 lg:bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] lg:from-zinc-900 lg:to-black flex flex-col lg:flex-row items-center justify-center lg:gap-12 lg:p-8 font-sans text-white overflow-hidden selection:bg-amber-500/30">

      {/* --- LEFT SIDE: CRT DISPATCH MONITOR (Desktop Only) --- */}
      {isDesktop && (
        <div className="hidden lg:flex flex-col w-[450px] shrink-0 transform -rotate-1">
          <div className="bg-zinc-900 p-4 rounded-t-2xl border-x-4 border-t-4 border-zinc-700 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] flex justify-between items-center">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase font-bold">PizzaOS // Dispatch Terminal v1.0</div>
          </div>
          
          <div className="h-[400px] bg-black border-x-8 border-b-[20px] border-t-8 border-zinc-800 rounded-b-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative p-2 flex flex-col justify-center items-center overflow-hidden box-border">
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20 opacity-50"></div>
            
            {deliveryGame ? (
              <div className="w-full h-full relative z-10 scale-[1.05]">
                 <DeliveryMicrogame onComplete={(success) => {
                    const baseReward = 2000;
                    const finalReward = success ? baseReward * 2 : Math.floor(baseReward * 0.5);
                    setMoney(m => m + finalReward);
                    pushLogRef.current('delivery', `🚗 Delivery ${success ? 'Success' : 'Failed'}: +$${fmt(finalReward)}`, finalReward);
                    setDeliveryGame(null);
                 }} />
              </div>
            ) : (
              <div className="text-green-500/70 font-mono text-center z-10">
                <p className="text-xl mb-2 animate-pulse">&gt; SYSTEM IDLE _</p>
                <p className="text-xs opacity-50">Awaiting Time Warp Deliveries...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- RIGHT SIDE: THE TABLET / MAIN GAME --- */}
      <div 
        className={`flex flex-col relative overflow-x-hidden transition-colors duration-500 bg-zinc-900
          ${isDesktop 
            ? 'w-[400px] h-[850px] max-h-[95vh] rounded-[40px] border-[14px] border-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-4 ring-black/50 shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]' 
            : 'w-full min-h-[100dvh] pb-24'
          }
          ${isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}
          ${appBgClass}
        `}
        style={isDesktop ? { transform: 'translateZ(0)' } : {}}
      >

        {/* ── GOLDEN SLICE EVENT OVERLAY ── */}
        {goldenSliceEvent && (
          <button
            onClick={handleGoldenSliceClick}
            style={{ position: 'absolute', left: `${goldenSliceEvent.x}%`, top: `${goldenSliceEvent.y}%`, zIndex: 9999 }}
            className="group cursor-pointer border-0 bg-transparent p-0 focus:outline-none"
            title={goldenSliceEvent.type === 'frenzy' ? '7x Click Frenzy! (15s)' : goldenSliceEvent.type === 'marketCrash' ? 'Market Crash! (-60%)' : '10 Minutes of Profit!'}
          >
            <div className="relative animate-bounce">
              <div className="w-14 h-14 rounded-full bg-yellow-500 border-4 border-yellow-800 border-b-[6px] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Pizza className="w-7 h-7 text-yellow-900" />
              </div>
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-black uppercase tracking-widest text-yellow-900 bg-yellow-400 px-2 py-0.5 rounded">
                {goldenSliceEvent.type === 'frenzy' ? '7x FRENZY' : goldenSliceEvent.type === 'marketCrash' ? 'MARKET CRASH' : 'INSTANT CASH'}
              </div>
            </div>
          </button>
        )}

        {/* ── FRENZY ACTIVE BANNER ── */}
        {frenzyMultiplier > 1 && (
          <div className="absolute top-[72px] inset-x-0 z-[9998] pointer-events-none flex justify-center">
            <div className="px-8 py-2 bg-yellow-500 border-b-[4px] border-yellow-800 rounded-b-2xl animate-pulse">
              <span className="font-display text-base text-yellow-900 tracking-widest">⚡ 7x CLICK FRENZY ACTIVE ⚡</span>
            </div>
          </div>
        )}
        
        {/* ── MARKET CRASH BANNER ── */}
        {marketCrashBanner && (
          <div className="absolute inset-x-0 top-[68px] z-[9997] pointer-events-none flex flex-col items-center animate-[logSlideIn_0.15s_ease-out]">
            <div className="w-full bg-red-700 border-b-4 border-red-950 flex items-center justify-center py-3 gap-4">
              <TrendingDown className="w-7 h-7 text-red-200 shrink-0" />
              <span className="font-display text-2xl md:text-3xl font-black tracking-[0.2em] text-white uppercase">
                ⚠ MARKET CRASH ⚠
              </span>
              <TrendingDown className="w-7 h-7 text-red-200 shrink-0" />
            </div>
            <div className="bg-red-950 border-b-2 border-red-800 w-full text-center py-1">
              <span className="text-red-300 text-xs font-black uppercase tracking-widest">All commodity prices collapsed −60%</span>
            </div>
          </div>
        )}

        {/* ── INSTANT CASH POPUP ── */}
        {instantCashPopup && (
          <div className="absolute inset-0 z-[9996] pointer-events-none flex items-center justify-center">
            <div className="animate-[floatUpFade_3.5s_ease-out_forwards] flex flex-col items-center gap-1">
              <span className="font-display text-5xl md:text-6xl font-black text-money tabular-nums">
                +<Num value={instantCashPopup} prefix="$" />
              </span>
              <span className="text-sm font-black uppercase tracking-widest text-yellow-900 bg-yellow-400 px-3 py-0.5 rounded">Golden Slice Bonus</span>
            </div>
          </div>
        )}

        {/* ACHIEVEMENT TOASTS */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
           {achievementToasts.map(toast => (
              <div key={toast.id} className="bg-yellow-500 border-b-[4px] border-yellow-800 px-8 py-4 rounded-2xl flex items-center gap-4 animate-[floatUpFade_6s_ease-out_forwards] shadow-2xl">
                 <Trophy className="w-8 h-8 text-yellow-900" />
                 <div>
                    <div className="text-xs text-yellow-800 font-bold uppercase tracking-widest leading-none">Achievement Unlocked!</div>
                    <div className="text-xl font-display text-yellow-900 tracking-wider leading-none mt-1 tabular-nums">{toast.name}</div>
                 </div>
              </div>
           ))}
        </div>

        {/* --- STICKY MOBILE HUD --- */}
        <div className="sticky top-0 inset-x-0 z-40 bg-[#050505] border-b-4 border-zinc-900 px-4 py-3 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <h1 className="text-xl font-display tracking-widest metallic-text leading-none">PIZZA EMPIRE</h1>
              <div className="flex gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < starLevel ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700 fill-zinc-700'}`} />
                ))}
              </div>
            </div>
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-zinc-800 rounded-xl border-b-2 border-zinc-950 text-zinc-400 active:border-b-0 active:translate-y-[2px]">
               <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-800 rounded-lg p-2 flex flex-col items-center border-b-2 border-zinc-950 shadow-inner">
               <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">Bank Balance</span>
               <span className="text-lg font-display text-money leading-none tabular-nums"><Num value={money} prefix="$" decimals={2} /></span>
            </div>
            <div className="bg-zinc-800 rounded-lg p-2 flex flex-col items-center border-b-2 border-zinc-950 shadow-inner">
               <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">Profit / Sec</span>
               <span className="text-lg font-display text-blue-400 leading-none tabular-nums"><Num value={displayProfitPerSec} prefix="$" decimals={1} /></span>
            </div>
          </div>
          {/* Rep Bar */}
          <div className="h-1 bg-zinc-950 w-full mt-1 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${Math.min(100, (reputation / (nextStarReq || 1)) * 100)}%` }} />
          </div>
        </div>

        {/* --- SETTINGS MODAL --- */}
        {showSettings && (
          <div className="absolute inset-0 z-[100] bg-[#050505]/90 flex items-center justify-center p-4">
            <div className="bg-zinc-800 border-2 border-zinc-600 border-b-4 border-b-zinc-950 rounded-2xl p-6 max-w-md w-full relative shadow-2xl">
              <h2 className="text-2xl font-display text-white tracking-widest mb-6 border-b border-zinc-700 pb-4 flex items-center gap-3">
                <Settings className="w-6 h-6 text-blue-400" /> GAME SETTINGS
              </h2>

              {!showWipeConfirm ? (
                <div className="space-y-4">
                  <button onClick={handleManualSave} className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-display tracking-widest rounded-xl flex items-center justify-center gap-3 btn-tactile border-b-[3px] border-zinc-900 active:border-b-0 active:translate-y-[3px]">
                    <Save className="w-5 h-5" /> FORCE SAVE GAME
                  </button>
                  <button onClick={handleExportSave} className="w-full py-3 bg-blue-800 hover:bg-blue-700 border-b-[3px] border-blue-950 text-blue-100 font-display tracking-widest rounded-xl flex items-center justify-center gap-3 btn-tactile active:border-b-0 active:translate-y-[3px]">
                    <Download className="w-5 h-5" /> EXPORT SAVE CODE
                  </button>
                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-700 flex flex-col gap-2">
                    <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Import Save Code</div>
                    <div className="flex gap-2">
                      <input type="text" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste code here..." className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-blue-500 tabular-nums" />
                      <button onClick={handleImportSave} className="bg-zinc-700 hover:bg-zinc-600 px-4 rounded-lg font-display tracking-widest transition-colors"><Upload className="w-4 h-4"/></button>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-zinc-700">
                    <button onClick={() => setShowWipeConfirm(true)} className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-500 hover:text-red-400 font-display tracking-widest rounded-xl transition-colors">
                      WIPE SAVE DATA
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
                  <div>
                    <h3 className="text-xl font-display text-red-400 mb-2">ARE YOU SURE?</h3>
                    <p className="text-sm text-zinc-400">Permanently delete all progress?</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setShowWipeConfirm(false)} className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl font-display tracking-widest btn-tactile border-b-[3px] border-zinc-900 active:border-b-0 active:translate-y-[3px]">CANCEL</button>
                    <button onClick={handleHardReset} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-display tracking-widest btn-tactile border-b-[3px] border-red-900 active:border-b-0 active:translate-y-[3px]">DELETE</button>
                  </div>
                </div>
              )}
              <button onClick={() => {setShowSettings(false); setShowWipeConfirm(false);}} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>
            </div>
          </div>
        )}

        {/* --- MOBILE MICROGAME OVERLAY --- */}
        {!isDesktop && deliveryGame && (
          <div className="absolute inset-0 z-[120] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <DeliveryMicrogame onComplete={(success) => {
              const baseReward = 2000;
              const finalReward = success ? baseReward * 2 : Math.floor(baseReward * 0.5);
              setMoney(m => m + finalReward);
              pushLogRef.current('delivery', `🚗 Delivery ${success ? 'Success' : 'Failed'}: +$${fmt(finalReward)}`, finalReward);
              setDeliveryGame(null);
            }} />
          </div>
        )}

        {/* --- OFFLINE PROGRESS MODAL --- */}
        {offlineReport && (
          <div className="absolute inset-0 z-[100] bg-[#050505]/90 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border-2 border-blue-800 border-b-4 border-b-zinc-950 rounded-2xl max-w-lg w-full relative overflow-hidden">
              <div className="bg-blue-950 px-8 pt-8 pb-6 border-b-4 border-zinc-950">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-900 border border-blue-700 rounded-xl p-3">
                    <Moon className="w-8 h-8 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display text-white tracking-widest">OFFLINE REPORT</h2>
                  </div>
                </div>
              </div>
              <div className="px-6 py-6 space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-900 border border-green-700 rounded-xl">
                  <div>
                    <div className="text-green-400 text-sm font-black uppercase tracking-widest mb-0.5">Money Earned</div>
                  </div>
                  <div className="text-money font-display text-xl tabular-nums">+${fmt(offlineReport.moneyEarned)}</div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <button onClick={() => setOfflineReport(null)} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-display tracking-widest rounded-xl btn-tactile border-b-[4px] border-blue-900 active:border-b-0 active:translate-y-[4px]">
                  LET'S GET COOKING
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- PRESTIGE MODAL --- */}
        {showPrestigeModal && (
          <div className="absolute inset-0 z-[100] bg-[#050505]/90 flex items-center justify-center p-4">
            <div className="bg-zinc-800 border-2 border-purple-700 border-b-4 border-b-zinc-950 rounded-2xl p-8 max-w-md w-full text-center relative">
              <Building className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <h2 className="text-3xl font-display text-white tracking-widest mb-2">CORPORATE BUYOUT</h2>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-700 mb-6 text-left space-y-3">
                 <div className="text-red-400 font-bold text-xs uppercase tracking-wider flex items-start gap-2"><span className="text-lg leading-none">−</span> All money & upgrades reset.</div>
                 <div className="text-green-400 font-bold text-xs uppercase tracking-wider flex items-start gap-2"><span className="text-lg leading-none">+</span> Gain <span className="text-xl font-display leading-none tabular-nums">{pendingLicenses}</span> Licenses.</div>
              </div>
              <div className="flex gap-4">
                  <button onClick={() => setShowPrestigeModal(false)} className="flex-1 py-3 bg-zinc-700 text-zinc-300 font-display tracking-widest rounded-xl btn-tactile border-b-[3px] border-zinc-900 active:border-b-0 active:translate-y-[3px]">CANCEL</button>
                  <button onClick={confirmPrestige} className="flex-1 py-3 bg-purple-600 text-white font-display tracking-widest rounded-xl btn-tactile border-b-[3px] border-purple-900 active:border-b-0 active:translate-y-[3px]">SELL STORE</button>
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN VERTICAL CONTENT ── */}
        <div className="flex flex-col flex-1 p-4 gap-6">
          
          {/* Action Center: Bake & Box */}
          <div className="flex flex-col relative w-full">
            {/* TICKET QUEUE / MINI-GAMES */}
            <div className="min-h-[100px] flex items-center justify-center mb-4">
              {vipSpawned && !sideOrder && (
                <button onClick={triggerVIP} className="w-full h-full bg-yellow-500 rounded-2xl border-b-[4px] border-yellow-800 flex items-center justify-center gap-3 animate-bounce btn-tactile active:border-b-0 active:translate-y-[4px]">
                  <Zap className="w-8 h-8 text-yellow-100 fill-yellow-100" />
                  <div className="text-left">
                    <div className="text-xl font-display text-white uppercase tracking-widest">VIP Alert!</div>
                  </div>
                </button>
              )}
              {isRush && !sideOrder && (
                <div className="w-full h-full bg-red-800 rounded-2xl border-b-[4px] border-red-950 flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3 text-red-200">
                    <Zap className="w-6 h-6 fill-red-200 animate-pulse" />
                    <div className="text-xl font-display uppercase tracking-widest text-white">Dinner Rush!</div>
                  </div>
                  <div className="text-2xl font-display text-red-100 tabular-nums">0:{rushTimeLeft.toString().padStart(2, '0')}</div>
                </div>
              )}
              {sideOrder && sideOrder.status === 'cooking' && (
                <div className="w-full h-full bg-orange-950 rounded-2xl border border-orange-800 border-b-[4px] border-b-orange-950 flex flex-col justify-center p-4 gap-3">
                  <div className="flex justify-between w-full text-sm font-display tracking-widest text-orange-400">
                     <span className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500 animate-pulse"/> {sideOrder.type === 'wings' ? 'WINGS' : 'BREAD'}</span>
                     <span className="animate-pulse">BAKING...</span>
                  </div>
                  <div className="w-full h-6 bg-zinc-950 rounded-lg relative overflow-hidden border-2 border-zinc-800">
                     <div className="absolute top-0 bottom-0 bg-green-700 border-x-2 border-green-500 z-10" style={{ left: '75%', width: '13%' }}></div>
                     <div className="h-full bg-orange-600 relative z-0" style={{ width: `${sideOrder.progress}%` }}></div>
                  </div>
                  <button onClick={handlePullFromOven} className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-display tracking-widest rounded-xl btn-tactile border-b-[3px] border-orange-900 active:border-b-0 active:translate-y-[3px]">PULL FROM OVEN!</button>
                </div>
              )}
              {sideOrder && sideOrder.status !== 'cooking' && (
                <div className={`w-full h-full rounded-2xl border-b-[4px] flex items-center justify-center flex-col gap-1 p-4
                    ${sideOrder.status === 'perfect' ? 'bg-green-800 border-green-950 text-green-100' :
                      sideOrder.status === 'burnt' ? 'bg-red-900 border-red-950 text-red-200' :
                      'bg-yellow-800 border-yellow-950 text-yellow-100'}`}>
                    <div className={`text-2xl font-display tracking-widest uppercase ${sideOrder.status === 'perfect' ? 'animate-bounce' : ''}`}>{sideOrder.status}!</div>
                    <div className="font-bold text-sm tabular-nums">+{fmt(sideOrder.rewardEarned)}</div>
                </div>
              )}
              {!vipSpawned && !isRush && !sideOrder && (
                <div className="w-full h-full border-2 border-dashed border-zinc-700 rounded-2xl flex items-center justify-center text-zinc-500 text-sm font-bold uppercase tracking-widest py-8">
                  Awaiting Orders...
                </div>
              )}
            </div>

            <button 
              onClick={handleBakeAndBox}
              className={`w-full rounded-[2rem] p-6 pb-8 flex flex-col items-center justify-center gap-4 group relative select-none outline-none btn-tactile
                border-b-[8px] active:shadow-none active:translate-y-[12px]
                ${isRush
                  ? 'bg-gradient-to-b from-red-600 to-red-700 border-red-950 border-t-red-500 shadow-[0_12px_0_#000000]'
                  : 'bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-950 border-t-zinc-700 shadow-[0_12px_0_#000000]'
                }`}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              
              {/* COMBO METER */}
              {combo > 0 && (
                <div className="absolute top-5 right-5 flex flex-col items-end pointer-events-none">
                  <div className={`font-display text-3xl transition-all tabular-nums font-black ${combo > 50 ? 'text-red-200' : 'text-yellow-200'}`}>
                    x{comboMultiplier.toFixed(2)}
                  </div>
                  <div className="w-16 h-2 bg-orange-900 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-yellow-300 transition-all duration-100" style={{ width: `${(comboDecayTimer / 20) * 100}%` }} />
                  </div>
                </div>
              )}

              {clickPopups.map(p => (
                <div key={p.id} className="absolute text-2xl font-black pointer-events-none z-50 floating-popup text-yellow-400" style={{ left: p.x, top: p.y }}>
                  +${p.value}
                </div>
              ))}

              {/* 3D SLAMMING PIZZA BOX */}
              <div className="relative w-32 h-32 perspective-box z-10 my-2">
                <div className="absolute inset-x-0 bottom-0 h-[75%] bg-[#92400e] rounded-xl border-b-[8px] border-[#78350f] shadow-xl"></div>
                <div className="absolute inset-x-0 bottom-2 h-[75%] flex items-center justify-center">
                  <Pizza className={`w-20 h-20 transition-transform duration-75 group-active:scale-90 drop-shadow-lg ${pizzaColorClass}`} />
                </div>
                <div className="pizza-box-lid absolute inset-x-0 bottom-0 h-[75%] bg-[#d97706] rounded-xl border-4 border-[#b45309] shadow-inner flex items-center justify-center">
                   <div className="font-display text-[#92400e]/40 text-3xl font-black transform rotate-180 select-none">BOXED</div>
                </div>
              </div>
              
              <div className="pointer-events-none flex flex-col items-center z-10">
                <div className={`text-3xl font-display tracking-widest uppercase mb-2 ${isRush ? 'text-red-100' : 'text-orange-100'}`}>Bake & Box</div>
                <div className={`text-xs font-display px-4 py-2 rounded-full inline-flex items-center gap-2 tracking-wider border-b-2 ${isClean ? 'bg-cyan-800 border-cyan-950 text-cyan-100' : 'bg-orange-700 border-orange-950 text-orange-200'}`}>
                  <span>+<Num value={pizzaPrice * currentClickPower} prefix="$" /></span>
                  <span className="opacity-50">|</span>
                  <span>+<Num value={currentClickPower} /> Pizzas</span>
                </div>
              </div>
            </button>
          </div>

          {/* Sell Franchise Block */}
          {franchiseLicenses > 0 || lifetimeMoney > 50000 ? (
            <button onClick={() => setShowPrestigeModal(true)} disabled={pendingLicenses === 0}
              className="w-full bg-purple-950 rounded-2xl border border-purple-800 border-b-[4px] border-b-purple-950 p-4 flex items-center justify-between group active:border-b-0 active:translate-y-[4px] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="bg-purple-900 p-2 rounded-lg border border-purple-700"><Building className="text-purple-300 w-5 h-5" /></div>
                <div className="text-left">
                  <div className="font-display text-lg tracking-widest text-purple-100 leading-none mb-1">Corporate</div>
                  <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">{franchiseLicenses} Licenses Owned</div>
                </div>
              </div>
              <div className="text-purple-300 font-bold text-xs bg-purple-900 px-3 py-1 rounded-full border border-purple-700">
                {pendingLicenses > 0 ? `Sell for ${pendingLicenses}` : 'Not Ready'}
              </div>
            </button>
          ) : null}

          {/* Tab Navigation */}
          <div className="bg-zinc-800 p-1.5 rounded-xl border border-zinc-700 grid grid-cols-4 sm:grid-cols-6 gap-1 shadow-inner">
            {[
              { id: 'upgrades', icon: <ShoppingCart className="w-3.5 h-3.5" />, label: 'Shop' },
              { id: 'map', icon: <Map className="w-3.5 h-3.5" />, label: 'Map' },
              { id: 'achievements', icon: <Trophy className="w-3.5 h-3.5" />, label: 'Awards' },
              { id: 'stats', icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Stats' },
              { id: 'market', icon: <DollarSign className="w-3.5 h-3.5" />, label: 'Market' },
              { id: 'log', icon: <ScrollText className="w-3.5 h-3.5" />, label: 'Log' },
              ...(goldenSlices > 0 || Object.values(syndicatePerks).some(Boolean) ? [{ id: 'vault', icon: <Gem className="w-3.5 h-3.5" />, label: 'Vault' }] : []),
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg font-display text-[9px] tracking-widest uppercase transition-all ${
                  activeTab === tab.id ? 'bg-zinc-600 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-700/50'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB CONTENT: Upgrades */}
          {activeTab === 'upgrades' && (
            <div className="flex flex-col gap-3">
              {/* Desktop specific: Show Delivery Test Button on Upgrades Tab to ensure it's easily clickable */}
              {isDesktop && (
                 <button onClick={() => setDeliveryGame(true)} className="w-full py-3 bg-amber-600 text-white font-display text-sm tracking-widest rounded-xl border-b-4 border-amber-800 active:border-b-0 active:translate-y-[4px]">
                    TEST: START MINIGAME ON CRT
                 </button>
              )}
              
              <div className="flex bg-zinc-800 border border-zinc-600 rounded-xl p-1 w-full max-w-[200px] mx-auto">
                {[1, 10, 'MAX'].map((mult) => (
                  <button key={mult} onClick={() => setBuyMultiplier(mult)}
                    className={`flex-1 px-2 py-1.5 rounded-lg font-display text-xs font-black tracking-wider transition-all ${buyMultiplier === mult ? 'bg-zinc-700 text-white border border-zinc-500' : 'text-zinc-400'}`}>
                    {mult === 'MAX' ? 'MAX' : `${mult}x`}
                  </button>
                ))}
              </div>

              {UPGRADES.filter(u => revealedUpgrades.has(u.id)).map(u => {
                const isLocked = franchiseLicenses === 0 && starLevel < u.reqStars;
                const count = safeNum(inventory?.[u.id], 0);
                const cost = getCost(u);
                
                let buyAmount = buyMultiplier;
                let displayCost = cost;
                const maxBoost = MILESTONES[MILESTONES.length - 1];
                
                if (buyMultiplier === 'MAX') {
                  const allowedPurchases = Math.max(0, maxBoost - count);
                  let maxBuys = 0; let testCost = 0;
                  while (maxBuys < allowedPurchases && money >= testCost + Math.floor(u.baseCost * Math.pow(u.multi, count + maxBuys))) {
                    testCost += Math.floor(u.baseCost * Math.pow(u.multi, count + maxBuys)); maxBuys++;
                  }
                  buyAmount = maxBuys; displayCost = testCost;
                } else {
                  displayCost = 0;
                  for (let i = 0; i < buyAmount; i++) displayCost += Math.floor(u.baseCost * Math.pow(u.multi, count + i));
                }

                const canAfford = money >= displayCost;

                if (isLocked) {
                  return (
                    <div key={u.id} className="w-full bg-zinc-900/40 border border-zinc-800/80 p-3 rounded-xl flex items-center justify-between opacity-50">
                      <div className="flex items-center gap-3"><div className="text-2xl grayscale opacity-50">{u.icon}</div><div><h3 className="font-display text-sm text-zinc-500">???</h3><p className="text-[10px] text-zinc-500 font-bold">⭐ Req {u.reqStars} Stars</p></div></div>
                      <div className="text-right"><div className="font-display text-sm text-zinc-600">${fmt(cost)}</div></div>
                    </div>
                  );
                }

                return (
                  <button key={u.id} onClick={() => {
                    if (buyMultiplier === 1) buyUpgrade(u);
                    else if (buyMultiplier === 10) buyUpgradeN(u, 10);
                    else if (buyMultiplier === 'MAX') {
                      const allowed = Math.max(0, maxBoost - count);
                      if (allowed > 0) buyUpgradeN(u, allowed);
                    }
                  }} disabled={!canAfford} className={`w-full flex items-center justify-between p-3 rounded-xl text-left border transition-all ${canAfford ? 'bg-zinc-800 border-zinc-700 border-b-[4px] border-b-zinc-950 active:border-b-0 active:translate-y-[4px]' : 'bg-zinc-900 opacity-60 border-zinc-800'}`}>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl bg-zinc-950 p-2 rounded-lg border border-zinc-800">{u.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-sm text-zinc-100">{u.name}</h3>
                          <span className="text-[9px] font-black bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-800">Lvl {count}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-display text-lg ${canAfford ? 'text-green-400' : 'text-zinc-600'}`}>${fmt(displayCost)}</div>
                      <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Buy {buyAmount === 'MAX' ? 'MAX' : buyAmount}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB CONTENT: Map */}
          {activeTab === 'map' && (
             <div className="flex flex-col gap-3">
                {DESTINATIONS.map(dest => {
                   const cd = deliveryCooldowns[dest.id] || 0;
                   return (
                     <button key={dest.id} onClick={() => triggerDelivery(dest)} disabled={cd > 0} 
                        className={`w-full p-4 rounded-xl border flex flex-col text-left transition-all ${cd > 0 ? 'bg-zinc-900 border-zinc-800 opacity-60' : 'bg-zinc-800 border-zinc-700 border-b-[4px] border-b-zinc-950 active:border-b-0 active:translate-y-[4px]'}`}>
                        <div className="flex items-center gap-3 mb-2">
                           <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">{dest.icon}</div>
                           <div>
                              <div className="font-display text-lg text-zinc-100">{dest.name}</div>
                              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{dest.label}</div>
                           </div>
                        </div>
                        {cd > 0 ? (
                           <div className="text-sm font-mono text-red-400 mt-2">Cooldown: {cd}s</div>
                        ) : (
                           <div className="text-sm font-display text-money mt-2">Instant Payout</div>
                        )}
                     </button>
                   )
                })}
             </div>
          )}

          {/* TAB CONTENT: Stats */}
          {activeTab === 'stats' && (
            <div className="flex flex-col gap-2">
              <AccSection sKey="production" statsOpen={statsOpen} setStatsOpen={setStatsOpen} icon={<TrendingUp className="w-4 h-4 inline" />} label="Production"
                accentBorder="border-blue-500/20" accentBg="bg-blue-900/20" accentText="text-blue-400" valueColor="text-blue-300"
                rows={[
                  { label: 'Idle Pizzas / Sec', value: fmt(idlePizzasPerSec), sub: 'base production rate' },
                  { label: 'Idle Profit / Sec', value: `$${Math.floor(idleProfitPerSec).toLocaleString()}`, sub: 'without clicking' },
                  { label: 'Pizza Price', value: `$${Math.floor(pizzaPrice).toLocaleString()}`, sub: 'current ticket value' },
                ]}
              />
              <AccSection sKey="clicking" statsOpen={statsOpen} setStatsOpen={setStatsOpen} icon={<MousePointerClick className="w-4 h-4 inline" />} label="Clicking"
                accentBorder="border-orange-500/20" accentBg="bg-orange-900/20" accentText="text-orange-400" valueColor="text-orange-300"
                rows={[
                  { label: 'Click Power', value: fmt(currentClickPower), sub: 'pizzas per click' },
                  { label: 'Total Clicks', value: Math.floor(totalClicks).toLocaleString(), sub: 'lifetime' },
                  { label: 'Combo', value: `${combo}x`, sub: 'decays on idle' },
                ]}
              />
              <AccSection sKey="lifetime" statsOpen={statsOpen} setStatsOpen={setStatsOpen} icon={<DollarSign className="w-4 h-4 inline" />} label="Lifetime Totals"
                accentBorder="border-green-500/20" accentBg="bg-green-900/20" accentText="text-green-400" valueColor="text-green-300"
                rows={[
                  { label: 'Money Earned', value: `$${Math.floor(lifetimeMoney).toLocaleString()}`, sub: 'lifetime' },
                  { label: 'Pizzas Sold', value: Math.floor(totalPizzasSold).toLocaleString(), sub: 'all time' },
                  { label: 'Deliveries', value: Math.floor(deliveriesCompleted).toLocaleString(), sub: 'time warp runs' },
                ]}
              />
            </div>
          )}

          {/* TAB CONTENT: Market */}
          {activeTab === 'market' && (
            <div className="flex flex-col gap-4">
              {!marketUnlocked ? (
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-center">
                  <h2 className="font-display text-xl text-zinc-100 mb-2">Pizza Empire Stock Exchange</h2>
                  <p className="text-zinc-400 text-xs mb-4">Unlock the commodities market for $25,000.</p>
                  <button onClick={() => { if (money >= 25000) { setMoney(m => m - 25000); setMarketUnlocked(true); } }} disabled={money < 25000} className={`px-6 py-2 rounded-xl font-display btn-tactile ${money >= 25000 ? 'bg-zinc-700 text-white border-b-2 border-zinc-900 active:border-b-0 active:translate-y-[2px]' : 'bg-zinc-800 text-zinc-600'}`}>
                    Unlock Market
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-inner">
                  <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800 flex justify-between">
                    <span className="text-xs font-mono text-zinc-400">PTSE Terminal</span>
                    <span className="text-xs font-mono text-green-500">Live</span>
                  </div>
                  <div className="p-4 grid grid-cols-1 gap-3">
                    {['flour', 'cheese', 'pepperoni', 'truffles'].map(key => {
                      const price = marketPrices[key];
                      const shares = marketShares[key];
                      return (
                        <div key={key} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <div className="font-display text-zinc-300 uppercase">{key}</div>
                            <div className="text-xs font-mono text-zinc-500">{shares} shares</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-money font-bold">${fmt(price)}</div>
                            <div className="flex gap-2 mt-1">
                               <button onClick={() => { if(money >= price) { setMoney(m=>m-price); setMarketShares(s=>({...s, [key]:s[key]+1})); } }} className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-300">Buy</button>
                               <button onClick={() => { if(shares > 0) { setMoney(m=>m+(price*shares)); setMarketShares(s=>({...s, [key]:0})); } }} className="text-[10px] bg-red-900/30 text-red-400 px-2 py-1 rounded">Sell All</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: Log */}
          {activeTab === 'log' && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 h-[400px] overflow-y-auto">
               <div className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4 flex justify-between">
                  <span>Transaction Log</span>
                  <button onClick={() => setMoneyLog([])} className="text-red-400">Clear</button>
               </div>
               <div className="flex flex-col gap-2">
                 {moneyLog.map(entry => (
                   <div key={entry.id} className="flex justify-between items-center text-xs font-mono border-b border-zinc-800 pb-2">
                     <span className="text-zinc-400 truncate pr-2">{entry.label}</span>
                     <span className={entry.amount >= 0 ? 'text-money' : 'text-red-400'}>{entry.amount >= 0 ? '+' : ''}${fmt(Math.abs(entry.amount))}</span>
                   </div>
                 ))}
                 {moneyLog.length === 0 && <div className="text-center text-zinc-600 mt-10">No recent transactions</div>}
               </div>
            </div>
          )}

          {/* TAB CONTENT: Achievements */}
          {activeTab === 'achievements' && (
            <div className="flex flex-col gap-3">
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4 text-center">
                 <div className="font-display text-xl text-yellow-500 mb-1">Trophy Case</div>
                 <div className="text-xs text-yellow-600 font-bold uppercase tracking-widest">{unlockedAchievements.length} / {ACHIEVEMENTS.length} Unlocked</div>
              </div>
              <div className="h-[400px] overflow-y-auto pr-2 space-y-2">
                {ACHIEVEMENTS.map(ach => {
                  const unlocked = unlockedAchievements.includes(ach.id);
                  return (
                    <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 ${unlocked ? 'bg-zinc-800 border-yellow-700/50' : 'bg-zinc-900 border-zinc-800 opacity-50'}`}>
                      <Trophy className={`w-5 h-5 shrink-0 ${unlocked ? 'text-yellow-500' : 'text-zinc-600'}`} />
                      <div>
                        <div className={`font-display text-sm ${unlocked ? 'text-zinc-200' : 'text-zinc-500'}`}>{ach.name}</div>
                        <div className="text-[10px] text-zinc-400">{ach.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* --- CSS BLOCK --- */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&display=swap');
        *, *::-webkit-scrollbar { scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        .font-display { font-family: 'Oswald', sans-serif; text-transform: uppercase; font-variant-numeric: tabular-nums; }
        .font-body { font-family: 'Inter', sans-serif; font-variant-numeric: tabular-nums; }
        .metallic-text { background: linear-gradient(to bottom, #f8fafc 0%, #cbd5e1 40%, #64748b 50%, #e2e8f0 55%, #94a3b8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0px 2px 1px rgba(0,0,0,0.9)); }
        .text-money { color: #84cc16; }
        .btn-tactile { transition: border-bottom-width 80ms ease, transform 80ms ease, background-color 120ms ease; }
        @keyframes floatUpFade { 0% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 100% { opacity: 0; transform: translate(-50%, -100px) scale(1.3); } }
        .floating-popup { animation: floatUpFade 0.8s ease-out forwards; will-change: transform, opacity; font-family: 'Oswald', sans-serif; text-shadow: 0px 3px 0px rgba(0,0,0,0.9), 1px 1px 1px rgba(0,0,0,0.9), -1px -1px 1px rgba(0,0,0,0.9); }
        .perspective-box { perspective: 1000px; }
        .pizza-box-lid { transform-origin: top; transform: rotateX(-105deg); transition: transform 0.06s cubic-bezier(0.4, 0, 0.2, 1); backface-visibility: hidden; }
        .group:active .pizza-box-lid { transform: rotateX(0deg); transition: transform 0.03s ease-out; }
      `}} />

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DELIVERY MICROGAME COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
function DeliveryMicrogame({ onComplete }) {
  const [playerLane, setPlayerLane] = useState(1);
  const [obstacles, setObstacles] = useState([{ id: 1, lane: 0, y: -20 }, { id: 2, lane: 2, y: -60 }, { id: 3, lane: 1, y: -100 }]);
  const [timeLeft, setTimeLeft] = useState(5000); 
  const playerLaneRef = useRef(1);

  const moveLeft = () => { setPlayerLane(p => { const n = Math.max(0, p - 1); playerLaneRef.current = n; return n; }); };
  const moveRight = () => { setPlayerLane(p => { const n = Math.min(2, p + 1); playerLaneRef.current = n; return n; }); };

  useEffect(() => {
    const tick = 50; const speed = 2;
    const loop = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0) { clearInterval(loop); onComplete(true); return 0; }
        return t - tick;
      });
      setObstacles(prev => {
        let next = prev.map(o => ({ ...o, y: o.y + speed }));
        const hit = next.some(o => o.lane === playerLaneRef.current && o.y > 75 && o.y < 95);
        if (hit) { clearInterval(loop); onComplete(false); }
        return next;
      });
    }, tick);
    return () => clearInterval(loop);
  }, [onComplete]);

  return (
    <div className="w-full max-w-sm bg-black rounded-2xl border-4 border-yellow-500 overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(212,175,55,0.3)]">
      <div className="bg-zinc-950 p-4 flex justify-between items-center border-b-4 border-yellow-500">
        <div className="text-yellow-400 font-black uppercase tracking-widest flex items-center gap-2 text-lg"><MapPin size={20} /> Delivery</div>
        <div className="text-yellow-100 font-mono font-bold text-xl tabular-nums">{Math.ceil(timeLeft/1000)}s</div>
      </div>
      <div className="h-64 relative bg-zinc-950 overflow-hidden flex border-b-4 border-yellow-500">
        <div className="absolute inset-0 flex justify-evenly pointer-events-none opacity-20">
          <div className="w-1 h-full bg-dashed-line animate-slide-down"></div>
          <div className="w-1 h-full bg-dashed-line animate-slide-down"></div>
        </div>
        {obstacles.map(obs => (
          <div key={obs.id} className="absolute w-1/3 flex justify-center" style={{ left: `${obs.lane * 33.33}%`, top: `${obs.y}%` }}>
            <div className="bg-zinc-800 border-2 border-yellow-600 rounded w-12 h-10 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 flex"><div className="w-1/2 bg-yellow-500 transform -skew-x-12"></div></div>
            </div>
          </div>
        ))}
        <div className="absolute w-1/3 flex justify-center bottom-4 transition-all duration-75" style={{ left: `${playerLane * 33.33}%` }}>
          <div className="w-10 h-14 bg-blue-500 rounded-xl border-2 border-blue-900 shadow-lg flex flex-col items-center justify-center relative">
            <div className="w-5 h-3 bg-blue-900 rounded-sm mb-1"></div>
            <Package size={14} className="text-orange-300" />
          </div>
        </div>
      </div>
      <div className="p-4 flex gap-4 bg-black">
        <button className="flex-1 h-16 bg-zinc-900 border-b-4 border-zinc-950 active:border-b-0 active:translate-y-1 rounded-xl font-black text-2xl text-gray-400 touch-manipulation transition-all" onClick={moveLeft} onTouchStart={(e) => { e.preventDefault(); moveLeft(); }}>◀</button>
        <button className="flex-1 h-16 bg-zinc-900 border-b-4 border-zinc-950 active:border-b-0 active:translate-y-1 rounded-xl font-black text-2xl text-gray-400 touch-manipulation transition-all" onClick={moveRight} onTouchStart={(e) => { e.preventDefault(); moveRight(); }}>▶</button>
      </div>
      <style dangerouslySetInnerHTML={{__html: `.bg-dashed-line { background-image: linear-gradient(to bottom, #444 50%, transparent 50%); background-size: 100% 40px; } @keyframes slide-down { 0% { background-position: 0 0; } 100% { background-position: 0 40px; } } .animate-slide-down { animation: slide-down 0.2s linear infinite; }`}} />
    </div>
  );
}