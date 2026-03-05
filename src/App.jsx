import React, { useState, useEffect, useRef } from 'react';
import { 
  Pizza, Car, Store, TrendingUp, ShoppingCart, 
  DollarSign, ChefHat, Users, Award, Star, Zap, Clock, Building,
  Plane, Rocket, Gem, Crown, Coffee, MousePointerClick, Flame,
  Trophy, Droplets, Sparkles, CheckCircle, Lock, Settings, Save, Download, Upload, AlertTriangle,
  Map, Home, Briefcase
} from 'lucide-react';

const SAVE_KEY = 'pizzaTycoonSave_v10';

// --- ANTI-CORRUPTION SAVE SANITIZER ---
const safeNum = (val, fallback = 0) => {
  const parsed = Number(val);
  return (typeof parsed === 'number' && !isNaN(parsed)) ? parsed : fallback;
};

// --- ACHIEVEMENT DEFINITIONS ---
const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'Open for Business', desc: 'Sell your first pizza.', req: (s) => s.totalPizzasSold >= 1 },
  { id: 'pizza_10k', name: 'Local Legend', desc: 'Sell 10,000 pizzas total.', req: (s) => s.totalPizzasSold >= 10000 },
  { id: 'pizza_1m', name: 'Pizza Tycoon', desc: 'Sell 1,000,000 pizzas total.', req: (s) => s.totalPizzasSold >= 1000000 },
  { id: 'clicker_1k', name: 'Carpal Tunnel', desc: 'Click the pizza 1,000 times.', req: (s) => s.totalClicks >= 1000 },
  { id: 'combo_max', name: 'On Fire!', desc: 'Reach a 100x Click Combo.', req: (s) => s.combo >= 100 },
  { id: 'perfect_pull', name: 'Chef\'s Kiss', desc: 'Pull a Perfect pizza from the oven.', req: (s) => s.perfectBakes >= 1 },
  { id: 'delivery_first', name: 'Road Trip', desc: 'Complete your first map delivery.', req: (s) => s.deliveriesCompleted >= 1 },
  { id: 'delivery_10', name: 'Logistics Master', desc: 'Complete 10 map deliveries.', req: (s) => s.deliveriesCompleted >= 10 },
  { id: 'dispo_sadge', name: 'Scammed Outta Dispo', desc: 'Have exactly $13.00 in the bank.', req: (s) => Math.floor(s.money) === 13 },
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
  { id: 'franchise_5', name: 'Corporate Board', desc: 'Gain 5 Franchise Licenses.', req: (s) => s.franchiseLicenses >= 5 },

  // Specific Upgrades
  { id: 'upgrade_michelin', name: 'Fine Dining', desc: 'Purchase a Michelin Star upgrade.', req: (s) => (s.inventory?.michelin || 0) >= 1 },
];

const DESTINATIONS = [
  { id: 'suburb', name: 'Local Suburbs', warpSeconds: 180, rushSeconds: 0, vipToken: false, cooldown: 60, icon: <Home className="w-8 h-8 text-green-400" />, bg: 'from-green-900/20 to-slate-800', border: 'border-green-500/30', color: 'text-green-400', label: '3 Min Idle Drop', desc: 'Instantly collect 3 minutes of your current idle production.' },
  { id: 'downtown', name: 'Downtown Office', warpSeconds: 900, rushSeconds: 60, vipToken: false, cooldown: 300, icon: <Briefcase className="w-8 h-8 text-blue-400" />, bg: 'from-blue-900/20 to-slate-800', border: 'border-blue-500/30', color: 'text-blue-400', label: '15 Min Drop + Dinner Rush', desc: 'Collect 15 minutes of idle production and trigger a 60-second Dinner Rush.' },
  { id: 'mansion', name: 'Billionaire Estate', warpSeconds: 7200, rushSeconds: 0, vipToken: true, cooldown: 1800, icon: <Gem className="w-8 h-8 text-purple-400" />, bg: 'from-purple-900/20 to-slate-800', border: 'border-purple-500/30', color: 'text-purple-400', label: '2 Hr Drop + VIP Token', desc: 'Collect 2 hours of idle production and earn a permanent VIP Token (+5% to everything).' }
];

