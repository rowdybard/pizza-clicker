import React, { useState, useEffect, useRef } from 'react';
import { 
  Pizza, Car, Store, TrendingUp, ShoppingCart, 
  DollarSign, ChefHat, Users, Award, Star, Zap, Clock, Building,
  Plane, Rocket, Gem, Crown, Coffee, MousePointerClick, Flame
} from 'lucide-react';

const SAVE_KEY = 'pizzaTycoonSave_v1';

// --- UPGRADE DEFINITIONS ---
const UPGRADES = [
  { id: 'pizzaCutter', name: 'Pro Cutter', type: 'click', baseCost: 150, multi: 1.5, baseValue: 1, reqStars: 0, icon: <MousePointerClick className="text-orange-400" /> },
  { id: 'doughRoller', name: 'Auto-Roller', type: 'production', baseCost: 75, multi: 1.15, baseValue: 0.2, reqStars: 0, icon: <ChefHat className="text-blue-400" /> },
  { id: 'lineCook', name: 'Line Cook', type: 'production', baseCost: 450, multi: 1.15, baseValue: 1, reqStars: 1, icon: <Users className="text-blue-500" /> },
  { id: 'driver', name: 'Delivery Driver', type: 'production', baseCost: 2800, multi: 1.15, baseValue: 5, reqStars: 2, icon: <Car className="text-green-500" /> },
  { id: 'franchise', name: 'Ghost Kitchen', type: 'production', baseCost: 25000, multi: 1.15, baseValue: 25, reqStars: 3, icon: <Store className="text-purple-500" /> },
  { id: 'drone', name: 'Delivery Drones', type: 'production', baseCost: 180000, multi: 1.15, baseValue: 120, reqStars: 4, icon: <Plane className="text-indigo-400" /> },
  { id: 'orbital', name: 'Orbital Pizzeria', type: 'production', baseCost: 1500000, multi: 1.15, baseValue: 600, reqStars: 5, icon: <Rocket className="text-pink-500" /> },
  { id: 'soda', name: 'Soda Combos', type: 'quality', baseCost: 350, multi: 1.6, baseValue: 1, reqStars: 0, icon: <Coffee className="text-amber-500" /> },
  { id: 'garlicCrust', name: 'Garlic Crust', type: 'quality', baseCost: 800, multi: 1.6, baseValue: 1.5, reqStars: 1, icon: <Award className="text-yellow-400" /> },
  { id: 'premiumMeat', name: 'Premium Meats', type: 'quality', baseCost: 5000, multi: 1.6, baseValue: 3.5, reqStars: 2, icon: <Pizza className="text-orange-500" /> },
  { id: 'woodFire', name: 'Wood-Fired Oven', type: 'quality', baseCost: 45000, multi: 1.6, baseValue: 12, reqStars: 3, icon: <Zap className="text-red-400" /> },
  { id: 'truffles', name: 'Artisan Truffles', type: 'quality', baseCost: 250000, multi: 1.6, baseValue: 45, reqStars: 4, icon: <Gem className="text-cyan-400" /> },
  { id: 'michelin', name: 'Michelin Star', type: 'quality', baseCost: 2000000, multi: 1.6, baseValue: 200, reqStars: 5, icon: <Crown className="text-yellow-500" /> },
];

const MILESTONES = [10, 25, 50, 100, 250];
const STAR_THRESHOLDS = [0, 500, 2500, 10000, 50000, 250000];
const FRANCHISE_BASE_COST = 25000; 

const loadSaveData = () => {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Save load failed", e);
  }
  return null;
};