// --- UPGRADE DEFINITIONS ---
const UPGRADES = [
  { id: 'pizzaCutter', name: 'Pro Cutter', type: 'click', baseCost: 150, multi: 1.65, baseValue: 0.25, reqStars: 0, icon: <MousePointerClick className="text-orange-400" /> },
  { id: 'doughRoller', name: 'Auto-Roller', type: 'production', baseCost: 75, multi: 1.15, baseValue: 0.2, reqStars: 0, icon: <ChefHat className="text-blue-400" /> },
  { id: 'lineCook', name: 'Line Cook', type: 'production', baseCost: 450, multi: 1.15, baseValue: 1, reqStars: 1, icon: <Users className="text-blue-500" /> },
  { id: 'driver', name: 'Prep Station', type: 'production', baseCost: 2800, multi: 1.15, baseValue: 5, reqStars: 2, icon: <Flame className="text-green-500" /> },
  { id: 'franchise', name: 'Ghost Kitchen', type: 'production', baseCost: 25000, multi: 1.15, baseValue: 40, reqStars: 3, icon: <Store className="text-purple-500" /> },
  { id: 'drone', name: 'Robo Kitchen', type: 'production', baseCost: 180000, multi: 1.15, baseValue: 180, reqStars: 4, icon: <Zap className="text-indigo-400" /> },
  { id: 'orbital', name: 'Mega Facility', type: 'production', baseCost: 1500000, multi: 1.15, baseValue: 1000, reqStars: 5, icon: <Rocket className="text-pink-500" /> },
  { id: 'soda', name: 'Soda Combos', type: 'quality', baseCost: 350, multi: 1.6, baseValue: 1, reqStars: 0, icon: <Coffee className="text-amber-500" /> },
  { id: 'garlicCrust', name: 'Garlic Crust', type: 'quality', baseCost: 800, multi: 1.6, baseValue: 1.5, reqStars: 1, icon: <Award className="text-yellow-400" /> },
  { id: 'premiumMeat', name: 'Premium Meats', type: 'quality', baseCost: 5000, multi: 1.6, baseValue: 3.5, reqStars: 2, icon: <Pizza className="text-orange-500" /> },
  { id: 'woodFire', name: 'Wood-Fired Oven', type: 'quality', baseCost: 45000, multi: 1.6, baseValue: 12, reqStars: 3, icon: <Zap className="text-red-400" /> },
  { id: 'truffles', name: 'Artisan Truffles', type: 'quality', baseCost: 250000, multi: 1.6, baseValue: 45, reqStars: 4, icon: <Gem className="text-cyan-400" /> },
  { id: 'michelin', name: 'Michelin Star', type: 'quality', baseCost: 2000000, multi: 1.6, baseValue: 200, reqStars: 5, icon: <Crown className="text-yellow-500" /> }
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
  // --- EMERGENCY UNLOCK EFFECT ---
  useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }, []);

  const [initialData] = useState(() => loadSaveData());

  // --- CORE STATE ---
  const [money, setMoney] = useState(safeNum(initialData?.money, 0));
  const [totalPizzasSold, setTotalPizzasSold] = useState(safeNum(initialData?.totalPizzasSold, 0));
  const [reputation, setReputation] = useState(safeNum(initialData?.reputation, 0));
  const [lifetimeMoney, setLifetimeMoney] = useState(safeNum(initialData?.lifetimeMoney, 0));
  const [franchiseLicenses, setFranchiseLicenses] = useState(safeNum(initialData?.franchiseLicenses, 0));
  const [inventory, setInventory] = useState(initialData?.inventory || {});

  // --- STATS, COMBO, & MAP STATE ---
  const [totalClicks, setTotalClicks] = useState(safeNum(initialData?.totalClicks, 0));
  const [perfectBakes, setPerfectBakes] = useState(safeNum(initialData?.perfectBakes, 0));
  const [unlockedAchievements, setUnlockedAchievements] = useState(initialData?.unlockedAchievements || []);
  
  const [combo, setCombo] = useState(0);
  const [comboDecayTimer, setComboDecayTimer] = useState(0);
  
  const clickTimestampsRef = useRef([]);
  const [recentCps, setRecentCps] = useState(0);

  const [deliveriesCompleted, setDeliveriesCompleted] = useState(safeNum(initialData?.deliveriesCompleted, 0));
  const [vipTokens, setVipTokens] = useState(safeNum(initialData?.vipTokens, 0));
  const [deliveryCooldowns, setDeliveryCooldowns] = useState({});

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
  const [offlineReport, setOfflineReport] = useState(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [importText, setImportText] = useState("");
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  // --- DERIVED STATS MATH ---
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
  const achievementMultiplier = 1 + (unlockedAchievements.length * 0.02);
  const vipTokenMultiplier = 1 + (vipTokens * 0.05);

  let baseProductionRate = 0;
  let basePizzaPrice = 2.50; 
  let baseClickPower = 1; 

  UPGRADES.forEach(u => {
    const count = safeNum(inventory?.[u.id], 0);
    const multi = getMilestoneMultiplier(count);
    if (u.type === 'production') baseProductionRate += (u.baseValue * count * multi);
    if (u.type === 'quality') basePizzaPrice += (u.baseValue * count * multi);
    if (u.type === 'click') baseClickPower += (u.baseValue * count * multi);
  });

  const isRush = rushTimeLeft > 0;
  const isClean = cleanBoostTimer > 0;
  const comboMultiplier = 1 + (combo * 0.01);
  
  const franchisedProduction = baseProductionRate * franchiseMultiplier * vipTokenMultiplier;
  const franchisedPrice = basePizzaPrice * franchiseMultiplier * achievementMultiplier * vipTokenMultiplier;
  const franchisedClick = baseClickPower * vipTokenMultiplier;
  
  const productionRate = isRush ? franchisedProduction * 2 : franchisedProduction;
  const pizzaPrice = isRush ? franchisedPrice * 2 : franchisedPrice;
  const currentClickPower = franchisedClick * (isClean ? 2 : 1) * comboMultiplier; 
  
  const idlePizzasPerSec = productionRate;
  const activePizzasPerSec = recentCps * currentClickPower;
  const totalDisplayPizzasPerSec = idlePizzasPerSec + activePizzasPerSec;
  
  const idleProfitPerSec = idlePizzasPerSec * pizzaPrice;
  const activeProfitPerSec = activePizzasPerSec * pizzaPrice;
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


  // --- CORE ACTIONS ---
  const handleBakeAndBox = (e) => {
    const moneyEarned = pizzaPrice * currentClickPower;

    setMoney(prev => prev + moneyEarned);
    setLifetimeMoney(prev => prev + moneyEarned);
    setTotalPizzasSold(prev => prev + currentClickPower);
    setReputation(prev => prev + currentClickPower); // FIXED: No longer rounds up aggressively
    setTotalClicks(prev => prev + 1);
    
    setCombo(prev => Math.min(prev + 1, 100));
    setComboDecayTimer(10); 
    
    engineRefs.current.clicksThisSecond += 1;
    engineRefs.current.lastClickTime = Date.now();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX ? (e.clientX - rect.left) + (Math.random() * 40 - 20) : rect.width / 2 + (Math.random() * 40 - 20);
    const y = e.clientY ? (e.clientY - rect.top) + (Math.random() * 40 - 20) : rect.height / 2 + (Math.random() * 40 - 20);
    
    const popupId = Date.now() + Math.random();
    setClickPopups(prev => [...prev, { id: popupId, x, y, value: fmt(moneyEarned) }]);

    setTimeout(() => {
      setClickPopups(prev => prev.filter(p => p.id !== popupId));
    }, 1000);
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
        setPerfectBakes(prev => prev + 1);
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
  };

  const triggerVIP = () => {
    setVipTimeLeft(0);
    setVipSpawned(false);
    setRushTimeLeft(30); 
  };

  const buyUpgrade = (upgrade) => {
    const cost = getCost(upgrade);
    if (money >= cost) {
      setMoney(prev => prev - cost);
      setInventory(prev => ({ ...prev, [upgrade.id]: safeNum(prev[upgrade.id], 0) + 1 }));
    }
  };

  const buyUpgradeN = (upgrade, n) => {
    const currentCount = safeNum(inventory?.[upgrade.id], 0);
    let totalCost = 0;
    for (let i = 0; i < n; i++) {
      totalCost += Math.floor(upgrade.baseCost * Math.pow(upgrade.multi, currentCount + i));
    }
    if (money >= totalCost) {
      setMoney(prev => prev - totalCost);
      setInventory(prev => ({ ...prev, [upgrade.id]: currentCount + n }));
    }
  };

  const triggerDelivery = (dest) => {
    const cooldownRemaining = deliveryCooldowns[dest.id] || 0;
    if (cooldownRemaining > 0) return;

    const warpMoney = idleProfitPerSec * dest.warpSeconds;
    const warpPizzas = idlePizzasPerSec * dest.warpSeconds;
    const warpRep = Math.ceil(Math.sqrt(idlePizzasPerSec)) * dest.warpSeconds;

    setMoney(m => m + warpMoney);
    setLifetimeMoney(m => m + warpMoney);
    setTotalPizzasSold(tp => tp + warpPizzas);
    setReputation(r => r + warpRep);

    if (dest.rushSeconds > 0) {
      setRushTimeLeft(prev => prev + dest.rushSeconds);
    }
    if (dest.vipToken) {
      setVipTokens(t => t + 1);
    }

    setDeliveriesCompleted(d => d + 1);
    setDeliveryCooldowns(prev => ({ ...prev, [dest.id]: dest.cooldown }));
  };

  const confirmPrestige = () => {
    setFranchiseLicenses(prev => prev + pendingLicenses);
    setMoney(0); setReputation(0); setTotalPizzasSold(0); setRushTimeLeft(0); setVipTimeLeft(0);
    setVipSpawned(false); setSideOrder(null); setCombo(0); setDeliveryCooldowns({});
    setInventory({});
    setShowPrestigeModal(false);
  };

  // --- SETTINGS ACTIONS ---
  const handleExportSave = () => {
    const data = { 
       money, totalPizzasSold, reputation, lifetimeMoney, franchiseLicenses, inventory, 
       totalClicks, perfectBakes, unlockedAchievements, deliveriesCompleted, vipTokens
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
       totalClicks, perfectBakes, unlockedAchievements, deliveriesCompleted, vipTokens, lastSaveTime: Date.now() 
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    alert("Game saved successfully!");
  };

  // --- HIGH PERFORMANCE ENGINE REF CACHING ---
  const engineRefs = useRef({
      idleProfitPerSec: 0, idlePizzasPerSec: 0, idleRepPerSec: 0,
      lastClickTime: Date.now(), clicksThisSecond: 0,
      rushTimeLeft: 0, vipSpawned: false, hasStarted: false
  });

  useEffect(() => {
      engineRefs.current.idleProfitPerSec = idleProfitPerSec;
      engineRefs.current.idlePizzasPerSec = idlePizzasPerSec;
      engineRefs.current.idleRepPerSec = Math.ceil(Math.sqrt(idlePizzasPerSec));
      engineRefs.current.rushTimeLeft = rushTimeLeft;
      engineRefs.current.vipSpawned = vipSpawned;
      engineRefs.current.hasStarted = totalPizzasSold > 0;
  }, [idleProfitPerSec, idlePizzasPerSec, rushTimeLeft, vipSpawned, totalPizzasSold]);

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
              setCombo(0);
              setComboDecayTimer(0);
          } else {
              setComboDecayTimer(20 - Math.floor(timeSinceClick / 100));
          }
      }, 100);
      return () => clearInterval(smoothTick);
  }, []);

  // 2. The 1000ms Action & Event Loop
  useEffect(() => {
      const eventTick = setInterval(() => {
          const state = engineRefs.current;

          setRecentCps(state.clicksThisSecond);
          state.clicksThisSecond = 0; 

          setRushTimeLeft(prev => Math.max(0, prev - 1));
          setCleanBoostTimer(prev => Math.max(0, prev - 1));

          setVipTimeLeft(prev => {
              if (prev > 0) return prev - 1;
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

      }, 1000);
      return () => clearInterval(eventTick);
  }, []);

  // 3. Fast Mini-Game Loop (For the oven progress bar)
  useEffect(() => {
    if (!sideOrder || sideOrder.status !== 'cooking') return;
    const tick = setInterval(() => {
      setSideOrder(prev => {
        if (!prev || prev.status !== 'cooking') return prev;
        const nextProg = prev.progress + (prev.speed * 2);
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
  }, [totalPizzasSold, totalClicks, perfectBakes, money, franchiseLicenses, lifetimeMoney, unlockedAchievements, combo, deliveriesCompleted, reputation, inventory]);

  // --- SAVE SYSTEM ---
  const saveStateRef = useRef();
  useEffect(() => {
    saveStateRef.current = { money, totalPizzasSold, reputation, lifetimeMoney, franchiseLicenses, inventory, totalClicks, perfectBakes, unlockedAchievements, deliveriesCompleted, vipTokens };
  });

  useEffect(() => {
    const saveLoop = setInterval(() => {
      if (saveStateRef.current) localStorage.setItem(SAVE_KEY, JSON.stringify({ ...saveStateRef.current, lastSaveTime: Date.now() }));
    }, 2000);
    return () => clearInterval(saveLoop);
  }, []);

  useEffect(() => {
    if (initialData && initialData.lastSaveTime) {
      const secondsAway = Math.floor((Date.now() - initialData.lastSaveTime) / 1000);
      if (secondsAway > 60 && franchisedProduction > 0) {
        const offlinePrice = basePizzaPrice * (1 + (safeNum(initialData.franchiseLicenses) * 0.50)) * (1 + ((initialData.unlockedAchievements?.length || 0) * 0.02));
        const generatedMoney = franchisedProduction * offlinePrice * secondsAway;
        const generatedPizzas = franchisedProduction * secondsAway;
        const generatedRep = Math.ceil(Math.sqrt(franchisedProduction)) * secondsAway;

        setMoney(prev => prev + generatedMoney); setLifetimeMoney(prev => prev + generatedMoney);
        setTotalPizzasSold(prev => prev + generatedPizzas); setReputation(prev => prev + generatedRep);
        setOfflineReport({ time: secondsAway, money: generatedMoney, pizzas: generatedPizzas, rep: generatedRep });
      }
    }
    // eslint-disable-next-line
  }, []); 

  const fmt = (n) => {
    if (n === null || n === undefined || isNaN(n)) return '0';
    const abs = Math.abs(n);
    if (abs >= 1e15) return (n / 1e15).toFixed(2) + 'Qu';
    if (abs >= 1e12) return (n / 1e12).toFixed(2) + 'T';
    if (abs >= 1e9)  return (n / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6)  return (n / 1e6).toFixed(2) + 'M';
    if (abs >= 1e3)  return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(2);
  };

  const fmtInt = (n) => {
    if (n === null || n === undefined || isNaN(n)) return '0';
    const abs = Math.abs(n);
    if (abs >= 1e15) return (n / 1e15).toFixed(2) + 'Qu';
    if (abs >= 1e12) return (n / 1e12).toFixed(2) + 'T';
    if (abs >= 1e9)  return (n / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6)  return (n / 1e6).toFixed(2) + 'M';
    if (abs >= 1e3)  return (n / 1e3).toFixed(2) + 'K';
    return Math.floor(n).toLocaleString();
  };

  const numWords = (n) => {
    const abs = Math.abs(n);
    if (abs >= 1e15) return `${(n / 1e15).toFixed(2)} Quadrillion`;
    if (abs >= 1e12) return `${(n / 1e12).toFixed(2)} Trillion`;
    if (abs >= 1e9)  return `${(n / 1e9).toFixed(2)} Billion`;
    if (abs >= 1e6)  return `${(n / 1e6).toFixed(2)} Million`;
    if (abs >= 1e3)  return `${(n / 1e3).toFixed(2)} Thousand`;
    return null;
  };

  const Num = ({ value, prefix = '', suffix = '', decimals = 2, showFull = false }) => {
    const abs = Math.abs(value);
    if (abs < 1e3) return <span>{prefix}{value.toFixed(decimals)}{suffix}</span>;
    const words = numWords(value);
    if (showFull && words) {
      return (
        <span className="flex flex-col leading-tight">
          <span>{prefix}{fmt(value)}{suffix}</span>
          <span className="text-[0.6em] text-slate-500 font-normal tracking-wide normal-case">{prefix}{words}</span>
        </span>
      );
    }
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
    : 'bg-slate-900 text-slate-100';

  const hasTruffles = (inventory?.truffles || 0) > 0;
  const hasWoodFire = (inventory?.woodFire || 0) > 0;
  const hasMichelin = (inventory?.michelin || 0) > 0;
  const hasPremiumMeat = (inventory?.premiumMeat || 0) > 0;
  const hasGarlicCrust = (inventory?.garlicCrust || 0) > 0;

  const pizzaColorClass = isRush
    ? 'text-red-400'
    : hasTruffles
    ? 'text-cyan-300 drop-shadow-[0_0_18px_rgba(103,232,249,0.7)]'
    : hasPremiumMeat
    ? 'text-rose-500'
    : hasGarlicCrust
    ? 'text-yellow-400 drop-shadow-[0_0_14px_rgba(250,204,21,0.6)]'
    : 'text-orange-400';

  return (
    <div className={`min-h-screen p-4 md:p-8 font-body selection:bg-blue-500 selection:text-white flex flex-col relative overflow-x-hidden transition-colors duration-1000 ${appBgClass}`}>
      
      {/* HEADER: Achievements & Settings Button */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
         {achievementToasts.map(toast => (
            <div key={toast.id} className="bg-slate-800 border-2 border-yellow-500 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center gap-3 animate-[floatUpFade_4s_ease-out_forwards]">
               <Trophy className="w-6 h-6 text-yellow-400" />
               <div>
                  <div className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest leading-none">Achievement Unlocked!</div>
                  <div className="text-lg font-display text-white tracking-wider leading-none mt-1 tabular-nums">{toast.name}</div>
               </div>
            </div>
         ))}
      </div>

      <button onClick={() => setShowSettings(true)} className="absolute top-4 right-4 z-50 bg-slate-800 p-2 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-700 transition-all shadow-lg">
        <Settings className="w-6 h-6" />
      </button>

      {/* --- SETTINGS MODAL --- */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border-2 border-slate-600 rounded-2xl p-6 md:p-8 max-w-md w-full relative shadow-2xl">
            <h2 className="text-3xl font-display text-white tracking-widest mb-6 border-b border-slate-700 pb-4 flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-400" /> GAME SETTINGS
            </h2>

            {!showWipeConfirm ? (
              <div className="space-y-4">
                <button onClick={handleManualSave} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-display tracking-widest rounded-xl flex items-center justify-center gap-3 transition-colors">
                  <Save className="w-5 h-5" /> FORCE SAVE GAME
                </button>
                <button onClick={handleExportSave} className="w-full py-3 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/50 text-blue-300 font-display tracking-widest rounded-xl flex items-center justify-center gap-3 transition-colors">
                  <Download className="w-5 h-5" /> EXPORT SAVE CODE
                </button>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex flex-col gap-2">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Import Save Code</div>
                  <div className="flex gap-2">
                    <input type="text" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste code here..." className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500 tabular-nums" />
                    <button onClick={handleImportSave} className="bg-slate-700 hover:bg-slate-600 px-4 rounded-lg font-display tracking-widest transition-colors"><Upload className="w-4 h-4"/></button>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <button onClick={() => setShowWipeConfirm(true)} className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-500 hover:text-red-400 font-display tracking-widest rounded-xl transition-colors">
                    WIPE SAVE DATA (HARD RESET)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
                <div>
                  <h3 className="text-xl font-display text-red-400 mb-2">ARE YOU ABSOLUTELY SURE?</h3>
                  <p className="text-sm text-slate-400">This will permanently delete all your money, upgrades, reputation, and Corporate Licenses. This cannot be undone.</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowWipeConfirm(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-display tracking-widest">CANCEL</button>
                  <button onClick={handleHardReset} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-display tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.4)]">DELETE SAVE</button>
                </div>
              </div>
            )}
            <button onClick={() => {setShowSettings(false); setShowWipeConfirm(false);}} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* --- OFFLINE PROGRESS MODAL --- */}
      {offlineReport && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border-2 border-blue-500 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(59,130,246,0.2)] text-center relative">
            <h2 className="text-4xl font-display text-white tracking-widest mb-2 text-glow-blue">WELCOME BACK!</h2>
            <p className="text-slate-400 font-bold mb-6">Your crew kept the ovens hot while you were gone.</p>
            <div className="space-y-4 mb-8">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center"><span className="text-slate-400 font-bold tracking-widest uppercase text-xs">Time Away</span><span className="text-white font-display text-xl tabular-nums">{formatTime(offlineReport.time)}</span></div>
              <div className="bg-green-900/20 p-4 rounded-xl border border-green-500/30 flex justify-between items-center"><span className="text-green-500 font-bold tracking-widest uppercase text-xs">Money Earned</span><span className="text-green-400 font-display text-2xl text-glow-green tabular-nums">+$<Num value={offlineReport.money} decimals={2} /></span></div>
              <div className="bg-orange-900/20 p-4 rounded-xl border border-orange-500/30 flex justify-between items-center"><span className="text-orange-500 font-bold tracking-widest uppercase text-xs">Pizzas Boxed</span><span className="text-orange-400 font-display text-2xl text-glow-orange tabular-nums">+<Num value={offlineReport.pizzas} decimals={0} /></span></div>
            </div>
            <button onClick={() => setOfflineReport(null)} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-display text-xl tracking-widest rounded-xl shadow-lg active:scale-95 transition-all">LET'S GET COOKING</button>
          </div>
        </div>
      )}

      {/* --- PRESTIGE MODAL --- */}
      {showPrestigeModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border-2 border-purple-500 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(168,85,247,0.2)] text-center relative">
            <Building className="w-16 h-16 text-purple-400 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]" />
            <h2 className="text-4xl font-display text-white tracking-widest mb-2 text-glow-purple">CORPORATE BUYOUT</h2>
            <p className="text-slate-400 font-bold mb-6">Are you sure you want to sell your store to Corporate?</p>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6 text-left space-y-3">
               <div className="text-red-400 font-bold text-xs uppercase tracking-wider flex items-start gap-2"><span className="text-lg leading-none">-</span> You will reset all money and upgrades.</div>
               <div className="text-green-400 font-bold text-xs uppercase tracking-wider flex items-start gap-2"><span className="text-lg leading-none">+</span> You will gain <span className="text-xl font-display text-glow-green leading-none tabular-nums">{pendingLicenses}</span> Franchise Licenses.</div>
               <div className="text-purple-400 font-bold text-xs uppercase tracking-wider flex items-start gap-2"><span className="text-lg leading-none">+</span> Each license permanently boosts speed and prices by 50%!</div>
            </div>
            <div className="flex gap-4">
                <button onClick={() => setShowPrestigeModal(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-display text-xl tracking-widest rounded-xl transition-all">CANCEL</button>
                <button onClick={confirmPrestige} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-display text-xl tracking-widest rounded-xl shadow-lg active:scale-95 transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)]">SELL STORE</button>
            </div>
          </div>
        </div>
      )}


      {/* --- DASHBOARD HEADER --- */}
      <div className="max-w-6xl w-full mx-auto bg-slate-800 rounded-2xl p-5 md:p-6 shadow-xl border border-slate-700 mb-8 flex flex-col lg:flex-row gap-6 items-center justify-between relative overflow-hidden mt-6">
        {isRush && <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none"></div>}
        
        {/* Title & Rep */}
        <div className="w-full lg:w-auto relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl md:text-4xl font-display tracking-widest metallic-text whitespace-nowrap">
              PIZZA TYCOON
            </h1>
            <div className="flex bg-slate-900 px-2 py-1 rounded-full border border-slate-700 ml-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 md:w-4 md:h-4 ${i < starLevel ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-slate-600'}`} />
              ))}
            </div>
          </div>
          <div className="w-full max-w-[280px]">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-widest tabular-nums">
              <span>Reputation</span>
              <span>{fmtInt(reputation)} / {fmtInt(nextStarReq)}</span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700 shadow-inner">
              <div className="h-full bg-yellow-400 transition-all duration-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${Math.min(100, (reputation / nextStarReq) * 100)}%` }}></div>
            </div>
          </div>
        </div>
        
        {/* Core 4 Stat Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 z-10 w-full lg:w-auto flex-1">
          {/* 1. Bank */}
          <div className="bg-slate-900 px-4 py-3 rounded-xl border border-slate-700 flex flex-col justify-center shadow-inner relative overflow-hidden">
            <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-green-400"/> Bank
            </span>
            <span className="text-xl sm:text-2xl font-display tracking-wider text-green-400 text-glow-green truncate tabular-nums">
              $<Num value={money} decimals={2} showFull />
            </span>
          </div>

          {/* 2. Profit / Sec */}
          <div className={`px-4 py-3 rounded-xl border flex flex-col justify-center shadow-inner relative overflow-hidden transition-colors duration-300 ${isRush ? 'bg-red-900/50 border-red-500' : recentCps > 0 ? 'bg-orange-900/20 border-orange-500/50' : 'bg-slate-900 border-slate-700'}`}>
            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 ${isRush ? 'text-red-300' : recentCps > 0 ? 'text-orange-300' : 'text-slate-400'}`}>
              <TrendingUp className="w-3 h-3"/> Profit / Sec
            </span>
            <span className={`text-xl sm:text-2xl font-display tracking-wider truncate transition-all tabular-nums ${isRush ? 'text-red-400 text-glow-red' : recentCps > 0 ? 'text-orange-400 text-glow-orange scale-105' : 'text-blue-400 text-glow-blue'}`}>
              $<Num value={displayProfitPerSec} decimals={2} showFull />
            </span>
          </div>

          {/* 3. Pizzas / Sec */}
          <div className={`px-4 py-3 rounded-xl border flex flex-col justify-center shadow-inner transition-colors duration-300 ${isRush ? 'bg-red-900/50 border-red-500' : 'bg-slate-900 border-slate-700'}`}>
            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 ${isRush ? 'text-red-300' : 'text-slate-400'}`}>
              <Pizza className="w-3 h-3"/> Pizzas / Sec
            </span>
            <span className={`text-xl sm:text-2xl font-display tracking-wider truncate transition-all tabular-nums ${isRush ? 'text-red-400 text-glow-red' : 'text-slate-200'}`}>
              <Num value={idlePizzasPerSec} decimals={1} showFull />
            </span>
          </div>

          {/* 4. Ticket Avg */}
          <div className={`px-4 py-3 rounded-xl border flex flex-col justify-center shadow-inner transition-colors ${isRush ? 'bg-red-900/50 border-red-500' : 'bg-slate-900 border-slate-700'}`}>
            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 ${isRush ? 'text-red-300' : 'text-slate-400'}`}>
              <Award className="w-3 h-3"/> Ticket Avg
            </span>
            <span className={`text-xl sm:text-2xl font-display tracking-wider truncate tabular-nums ${isRush ? 'text-red-400 text-glow-red' : 'text-yellow-400 text-glow-yellow'}`}>
              $<Num value={pizzaPrice} decimals={2} showFull />
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left Area: Action Center */}
        <div className="lg:col-span-5 flex flex-col gap-6 relative">
          
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
                <div className="text-4xl font-display text-red-400 flex items-center gap-2 text-glow-red tabular-nums">
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

            {/* REDESIGNED SCRUB BOARD */}
            {sideOrder && sideOrder.type === 'dishes' && sideOrder.status === 'dirty' && (
              <div className="w-full h-full bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-lg flex flex-col items-center justify-center gap-2">
                 <div className="flex justify-between w-full text-xs font-display tracking-widest text-blue-300">
                    <span className="flex items-center gap-2"><Droplets className="w-3 h-3 text-blue-400" /> SINK FULL</span>
                    <span className="tabular-nums text-blue-400 font-bold bg-blue-900/50 px-2 py-0.5 rounded border border-blue-500/30">{Math.floor((sideOrder.progress / sideOrder.required) * 100)}%</span>
                 </div>
                 
                 <div 
                    className="relative w-full h-16 sm:h-20 rounded-xl bg-slate-950 border-2 border-dashed border-blue-500/40 flex items-center justify-center cursor-crosshair touch-none overflow-hidden group shadow-inner"
                    onMouseDown={handleScrubStart}
                    onTouchStart={handleScrubStart}
                    onMouseMove={handleScrub}
                    onTouchMove={handleScrub}
                 >
                    {/* Water Level that fills up as you scrub */}
                    <div 
                       className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-100 ease-out opacity-80"
                       style={{ height: `${(sideOrder.progress / sideOrder.required) * 100}%` }}
                    >
                       <div className="w-full h-full animate-pulse bg-[radial-gradient(circle_at_top,_#ffffff_0%,_transparent_60%)] opacity-30"></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-center text-blue-300/80 pointer-events-none group-hover:text-blue-100 transition-colors">
                       <span className="text-sm sm:text-base font-black tracking-widest flex items-center gap-3 drop-shadow-md">
                          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                          SWIPE HERE TO SCRUB
                          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                       </span>
                    </div>
                 </div>
              </div>
            )}

            {sideOrder && sideOrder.type === 'dishes' && sideOrder.status === 'clean' && (
              <div className="w-full h-full rounded-2xl border-2 bg-green-900/40 border-green-500 text-green-400 flex items-center justify-center flex-col gap-1 shadow-[0_0_20px_rgba(74,222,128,0.2)] p-4">
                  <Sparkles className="w-10 h-10 animate-spin-slow mb-1" />
                  <div className="text-3xl font-display tracking-widest uppercase text-glow-green">Spotless!</div>
                  <div className="text-sm font-bold text-green-300 mt-1">2x Click Power for 60 seconds!</div>
              </div>
            )}

            {sideOrder && sideOrder.status !== 'cooking' && sideOrder.type !== 'dishes' && (
              <div className={`w-full h-full rounded-2xl border-2 flex items-center justify-center flex-col gap-1 shadow-lg p-4
                  ${sideOrder.status === 'perfect' ? 'bg-green-900/40 border-green-500 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.2)]' :
                    sideOrder.status === 'burnt' ? 'bg-red-900/40 border-red-500 text-red-400' :
                    'bg-yellow-900/40 border-yellow-500 text-yellow-400'}`}>
                  <div className={`text-3xl font-display tracking-widest uppercase ${sideOrder.status === 'perfect' ? 'text-glow-green animate-bounce' : ''}`}>
                     {sideOrder.status}!
                  </div>
                  <div className="font-bold font-body text-lg text-white tabular-nums">
                     {sideOrder.status === 'perfect' ? `Huge Bonus! +$${fmt(sideOrder.rewardEarned)}` :
                      sideOrder.status === 'burnt' ? 'Ruined! $0' :
                      `Okay. +$${fmt(sideOrder.rewardEarned)}`}
                  </div>
              </div>
            )}
            
            {!vipSpawned && !isRush && !sideOrder && (
              <div className="w-full h-full border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 text-sm font-bold uppercase tracking-widest bg-slate-800/30">
                {isClean ? <><Sparkles className="w-6 h-6 text-blue-400 mr-2" /><span className="text-blue-300 tabular-nums">Clean Kitchen Boost: {cleanBoostTimer}s</span></> : 'Awaiting Orders...'}
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={handleBakeAndBox}
              className={`w-full h-full rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center gap-6 group relative overflow-hidden select-none outline-none
                transform transition-all duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-[0.98] border-b-8 border-slate-700
                ${isRush ? 'bg-red-900/40 border-red-600 hover:bg-red-900/60' : 'bg-slate-800 border-orange-600 hover:bg-slate-750'}`}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              
              {/* COMBO METER */}
              {combo > 0 && (
                <div className="absolute top-6 right-6 flex flex-col items-end pointer-events-none">
                  <div className={`font-display text-3xl md:text-5xl transition-all duration-100 tabular-nums ${combo > 50 ? 'text-red-400 text-glow-red scale-110' : combo > 20 ? 'text-orange-400 text-glow-orange' : 'text-yellow-400 text-glow-yellow'}`}>
                    x{comboMultiplier.toFixed(2)}
                  </div>
                  <div className="text-[10px] md:text-xs font-black tracking-widest uppercase text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded shadow-inner mt-1">Heat Combo</div>
                  
                  {/* Smooth Combo Decay Bar */}
                  <div className="w-24 h-1.5 bg-slate-900 rounded-full mt-2 overflow-hidden border border-slate-700">
                    <div className="h-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-100" style={{ width: `${(comboDecayTimer / 20) * 100}%` }}></div>
                  </div>
                </div>
              )}

              {clickPopups.map(popup => (
                <div 
                  key={popup.id}
                  className="absolute text-2xl font-black pointer-events-none drop-shadow-md z-50 floating-popup tabular-nums"
                  style={{ 
                    left: popup.x, 
                    top: popup.y,
                    color: isRush ? '#f87171' : '#fcd34d' 
                  }}
                >
                  +${popup.value}
                </div>
              ))}

              <div className="relative pointer-events-none mt-4">
                 <div className={`absolute inset-0 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full ${isRush ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                 {hasWoodFire && !isRush && (
                   <div className="absolute inset-0 bg-gradient-to-t from-red-600 to-orange-400 mix-blend-screen blur-3xl opacity-30 rounded-full animate-pulse pointer-events-none"></div>
                 )}
                 {hasMichelin && (
                   <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] animate-bounce z-20" />
                 )}
                 {hasTruffles && !isRush && (
                   <>
                     <Sparkles className="absolute -top-2 -left-3 w-5 h-5 text-cyan-300 opacity-80 animate-bounce z-20" style={{ animationDelay: '0s' }} />
                     <Sparkles className="absolute -top-2 -right-3 w-5 h-5 text-cyan-300 opacity-80 animate-bounce z-20" style={{ animationDelay: '0.3s' }} />
                   </>
                 )}
                 <Pizza className={`w-32 h-32 md:w-40 md:h-40 relative z-10 drop-shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-110 group-active:scale-90 ${pizzaColorClass}`} />
              </div>
             
              <div className="pointer-events-none flex flex-col items-center z-10">
                <div className={`text-4xl font-display tracking-widest uppercase mb-2 ${isRush ? 'text-red-100 text-glow-red' : 'text-orange-100 text-glow-orange'}`}>Bake & Box</div>
                <div className="text-sm md:text-base text-orange-300 font-display bg-slate-900/90 px-5 py-2 rounded-full inline-block tracking-wider shadow-inner border border-slate-700 backdrop-blur-sm tabular-nums">
                  +$<Num value={pizzaPrice * currentClickPower} decimals={2} /> <span className="text-slate-500 mx-1">|</span> +<Num value={currentClickPower} decimals={1} /> Pizzas per Click
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Right Area: Management & Upgrades */}
        <div className="lg:col-span-7 flex flex-col gap-6 transition-all duration-300 opacity-100">
          
          {(lifetimeMoney > 5000 || franchiseLicenses > 0) && (
            <div className="bg-gradient-to-br from-purple-900/40 to-slate-800 rounded-2xl p-6 shadow-xl border border-purple-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <Building className="text-purple-400 w-6 h-6 drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
                  <h2 className="text-2xl font-display tracking-wide text-purple-100 text-glow-purple">Corporate Office</h2>
                </div>
                <div className="text-right text-sm flex flex-col items-end gap-1.5">
                  <div>
                    <span className="text-purple-300">Global Multiplier: </span>
                    <span className="font-display text-purple-400 bg-purple-900/50 px-2 py-1 rounded border border-purple-500/30 tabular-nums">+{fmt(Math.round((franchiseMultiplier - 1) * 100))}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Multiplier: </span>
                    <span className="font-display text-yellow-300 bg-yellow-900/30 px-2 py-1 rounded border border-yellow-500/30 tabular-nums">{fmt(+(franchiseMultiplier * achievementMultiplier * vipTokenMultiplier).toFixed(2))}x</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-700/50">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Lifetime Earnings: <strong className="text-green-400 font-display tracking-wider text-lg tabular-nums">$<Num value={lifetimeMoney} decimals={0} /></strong></div>
                  <div className="text-xs text-slate-500 tabular-nums">
                    Next license at $<Num value={Math.pow(totalEarnableLicenses + 1, 2) * FRANCHISE_BASE_COST} decimals={0} />
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

          <div className="bg-slate-800 rounded-2xl p-0 shadow-2xl border border-slate-700 flex flex-col overflow-hidden relative">

            <div className="flex items-center justify-between bg-slate-900/60 p-4 sm:p-6 border-b border-slate-700">
              <div className="flex gap-4 min-w-0">
                <button onClick={() => setActiveTab('upgrades')} className={`text-xl sm:text-2xl font-display tracking-widest flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'upgrades' ? 'text-white text-glow-blue' : 'text-slate-500 hover:text-slate-300'}`}>
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" /> Upgrades
                </button>
                <div className="w-px bg-slate-700 my-1 hidden sm:block"></div>
                <button onClick={() => setActiveTab('map')} className={`text-xl sm:text-2xl font-display tracking-widest flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'map' ? 'text-white text-glow-green' : 'text-slate-500 hover:text-slate-300'}`}>
                  <Map className="w-5 h-5 sm:w-6 sm:h-6" /> Map
                </button>
                <div className="w-px bg-slate-700 my-1 hidden sm:block"></div>
                <button onClick={() => setActiveTab('achievements')} className={`text-xl sm:text-2xl font-display tracking-widest flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'achievements' ? 'text-white text-glow-yellow' : 'text-slate-500 hover:text-slate-300'}`}>
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6" /> Trophies
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 bg-slate-800/30">
              
              {/* --- TAB: UPGRADES --- */}
              {activeTab === 'upgrades' && UPGRADES.map((upgrade) => {
                const isLocked = starLevel < upgrade.reqStars;
                const count = safeNum(inventory?.[upgrade.id], 0);
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
                          <p className="text-sm text-slate-500 font-bold flex items-center gap-1.5 mt-1 tabular-nums">
                            <Star className="w-4 h-4" /> Requires {upgrade.reqStars} Stars
                          </p>
                        </div>
                      </div>
                      <div className="text-right relative z-10 grayscale opacity-50">
                        <div className="font-display text-2xl text-slate-600 tracking-wider tabular-nums">
                          $<Num value={cost} decimals={0} />
                        </div>
                        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">
                          Base Cost
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={upgrade.id}
                    className={`w-full group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl transition-all duration-300 text-left relative overflow-hidden border bg-gradient-to-br ${theme.bg} ${
                      canAfford 
                        ? `${theme.border} hover:-translate-y-1 hover:shadow-lg` 
                        : 'opacity-60 border-slate-700/50 grayscale-[30%]'
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
                          <span className="text-xs font-black bg-slate-950 border border-slate-700 px-2.5 py-1 rounded-full text-slate-300 shadow-inner tabular-nums">
                            Lvl {count}
                          </span>
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <p className="text-sm text-slate-300 font-medium flex items-center gap-2 tabular-nums">
                            {upgrade.type === 'production' && (count === 0
                              ? <span>Lvl 1 → <span className="text-blue-300">+{fmt(upgrade.baseValue)} / sec</span></span>
                              : <span>Bakes {fmt(upgrade.baseValue * count * multi * franchiseMultiplier * vipTokenMultiplier)} / sec</span>)}
                            {upgrade.type === 'quality' && (count === 0
                              ? <span>Lvl 1 → <span className="text-amber-300">+${fmt(upgrade.baseValue * franchiseMultiplier * achievementMultiplier * vipTokenMultiplier)} per Pizza</span></span>
                              : <span>+${fmt(upgrade.baseValue * count * multi * franchiseMultiplier * achievementMultiplier * vipTokenMultiplier)} per Pizza</span>)}
                            {upgrade.type === 'click' && (count === 0
                              ? <span>Lvl 1 → <span className="text-orange-300">+{fmt(upgrade.baseValue * franchiseMultiplier * vipTokenMultiplier)} Pizzas / Click</span></span>
                              : <span>+{fmt(upgrade.baseValue * count * multi * franchiseMultiplier * vipTokenMultiplier)} Pizzas / Click</span>)}
                            
                            {multi > 1 && count > 0 && (
                              <span className={`text-xs font-bold ${theme.text} bg-slate-950/60 px-2 py-0.5 rounded border border-current opacity-90 tabular-nums`}>
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
                    
                    <div className="relative z-10 w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-2 border-t border-slate-700/50 sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                      {/* Buy x1 */}
                      <button
                        onClick={() => buyUpgrade(upgrade)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-lg font-display tracking-wider text-sm transition-all tabular-nums ${
                          canAfford ? `${theme.border} border bg-slate-900/60 ${theme.text} hover:bg-slate-800 cursor-pointer active:scale-95` : 'border border-slate-700/50 bg-slate-900/30 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        x1 — $<Num value={cost} decimals={0} /> each
                      </button>

                      {/* Buy x10 */}
                      {(() => {
                        let cost10 = 0;
                        for (let i = 0; i < 10; i++) cost10 += Math.floor(upgrade.baseCost * Math.pow(upgrade.multi, count + i));
                        const can10 = money >= cost10;
                        return (
                          <button
                            onClick={() => buyUpgradeN(upgrade, 10)}
                            disabled={!can10}
                            className={`px-4 py-2 rounded-lg font-display tracking-wider text-sm transition-all tabular-nums ${
                              can10 ? `${theme.border} border bg-slate-900/60 ${theme.text} hover:bg-slate-800 cursor-pointer active:scale-95` : 'border border-slate-700/50 bg-slate-900/30 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            x10 — $<Num value={cost10 / 10} decimals={0} /> each
                          </button>
                        );
                      })()}

                      {/* Buy x100 */}
                      {(() => {
                        let cost100 = 0;
                        for (let i = 0; i < 100; i++) cost100 += Math.floor(upgrade.baseCost * Math.pow(upgrade.multi, count + i));
                        const can100 = money >= cost100;
                        return (
                          <button
                            onClick={() => buyUpgradeN(upgrade, 100)}
                            disabled={!can100}
                            className={`px-4 py-2 rounded-lg font-display tracking-wider text-sm transition-all tabular-nums ${
                              can100 ? `${theme.border} border bg-slate-900/60 ${theme.text} hover:bg-slate-800 cursor-pointer active:scale-95` : 'border border-slate-700/50 bg-slate-900/30 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            x100 — $<Num value={cost100 / 100} decimals={0} /> each
                          </button>
                        );
                      })()}

                      {nextMilestone !== 'MAX' && (
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider bg-slate-950/40 border border-slate-800 px-2.5 py-1 rounded tabular-nums text-center sm:text-right">
                          Next boost: <span className="text-slate-200">{count}/{nextMilestone}</span>
                        </div>
                      )}
                      {nextMilestone === 'MAX' && (
                        <div className="text-xs text-amber-400 font-black uppercase tracking-wider bg-amber-900/20 border border-amber-500/30 px-2.5 py-1 rounded text-center sm:text-right">
                          Max Boost Reached
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* --- TAB: TIME WARP DELIVERIES --- */}
              {activeTab === 'map' && (
                <div className="flex flex-col gap-4">

                  {/* Header Banner */}
                  <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-700 shadow-inner flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Zap className="w-8 h-8 text-yellow-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-display text-xl text-yellow-100 tracking-wider">Time Warp Deliveries</h3>
                        <p className="text-sm text-slate-400 mt-1">Instantly collect hours of idle production. Each run is on cooldown after use.</p>
                      </div>
                    </div>
                    {vipTokens > 0 && (
                      <div className="shrink-0 flex flex-col items-center bg-purple-900/40 border border-purple-500/50 rounded-xl px-4 py-3 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1">VIP Tokens</div>
                        <div className="font-display text-2xl text-purple-300 tabular-nums">{vipTokens}</div>
                        <div className="text-[10px] text-purple-400 font-bold mt-1">+{fmt(vipTokens * 5)}% All</div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Cards */}
                  <div className="grid grid-cols-1 gap-4">
                    {DESTINATIONS.map(dest => {
                      const cooldown = deliveryCooldowns[dest.id] || 0;
                      const onCooldown = cooldown > 0;
                      const warpMoney = idleProfitPerSec * dest.warpSeconds;
                      const cooldownPct = onCooldown ? (cooldown / dest.cooldown) * 100 : 0;
                      return (
                        <button
                          key={dest.id}
                          onClick={() => triggerDelivery(dest)}
                          disabled={onCooldown}
                          className={`w-full p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between text-left transition-all duration-300 bg-gradient-to-br relative overflow-hidden group
                            ${onCooldown ? `${dest.bg} ${dest.border} opacity-60 cursor-not-allowed grayscale-[40%]` : `${dest.bg} ${dest.border} hover:-translate-y-1 hover:shadow-lg cursor-pointer`}`}
                        >
                          {/* Cooldown drain bar */}
                          {onCooldown && (
                            <div className="absolute bottom-0 left-0 h-1 bg-slate-700 w-full">
                              <div className="h-full bg-slate-400/60 transition-all duration-1000" style={{ width: `${cooldownPct}%` }} />
                            </div>
                          )}

                          <div className="flex items-center gap-4 w-full sm:w-auto mb-3 sm:mb-0">
                            <div className={`p-4 rounded-xl shadow-inner border bg-slate-950/50 ${dest.border} ${!onCooldown ? 'group-hover:scale-110' : ''} transition-transform shrink-0`}>
                              {dest.icon}
                            </div>
                            <div>
                              <h3 className="font-display text-xl text-slate-100 tracking-wider mb-1">{dest.name}</h3>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">{dest.label}</p>
                              <p className="text-sm text-slate-400">{dest.desc}</p>
                            </div>
                          </div>

                          <div className="w-full sm:w-auto sm:text-right shrink-0 border-t border-slate-700/50 sm:border-0 pt-3 sm:pt-0 sm:pl-4">
                            {onCooldown ? (
                              <div className="flex flex-col sm:items-end gap-1">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cooldown</div>
                                <div className="font-display text-2xl text-slate-500 tabular-nums flex items-center gap-2">
                                  <Clock className="w-5 h-5" />{Math.floor(cooldown / 60)}:{String(cooldown % 60).padStart(2, '0')}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:items-end gap-1">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Instant Payout</div>
                                <div className={`font-display text-2xl text-glow-green text-green-400 tabular-nums`}>
                                  +$<Num value={warpMoney} decimals={0} />
                                </div>
                                {dest.rushSeconds > 0 && (
                                  <div className="text-xs font-bold text-red-400 flex items-center gap-1 mt-1"><Zap className="w-3 h-3 fill-red-400" />{dest.rushSeconds}s Dinner Rush</div>
                                )}
                                {dest.vipToken && (
                                  <div className="text-xs font-bold text-purple-400 flex items-center gap-1 mt-1"><Crown className="w-3 h-3" />+1 VIP Token (+5% All)</div>
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- TAB: ACHIEVEMENTS --- */}
              {activeTab === 'achievements' && (
                <div className="flex flex-col gap-4">
                   <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-5 mb-2 flex items-center justify-between shadow-inner">
                      <div className="flex items-center gap-3">
                         <Trophy className="w-8 h-8 text-yellow-500" />
                         <div>
                            <h3 className="font-display text-xl text-yellow-100 tracking-widest">Trophy Case</h3>
                            <p className="text-sm text-yellow-500/70 font-bold">Unlocking achievements boosts your pizza price permanently.</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] text-yellow-500/70 font-bold uppercase tracking-widest mb-1">Global Achievement Bonus</div>
                         <div className="font-display text-2xl text-yellow-400 text-glow-yellow tabular-nums">+{unlockedAchievements.length * 2}%</div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ACHIEVEMENTS.map(ach => {
                         const isUnlocked = unlockedAchievements.includes(ach.id);
                         return (
                            <div key={ach.id} className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${isUnlocked ? 'bg-gradient-to-br from-yellow-900/20 to-slate-800 border-yellow-500/30 shadow-[0_0_10px_rgba(250,204,21,0.05)]' : 'bg-slate-900/50 border-slate-700/50 grayscale opacity-60'}`}>
                               <div className={`p-3 rounded-full border shadow-inner shrink-0 ${isUnlocked ? 'bg-yellow-950/60 border-yellow-600/50 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                                  {isUnlocked ? <CheckCircle className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                               </div>
                               <div>
                                  <h3 className={`font-display text-lg tracking-wider leading-tight ${isUnlocked ? 'text-yellow-100' : 'text-slate-400'}`}>{ach.name}</h3>
                                  <p className={`text-xs font-medium mt-1 ${isUnlocked ? 'text-slate-300' : 'text-slate-500'}`}>{ach.desc}</p>
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&display=swap');
        
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }

        .font-display { 
          font-family: 'Oswald', sans-serif; 
          text-transform: uppercase; 
          font-variant-numeric: tabular-nums;
        }
        
        .font-body { 
          font-family: 'Inter', sans-serif; 
          font-variant-numeric: tabular-nums;
        }
        
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