export default function App() {
  // Load initial state once
  const [initialData] = useState(loadSaveData());

  // --- CORE STATE (Initialized from Save) ---
  const [money, setMoney] = useState(initialData?.money ?? 0);
  const [totalPizzasSold, setTotalPizzasSold] = useState(initialData?.totalPizzasSold ?? 0);
  const [reputation, setReputation] = useState(initialData?.reputation ?? 0);
  const [lifetimeMoney, setLifetimeMoney] = useState(initialData?.lifetimeMoney ?? 0);
  const [franchiseLicenses, setFranchiseLicenses] = useState(initialData?.franchiseLicenses ?? 0);
  const [inventory, setInventory] = useState(initialData?.inventory ?? {
    pizzaCutter: 0, doughRoller: 0, lineCook: 0, driver: 0, franchise: 0, drone: 0, orbital: 0,
    soda: 0, garlicCrust: 0, premiumMeat: 0, woodFire: 0, truffles: 0, michelin: 0
  });

  // --- VISUAL, EVENT & MODAL STATE ---
  const [clickPopups, setClickPopups] = useState([]);
  const [rushTimeLeft, setRushTimeLeft] = useState(0);
  const [vipSpawned, setVipSpawned] = useState(false);
  const [sideOrder, setSideOrder] = useState(null); 
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  const [offlineReport, setOfflineReport] = useState(null);
  const [resetClicks, setResetClicks] = useState(0); // For Dev Reset Button

  // --- CORE LOGIC & DERIVED STATS ---
  const starLevel = STAR_THRESHOLDS.filter(t => reputation >= t).length - 1;
  const nextStarReq = STAR_THRESHOLDS[starLevel + 1] || STAR_THRESHOLDS[STAR_THRESHOLDS.length - 1];

  const getMilestoneMultiplier = (count) => {
    let multiplier = 1;
    MILESTONES.forEach(m => { if (count >= m) multiplier *= 2; });
    return multiplier;
  };
  const getNextMilestone = (count) => MILESTONES.find(m => count < m) || 'MAX';

  const totalEarnableLicenses = Math.floor(Math.sqrt(lifetimeMoney / FRANCHISE_BASE_COST));
  const pendingLicenses = Math.max(0, totalEarnableLicenses - franchiseLicenses);
  const franchiseMultiplier = 1 + (franchiseLicenses * 0.50); 

  let baseProductionRate = 0;
  let basePizzaPrice = 2.50; 
  let baseClickPower = 1; 

  UPGRADES.forEach(u => {
    const count = inventory[u.id];
    const multi = getMilestoneMultiplier(count);
    
    if (u.type === 'production') baseProductionRate += (u.baseValue * count * multi);
    if (u.type === 'quality') basePizzaPrice += (u.baseValue * count * multi);
    if (u.type === 'click') baseClickPower += (u.baseValue * count * multi);
  });

  const franchisedProduction = baseProductionRate;
  const franchisedPrice = basePizzaPrice * franchiseMultiplier;
  const franchisedClick = baseClickPower;

  const isRush = rushTimeLeft > 0;
  const productionRate = isRush ? franchisedProduction * 2 : franchisedProduction;
  const pizzaPrice = isRush ? franchisedPrice * 2 : franchisedPrice;
  const currentClickPower = franchisedClick; 
  const profitPerSecond = productionRate * pizzaPrice;

  const getCost = (upgrade) => Math.floor(upgrade.baseCost * Math.pow(upgrade.multi, inventory[upgrade.id]));

  // --- ACTIONS ---
  const handleBakeAndBox = (e) => {
    const moneyEarned = pizzaPrice * currentClickPower;

    setMoney(prev => prev + moneyEarned);
    setLifetimeMoney(prev => prev + moneyEarned);
    setTotalPizzasSold(prev => prev + currentClickPower);
    setReputation(prev => prev + Math.ceil(currentClickPower)); 

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) + (Math.random() * 20 - 10);
    const y = (e.clientY - rect.top) + (Math.random() * 20 - 10);
    
    const popupId = Date.now() + Math.random();
    setClickPopups(prev => [...prev, { id: popupId, x, y, value: moneyEarned.toFixed(2) }]);

    setTimeout(() => {
      setClickPopups(prev => prev.filter(p => p.id !== popupId));
    }, 1000);
  };

  const triggerVIP = () => {
    setVipSpawned(false);
    setRushTimeLeft(30); 
  };

  const buyUpgrade = (upgrade) => {
    const cost = getCost(upgrade);
    if (money >= cost) {
      setMoney(prev => prev - cost);
      setInventory(prev => ({ ...prev, [upgrade.id]: prev[upgrade.id] + 1 }));
    }
  };

  const confirmPrestige = () => {
    setFranchiseLicenses(prev => prev + pendingLicenses);
    setMoney(0);
    setReputation(0);
    setTotalPizzasSold(0);
    setRushTimeLeft(0);
    setVipSpawned(false);
    setSideOrder(null);
    setInventory({
      pizzaCutter: 0, doughRoller: 0, lineCook: 0, driver: 0, franchise: 0, drone: 0, orbital: 0,
      soda: 0, garlicCrust: 0, premiumMeat: 0, woodFire: 0, truffles: 0, michelin: 0
    });
    setShowPrestigeModal(false);
  };

  const handlePullFromOven = () => {
    if (!sideOrder || sideOrder.status !== 'cooking') return;

    const p = sideOrder.progress;
    let status = 'undercooked';
    let multi = 1;
    let repBonus = 0;

    if (p >= 75 && p <= 88) {
        status = 'perfect';
        multi = 5; 
        repBonus = 25; 
    } else if (p > 88) {
        status = 'burnt';
        multi = 0;
    }

    const baseReward = sideOrder.type === 'wings' ? pizzaPrice * 20 : pizzaPrice * 10;
    const finalReward = baseReward * multi;

    setSideOrder(prev => ({ ...prev, status, rewardEarned: finalReward }));
    
    if (finalReward > 0) {
        setMoney(m => m + finalReward);
        setLifetimeMoney(m => m + finalReward);
        if (repBonus > 0) setReputation(r => r + repBonus);
    }
    setTimeout(() => setSideOrder(null), 2000);
  };

  const handleDevReset = () => {
    if (resetClicks === 1) {
      localStorage.removeItem(SAVE_KEY);
      setMoney(0);
      setReputation(0);
      setTotalPizzasSold(0);
      setLifetimeMoney(0);
      setFranchiseLicenses(0);
      setInventory({
        pizzaCutter: 0, doughRoller: 0, lineCook: 0, driver: 0, franchise: 0, drone: 0, orbital: 0,
        soda: 0, garlicCrust: 0, premiumMeat: 0, woodFire: 0, truffles: 0, michelin: 0
      });
      setResetClicks(0);
    } else {
      setResetClicks(1);
      setTimeout(() => setResetClicks(0), 3000);
    }
  };

  // --- GAME LOOPS ---

  const hasStarted = totalPizzasSold > 0;

  // 1. Idle production & spawning
  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (productionRate > 0) {
        const generatedMoney = productionRate * pizzaPrice;
        setMoney(prev => prev + generatedMoney);
        setLifetimeMoney(prev => prev + generatedMoney);
        setTotalPizzasSold(prev => prev + productionRate);
        setReputation(prev => prev + Math.ceil(Math.sqrt(productionRate))); 
      }

      setRushTimeLeft(prev => Math.max(0, prev - 1));

      setVipSpawned(prevVip => {
        if (!prevVip && rushTimeLeft === 0 && hasStarted && Math.random() < 0.005) return true;
        return prevVip;
      });

      setSideOrder(prevOrder => {
        if (!prevOrder && !vipSpawned && rushTimeLeft === 0 && hasStarted && Math.random() < 0.025) {
            const isWings = Math.random() > 0.5;
            return {
                type: isWings ? 'wings' : 'bread',
                progress: 0,
                status: 'cooking',
                speed: isWings ? 3 : 1.8,
            };
        }
        return prevOrder;
      });

    }, 1000);

    return () => clearInterval(gameLoop);
  }, [productionRate, pizzaPrice, rushTimeLeft, vipSpawned, hasStarted]);

  // 2. High-Speed Loop (Mini-Game progress bar)
  useEffect(() => {
    if (!sideOrder || sideOrder.status !== 'cooking') return;

    const tick = setInterval(() => {
      setSideOrder(prev => {
        if (!prev || prev.status !== 'cooking') return prev;
        const nextProg = prev.progress + prev.speed;
        
        if (nextProg >= 100) {
            return { ...prev, progress: 100, status: 'burnt', rewardEarned: 0 };
        }
        return { ...prev, progress: nextProg };
      });
    }, 50);

    return () => clearInterval(tick);
  }, [sideOrder?.status, sideOrder?.speed]);

  // Clean up auto-failed burnt items
  useEffect(() => {
    if (sideOrder && sideOrder.status === 'burnt' && sideOrder.rewardEarned === 0) {
        const timer = setTimeout(() => setSideOrder(null), 2000);
        return () => clearTimeout(timer);
    }
  }, [sideOrder?.status, sideOrder?.rewardEarned]);


  // --- SAVE & LOAD SYSTEM ---

  // Ref to hold the latest state for the save loop without stale closures
  const saveStateRef = useRef();
  useEffect(() => {
    saveStateRef.current = { money, totalPizzasSold, reputation, lifetimeMoney, franchiseLicenses, inventory };
  }, [money, totalPizzasSold, reputation, lifetimeMoney, franchiseLicenses, inventory]);

  // The Auto-Save Interval (Every 2 seconds)
  useEffect(() => {
    const saveLoop = setInterval(() => {
      if (saveStateRef.current) {
        const dataToSave = {
          ...saveStateRef.current,
          lastSaveTime: Date.now()
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
      }
    }, 2000);
    return () => clearInterval(saveLoop);
  }, []);

  // Offline Progress Calculation on Mount
  useEffect(() => {
    if (initialData && initialData.lastSaveTime) {
      const now = Date.now();
      const secondsAway = Math.floor((now - initialData.lastSaveTime) / 1000);
      
      // If away for more than 1 minute and actually producing something
      if (secondsAway > 60 && franchisedProduction > 0) {
        const generatedMoney = franchisedProduction * franchisedPrice * secondsAway;
        const generatedPizzas = franchisedProduction * secondsAway;
        const generatedRep = Math.ceil(Math.sqrt(franchisedProduction)) * secondsAway;

        setMoney(prev => prev + generatedMoney);
        setLifetimeMoney(prev => prev + generatedMoney);
        setTotalPizzasSold(prev => prev + generatedPizzas);
        setReputation(prev => prev + generatedRep);

        setOfflineReport({
            time: secondsAway,
            money: generatedMoney,
            pizzas: generatedPizzas,
            rep: generatedRep
        });
      }
    }
    // eslint-disable-next-line
  }, []); 

  // Time formatter for Offline Report
  const formatTime = (seconds) => {
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-body selection:bg-blue-500 selection:text-white flex flex-col relative">
      
      {/* DEV RESET BUTTON - Remove when done testing */}
      <div className="absolute top-2 right-2 z-50">
          <button 
              onClick={handleDevReset}
              className={`text-[10px] px-3 py-1.5 rounded font-display tracking-widest transition-all shadow-md ${resetClicks === 1 ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-red-400 hover:border-red-900'}`}
          >
              {resetClicks === 1 ? 'CLICK AGAIN TO WIPE SAVE' : 'DEV RESET'}
          </button>
      </div>

      {/* --- MODALS --- */}
      {/* 1. Offline Progress Modal */}
      {offlineReport && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border-2 border-blue-500 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(59,130,246,0.2)] text-center relative">
            <h2 className="text-4xl font-display text-white tracking-widest mb-2 text-glow-blue">WELCOME BACK!</h2>
            <p className="text-slate-400 font-bold mb-6">Your crew kept the ovens hot while you were gone.</p>
            
            <div className="space-y-4 mb-8">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400 font-bold tracking-widest uppercase text-xs">Time Away</span>
                  <span className="text-white font-display text-xl">{formatTime(offlineReport.time)}</span>
              </div>
              <div className="bg-green-900/20 p-4 rounded-xl border border-green-500/30 flex justify-between items-center">
                  <span className="text-green-500 font-bold tracking-widest uppercase text-xs">Money Earned</span>
                  <span className="text-green-400 font-display text-2xl text-glow-green">+${offlineReport.money.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="bg-orange-900/20 p-4 rounded-xl border border-orange-500/30 flex justify-between items-center">
                  <span className="text-orange-500 font-bold tracking-widest uppercase text-xs">Pizzas Boxed</span>
                  <span className="text-orange-400 font-display text-2xl text-glow-orange">+{Math.floor(offlineReport.pizzas).toLocaleString()}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setOfflineReport(null)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-display text-xl tracking-widest rounded-xl shadow-lg active:scale-95 transition-all"
            >
              LET'S GET COOKING
            </button>
          </div>
        </div>
      )}

      {/* 2. Prestige / Buyout Modal */}
      {showPrestigeModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border-2 border-purple-500 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(168,85,247,0.2)] text-center relative">
            <Building className="w-16 h-16 text-purple-400 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]" />
            <h2 className="text-4xl font-display text-white tracking-widest mb-2 text-glow-purple">CORPORATE BUYOUT</h2>
            <p className="text-slate-400 font-bold mb-6">Are you sure you want to sell your store to Corporate?</p>
            
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6 text-left space-y-3">
               <div className="text-red-400 font-bold text-xs uppercase tracking-wider flex items-start gap-2"><span className="text-lg leading-none">-</span> You will reset all money, upgrades, and reputation.</div>
               <div className="text-green-400 font-bold text-xs uppercase tracking-wider flex items-start gap-2"><span className="text-lg leading-none">+</span> You will gain <span className="text-xl font-display text-glow-green leading-none">{pendingLicenses}</span> Franchise Licenses.</div>
               <div className="text-purple-400 font-bold text-xs uppercase tracking-wider flex items-start gap-2"><span className="text-lg leading-none">+</span> Each license permanently boosts speed and prices by 20%!</div>
            </div>
            
            <div className="flex gap-4">
                <button 
                  onClick={() => setShowPrestigeModal(false)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-display text-xl tracking-widest rounded-xl transition-all"
                >
                  CANCEL
                </button>
                <button 
                  onClick={confirmPrestige}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-display text-xl tracking-widest rounded-xl shadow-lg active:scale-95 transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                >
                  SELL STORE
                </button>
            </div>
          </div>
        </div>
      )}


      {/* Top Dashboard Banner */}
      <div className="max-w-6xl w-full mx-auto bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700 mb-8 flex flex-col sm:flex-row gap-6 items-center justify-between relative overflow-hidden mt-6">
        {isRush && <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none"></div>}
        
        <div className="flex-1 w-full relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-4xl font-display tracking-widest metallic-text">
              PIZZA TYCOON
            </h1>
            <div className="flex bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < starLevel ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-slate-600'}`} />
              ))}
            </div>
            {franchiseLicenses > 0 && (
               <div className="flex items-center gap-1 bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full border border-purple-500/50 ml-2 font-bold text-xs uppercase tracking-widest shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                 <Building className="w-3 h-3" /> {franchiseLicenses} Licenses
               </div>
            )}
          </div>
          
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-bold">
              <span>Reputation</span>
              <span>{Math.floor(reputation).toLocaleString()} / {nextStarReq.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700 shadow-inner">
              <div 
                className="h-full bg-yellow-400 transition-all duration-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                style={{ width: `${Math.min(100, (reputation / nextStarReq) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 z-10">
          <div className="bg-slate-900 px-6 py-3 rounded-xl border border-slate-700 flex flex-col items-center min-w-[130px] shadow-inner">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-green-400"/> Bank
            </span>
            <span className="text-2xl font-display tracking-wider text-green-400 text-glow-green">
              ${money.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </div>

          <div className={`px-6 py-3 rounded-xl border flex flex-col items-center min-w-[130px] transition-colors shadow-inner ${isRush ? 'bg-red-900/50 border-red-500' : 'bg-slate-900 border-slate-700'}`}>
            <span className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${isRush ? 'text-red-300' : 'text-slate-400'}`}>
              <TrendingUp className="w-3 h-3"/> Profit / Sec
            </span>
            <span className={`text-2xl font-display tracking-wider ${isRush ? 'text-red-400 text-glow-red' : 'text-blue-400 text-glow-blue'}`}>
              ${profitPerSecond.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </div>

          <div className={`px-6 py-3 rounded-xl border flex flex-col items-center min-w-[130px] hidden sm:flex transition-colors shadow-inner ${isRush ? 'bg-red-900/50 border-red-500' : 'bg-slate-900 border-slate-700'}`}>
            <span className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${isRush ? 'text-red-300' : 'text-slate-400'}`}>
              <Award className="w-3 h-3"/> Ticket Avg
            </span>
            <span className={`text-2xl font-display tracking-wider ${isRush ? 'text-red-400 text-glow-red' : 'text-yellow-400 text-glow-yellow'}`}>
              ${pizzaPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left Area: Action Center */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* TICKET QUEUE / MINI-GAMES */}
          <div className="min-h-[120px] flex items-center justify-center">
            
            {vipSpawned && !sideOrder && (
              <button 
                onClick={triggerVIP}
                className="w-full h-full bg-gradient-to-r from-yellow-500 to-red-500 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.3)] border-2 border-yellow-300 flex items-center justify-center gap-3 animate-bounce hover:scale-105 transition-transform"
              >
                <Zap className="w-8 h-8 text-yellow-100 fill-yellow-100" />
                <div className="text-left">
                  <div className="text-2xl font-display text-white uppercase tracking-widest">VIP Customer Alert!</div>
                  <div className="text-sm text-yellow-100 font-bold">Click to trigger Dinner Rush!</div>
                </div>
              </button>
            )}

            {isRush && !sideOrder && (
              <div className="w-full h-full bg-red-500/20 rounded-2xl border-2 border-red-500 flex items-center justify-between px-8 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <div className="flex items-center gap-3 text-red-400">
                  <Zap className="w-8 h-8 fill-red-400 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                  <div>
                    <div className="text-2xl font-display uppercase tracking-widest text-glow-red">Dinner Rush!</div>
                    <div className="text-sm font-bold">2x Speed & 2x Prices</div>
                  </div>
                </div>
                <div className="text-4xl font-display text-red-400 flex items-center gap-2 text-glow-red">
                  <Clock className="w-8 h-8" /> 0:{rushTimeLeft.toString().padStart(2, '0')}
                </div>
              </div>
            )}

            {sideOrder && sideOrder.status === 'cooking' && (
              <div className="w-full h-full bg-slate-800 rounded-2xl border-2 border-orange-500/50 flex flex-col items-center justify-center p-5 gap-3 shadow-[0_0_20px_rgba(249,115,22,0.15)] relative">
                <div className="flex justify-between w-full text-sm font-display tracking-widest text-orange-400">
                   <span className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500 animate-pulse"/> TICKET: {sideOrder.type === 'wings' ? 'SPICY WINGS' : 'GARLIC BREAD'}</span>
                   <span className="animate-pulse">BAKING...</span>
                </div>
                
                <div className="w-full h-8 bg-slate-950 rounded-lg relative overflow-hidden border-2 border-slate-700 shadow-inner">
                   <div className="absolute top-0 bottom-0 bg-green-500/30 border-x-2 border-green-400/80 shadow-[0_0_10px_rgba(74,222,128,0.5)] z-10" style={{ left: '75%', width: '13%' }}></div>
                   <div className="h-full bg-gradient-to-r from-orange-600 to-red-500 relative z-0" style={{ width: `${sideOrder.progress}%` }}></div>
                </div>
                
                <button 
                  onClick={handlePullFromOven} 
                  className="w-full py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-display tracking-widest rounded shadow-md active:scale-95 transition-all border border-orange-400/50"
                >
                  PULL FROM OVEN!
                </button>
              </div>
            )}

            {sideOrder && sideOrder.status !== 'cooking' && (
              <div className={`w-full h-full rounded-2xl border-2 flex items-center justify-center flex-col gap-1 shadow-lg p-4
                  ${sideOrder.status === 'perfect' ? 'bg-green-900/40 border-green-500 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.2)]' :
                    sideOrder.status === 'burnt' ? 'bg-red-900/40 border-red-500 text-red-400' :
                    'bg-yellow-900/40 border-yellow-500 text-yellow-400'}`}>
                  <div className={`text-3xl font-display tracking-widest uppercase ${sideOrder.status === 'perfect' ? 'text-glow-green animate-bounce' : ''}`}>
                     {sideOrder.status}!
                  </div>
                  <div className="font-bold font-body text-lg text-white">
                     {sideOrder.status === 'perfect' ? `Huge Bonus! +$${sideOrder.rewardEarned.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` :
                      sideOrder.status === 'burnt' ? 'Ruined! $0' :
                      `Okay. +$${sideOrder.rewardEarned.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                  </div>
              </div>
            )}
            
            {!vipSpawned && !isRush && !sideOrder && (
              <div className="w-full h-full border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 text-sm font-bold uppercase tracking-widest bg-slate-800/30">
                Awaiting Orders...
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[300px]">
            <button 
              onClick={handleBakeAndBox}
              className={`w-full h-full rounded-2xl p-6 shadow-xl border-b-8 flex flex-col items-center justify-center gap-6 group relative overflow-hidden select-none outline-none
                transform transition-all duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-[0.97] active:border-b-4 active:translate-y-1
                ${isRush ? 'bg-red-900/40 border-red-600 hover:bg-red-900/60' : 'bg-slate-800 border-orange-600 hover:bg-slate-750'}`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              
              {clickPopups.map(popup => (
                <div 
                  key={popup.id}
                  className="absolute text-2xl font-black pointer-events-none drop-shadow-md z-50 floating-popup"
                  style={{ 
                    left: popup.x, 
                    top: popup.y,
                    color: isRush ? '#f87171' : '#fcd34d' 
                  }}
                >
                  +${popup.value}
                </div>
              ))}

              <div className="relative pointer-events-none">
                 <div className={`absolute inset-0 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full ${isRush ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                 <Pizza className={`w-32 h-32 relative z-10 drop-shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-110 group-active:scale-90 ${isRush ? 'text-red-400' : 'text-orange-400'}`} />
              </div>
             
              <div className="pointer-events-none">
                <div className={`text-4xl font-display tracking-widest uppercase mb-2 ${isRush ? 'text-red-100 text-glow-red' : 'text-orange-100 text-glow-orange'}`}>Bake & Box</div>
                <div className="text-xl text-orange-300 font-display bg-slate-900/50 px-4 py-1 rounded-full inline-block tracking-wider shadow-inner">
                  +${(pizzaPrice * currentClickPower).toFixed(2)} / +{Math.ceil(currentClickPower)} Rep
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Right Area: Management & Upgrades */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {(lifetimeMoney > 5000 || franchiseLicenses > 0) && (
            <div className="bg-gradient-to-br from-purple-900/40 to-slate-800 rounded-2xl p-6 shadow-xl border border-purple-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <Building className="text-purple-400 w-6 h-6 drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
                  <h2 className="text-2xl font-display tracking-wide text-purple-100 text-glow-purple">Corporate Office</h2>
                </div>
                <div className="text-right text-sm">
                  <span className="text-purple-300">Global Multiplier: </span>
                  <span className="font-display text-purple-400 bg-purple-900/50 px-2 py-1 rounded">+{Math.round((franchiseMultiplier - 1) * 100)}%</span>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-700/50">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Lifetime Earnings: <strong className="text-green-400 font-display tracking-wider text-lg">${lifetimeMoney.toLocaleString('en-US', {maximumFractionDigits: 0})}</strong></div>
                  <div className="text-xs text-slate-500">
                    Next license at ${(Math.pow(totalEarnableLicenses + 1, 2) * FRANCHISE_BASE_COST).toLocaleString()}
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowPrestigeModal(true)}
                  disabled={pendingLicenses === 0}
                  className={`px-6 py-3 rounded-xl font-display tracking-wider transition-all whitespace-nowrap ${
                    pendingLicenses > 0 
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] cursor-pointer' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  {pendingLicenses > 0 ? `Sell Store for ${pendingLicenses} License${pendingLicenses > 1 ? 's' : ''}` : 'Not enough for Franchise'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-800 rounded-2xl p-0 shadow-2xl border border-slate-700 flex flex-col h-[650px] overflow-hidden">
            <div className="flex items-center justify-between bg-slate-900/60 p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <ShoppingCart className="text-slate-400 w-6 h-6" />
                <h2 className="text-2xl font-display text-white tracking-widest">Store Upgrades</h2>
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-3 py-1 rounded-full border border-slate-700 shadow-inner">
                {UPGRADES.filter(u => inventory[u.id] > 0).length} / {UPGRADES.length} Discovered
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-800/30">
              {UPGRADES.map((upgrade) => {
                const isLocked = starLevel < upgrade.reqStars;
                const count = inventory[upgrade.id];
                const cost = getCost(upgrade);
                const canAfford = money >= cost;
                const nextMilestone = getNextMilestone(count);
                const multi = getMilestoneMultiplier(count);

                const theme = {
                  production: { bg: 'from-blue-900/20 to-slate-800', border: 'border-blue-500/30', hover: 'hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]', iconBg: 'bg-blue-950/60 border-blue-800/50', bar: 'bg-blue-500', text: 'text-blue-400' },
                  quality: { bg: 'from-amber-900/20 to-slate-800', border: 'border-amber-500/30', hover: 'hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]', iconBg: 'bg-amber-950/60 border-amber-800/50', bar: 'bg-amber-500', text: 'text-amber-400' },
                  click: { bg: 'from-orange-900/20 to-slate-800', border: 'border-orange-500/30', hover: 'hover:border-orange-400 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)]', iconBg: 'bg-orange-950/60 border-orange-800/50', bar: 'bg-orange-500', text: 'text-orange-400' }
                }[upgrade.type];

                if (isLocked) {
                  return (
                    <div key={upgrade.id} className="w-full relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 flex items-center justify-between opacity-75 backdrop-blur-sm">
                      <div className="flex items-center gap-4 relative z-10 grayscale opacity-50">
                        <div className="bg-slate-950 p-4 rounded-xl shadow-inner border border-slate-800">
                          {upgrade.icon}
                        </div>
                        <div>
                          <h3 className="font-display text-xl text-slate-500 tracking-wider">
                            ???
                          </h3>
                          <p className="text-sm text-slate-500 font-bold flex items-center gap-1.5 mt-1">
                            <Star className="w-4 h-4" /> Requires {upgrade.reqStars} Stars
                          </p>
                        </div>
                      </div>
                      <div className="text-right relative z-10 grayscale opacity-50">
                        <div className="font-display text-2xl text-slate-600 tracking-wider">
                          ${cost.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">
                          Base Cost
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={upgrade.id}
                    onClick={() => buyUpgrade(upgrade)}
                    disabled={!canAfford}
                    className={`w-full group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl transition-all duration-300 text-left relative overflow-hidden border bg-gradient-to-br ${theme.bg} ${
                      canAfford 
                        ? `cursor-pointer ${theme.border} ${theme.hover} transform hover:-translate-y-1` 
                        : 'cursor-not-allowed opacity-60 border-slate-700/50 grayscale-[30%]'
                    }`}
                  >
                    {nextMilestone !== 'MAX' && (
                      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-900/50">
                        <div 
                          className={`h-full ${theme.bar} transition-all duration-500 ease-out shadow-[0_0_10px_currentColor]`}
                          style={{ width: `${(count / nextMilestone) * 100}%` }}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto mb-4 sm:mb-0">
                      <div className={`p-4 rounded-xl shadow-inner border ${theme.iconBg} transform transition-transform duration-300 group-hover:scale-110 group-active:scale-95`}>
                        {upgrade.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-display text-xl text-slate-100 tracking-wider">
                            {upgrade.name}
                          </h3>
                          <span className="text-xs font-black bg-slate-950 border border-slate-700 px-2.5 py-1 rounded-full text-slate-300 shadow-inner">
                            Lvl {count}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <p className="text-sm text-slate-300 font-medium flex items-center gap-2">
                            {upgrade.type === 'production' && `Bakes ${+(upgrade.baseValue * multi).toFixed(2)} / sec`}
                            {upgrade.type === 'quality' && `+$${(upgrade.baseValue * multi * franchiseMultiplier).toFixed(2)} per Pizza`}
                            {upgrade.type === 'click' && `+${+(upgrade.baseValue * multi).toFixed(2)} Pizzas / Click`}
                            
                            {multi > 1 && (
                              <span className={`text-xs font-bold ${theme.text} bg-slate-950/60 px-2 py-0.5 rounded border border-current opacity-90`}>
                                {multi}x Power
                              </span>
                            )}
                          </p>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.text} opacity-60`}>
                            Type: {upgrade.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-left sm:text-right relative z-10 w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-slate-700/50 sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 hidden sm:block">
                          Upgrade Cost
                        </div>
                        <div className={`font-display text-3xl tracking-wider ${canAfford ? 'text-green-400 text-glow-green' : 'text-slate-500'} drop-shadow-sm`}>
                          ${cost.toLocaleString()}
                        </div>
                      </div>
                      
                      {nextMilestone !== 'MAX' && (
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1 sm:mt-2 bg-slate-950/40 border border-slate-800 px-2.5 py-1 rounded">
                          Next boost: <span className="text-slate-200">{count}/{nextMilestone}</span>
                        </div>
                      )}
                      {nextMilestone === 'MAX' && (
                        <div className="text-xs text-amber-400 font-black uppercase tracking-wider mt-1 sm:mt-2 bg-amber-900/20 border border-amber-500/30 px-2.5 py-1 rounded">
                          Max Boost Reached
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&display=swap');
        
        .font-display { font-family: 'Oswald', sans-serif; text-transform: uppercase; }
        .font-body { font-family: 'Inter', sans-serif; }
        
        .metallic-text {
          background: linear-gradient(to bottom, #f8fafc 0%, #cbd5e1 40%, #64748b 50%, #e2e8f0 55%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0px 3px 2px rgba(0,0,0,0.8));
        }

        .text-glow-green { text-shadow: 0 0 10px rgba(74, 222, 128, 0.4), 0 0 20px rgba(74, 222, 128, 0.2); }
        .text-glow-blue { text-shadow: 0 0 10px rgba(96, 165, 250, 0.4), 0 0 20px rgba(96, 165, 250, 0.2); }
        .text-glow-red { text-shadow: 0 0 10px rgba(248, 113, 113, 0.6), 0 0 20px rgba(248, 113, 113, 0.3); }
        .text-glow-yellow { text-shadow: 0 0 10px rgba(250, 204, 21, 0.4), 0 0 20px rgba(250, 204, 21, 0.2); }
        .text-glow-orange { text-shadow: 0 0 10px rgba(251, 146, 60, 0.4), 0 0 20px rgba(251, 146, 60, 0.2); }
        .text-glow-purple { text-shadow: 0 0 10px rgba(192, 132, 252, 0.5), 0 0 20px rgba(192, 132, 252, 0.3); }
        
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 1); }
        
        @keyframes floatUpFade {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -100px) scale(1.3); }
        }
        .floating-popup {
          animation: floatUpFade 0.8s ease-out forwards;
          will-change: transform, opacity;
          font-family: 'Oswald', sans-serif;
          text-shadow: 0px 3px 0px rgba(0,0,0,0.9), 0px 0px 15px currentColor, 1px 1px 1px rgba(0,0,0,0.9), -1px -1px 1px rgba(0,0,0,0.9), 1px -1px 1px rgba(0,0,0,0.9), -1px 1px 1px rgba(0,0,0,0.9);
        }
      `}} />
    </div>
  );
}