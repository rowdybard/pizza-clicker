import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Analytics } from '@vercel/analytics/react';
import ExecutiveStickerbook from './awards.jsx';
import GlobalProgressBar from './GlobalProgressBar.jsx';
import { 
  Pizza, Car, Store, TrendingUp, TrendingDown, ShoppingCart, 
  DollarSign, ChefHat, Users, Award, Star, Zap, Clock, Building,
  Plane, Rocket, Gem, Crown, Coffee, MousePointerClick, Flame,
  Trophy, Droplets, Sparkles, CheckCircle, Lock, Settings, Save, Download, Upload, AlertTriangle,
  Map, Home, Briefcase, Moon, Mic, MicOff, ScrollText, MapPin, Package, Check
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
  { id: 'first_blood', name: 'Open for Business', desc: 'Every empire begins with a single slice. The Syndicate has taken notice of your first sale.', req: (s) => s.totalPizzasSold >= 1 },
  { id: 'pizza_10k', name: 'Local Legend', desc: 'Your name echoes through the streets. 10,000 pizzas sold. The neighborhood whispers your recipes like sacred texts.', req: (s) => s.totalPizzasSold >= 10000 },
  { id: 'pizza_1m', name: 'Pizza Magnate', desc: 'One million souls fed. Your influence spreads like sauce on dough. The Obsidian Syndicate watches with interest.', req: (s) => s.totalPizzasSold >= 1000000 },
  { id: 'clicker_1k', name: 'Carpal Tunnel', desc: 'Your fingers have become instruments of profit. 1,000 clicks. Each one a prayer to the god of commerce.', req: (s) => s.totalClicks >= 1000 },
  { id: 'combo_max', name: 'On Fire!', desc: 'Time bends to your will. 100x combo achieved. You have touched the edge of what the Syndicate calls "The Flow State."', req: (s) => s.combo >= 100 },
  { id: 'perfect_pull', name: 'Chef\'s Kiss', desc: 'Perfection achieved. The oven reveals its secrets only to those who listen. This is the first step toward mastery.', req: (s) => s.perfectBakes >= 1 },
  { id: 'delivery_first', name: 'Road Trip', desc: 'The first delivery through the time-warped routes. You have glimpsed the temporal network the Syndicate controls.', req: (s) => s.deliveriesCompleted >= 1 },
  { id: 'delivery_10', name: 'Logistics Master', desc: 'Ten journeys through folded space. You begin to understand: the map is not the territory. The territory is whatever you make it.', req: (s) => s.deliveriesCompleted >= 10 },
  { id: 'dispo_sadge', name: 'Scammed Outta Dispo', desc: 'Exactly $13.00. A very specific balance. The Syndicate smiles. You have found the first key hidden in plain sight.', req: (s) => Math.round(s.money * 100) === 1300 },
  { id: 'sellout', name: 'Corporate Sellout', desc: 'You sold your soul for a Franchise License. But was it really yours to begin with? The cycle begins anew.', req: (s) => s.franchiseLicenses > 0 },
  { id: 'billionaire', name: 'Pizza Billionaire', desc: 'One billion dollars. Money is just numbers now. The Syndicate whispers: "This is only the beginning."', req: (s) => s.lifetimeMoney >= 1000000000 },

  // Bank Balance
  { id: 'bank_10k', name: 'Ten Grand', desc: 'Your first real savings. $10,000 in liquid capital. The foundation of something greater.', req: (s) => s.money >= 10000 },
  { id: 'bank_100k', name: 'Six Figures', desc: 'Six figures in the bank. You are no longer playing the game—you are becoming the game.', req: (s) => s.money >= 100000 },
  { id: 'bank_1m', name: 'Liquid Millionaire', desc: 'One million in liquid assets. The weight of wealth changes you. You feel the Syndicate\'s gaze intensify.', req: (s) => s.money >= 1000000 },
  { id: 'bank_1b', name: 'Tres Commas', desc: 'Three commas. A billion dollars sitting idle. At this scale, money becomes a weapon, a tool, a reality unto itself.', req: (s) => s.money >= 1000000000 },
  { id: 'bank_1t', name: 'Trillionaire', desc: 'One trillion dollars. You have transcended economics. The Syndicate nods in approval—you are ready for the Vault.', req: (s) => s.money >= 1000000000000 },

  // Lifetime Earnings
  { id: 'life_10k', name: 'Humble Beginnings', desc: 'Your first $10,000 earned. Every fortune starts somewhere. The Syndicate remembers its own humble origins.', req: (s) => s.lifetimeMoney >= 10000 },
  { id: 'life_10m', name: 'Crust Fund', desc: 'Ten million earned across all timelines. Your legacy grows. The dough rises, as do you.', req: (s) => s.lifetimeMoney >= 10000000 },
  { id: 'life_1t', name: 'Infinite Wealth', desc: 'One trillion earned across all realities. Wealth is no longer a goal—it is a state of being. The Syndicate beckons.', req: (s) => s.lifetimeMoney >= 1000000000000 },

  // Total Pizzas Sold
  { id: 'pizza_100', name: 'Warming Up', desc: 'One hundred pizzas sold. The oven is warm, your hands are steady. This is just the prelude.', req: (s) => s.totalPizzasSold >= 100 },
  { id: 'pizza_100k', name: 'Neighborhood Favorite', desc: 'One hundred thousand pizzas. You are no longer a chef—you are an institution. A pillar of the community.', req: (s) => s.totalPizzasSold >= 100000 },
  { id: 'pizza_10m', name: 'National Chain', desc: 'Ten million pizzas across the nation. Your brand is everywhere. The Syndicate takes note of your expansion.', req: (s) => s.totalPizzasSold >= 10000000 },
  { id: 'pizza_1b', name: 'Global Dominance', desc: 'One billion pizzas sold worldwide. Nations rise and fall on your supply chain. You are no longer in the pizza business—you ARE the pizza business.', req: (s) => s.totalPizzasSold >= 1000000000 },

  // Clicking
  { id: 'click_100', name: 'Finger Stretches', desc: 'One hundred clicks. Your fingers learn the rhythm. Click. Profit. Repeat. The mantra begins.', req: (s) => s.totalClicks >= 100 },
  { id: 'click_10k', name: 'Clicking Machine', desc: 'Ten thousand clicks. You and the pizza are one. The boundary between action and intention dissolves.', req: (s) => s.totalClicks >= 10000 },
  { id: 'click_100k', name: 'The Auto-Clicker', desc: 'One hundred thousand clicks. Are you clicking, or is the universe clicking through you? The Syndicate knows the answer.', req: (s) => s.totalClicks >= 100000 },

  // Combos
  { id: 'combo_10', name: 'Heating Up', desc: 'Ten-click combo. The rhythm accelerates. You feel the heat building, the momentum gathering.', req: (s) => s.combo >= 10 },
  { id: 'combo_50', name: 'Blazing Fast', desc: 'Fifty-click combo. Your hands are a blur. Time itself seems to slow around you. The Syndicate calls this "temporal dilation."', req: (s) => s.combo >= 50 },

  // Perfect Bakes
  { id: 'perfect_10', name: 'Oven Master', desc: 'Ten perfect pizzas. You have learned to read the oven\'s language. Heat, time, and intuition become one.', req: (s) => s.perfectBakes >= 10 },
  { id: 'perfect_50', name: 'Flawless Execution', desc: 'Fifty perfect pizzas. Perfection is no longer luck—it is your default state. The oven obeys your will.', req: (s) => s.perfectBakes >= 50 },

  // Deliveries
  { id: 'delivery_50', name: 'Logistics Expert', desc: 'Fifty deliveries through the warped routes. You navigate the impossible with ease. The Syndicate\'s temporal network is yours to command.', req: (s) => s.deliveriesCompleted >= 50 },
  { id: 'delivery_250', name: 'Worldwide Shipping', desc: 'Two hundred fifty deliveries across space and time. You have mastered the art of being everywhere at once.', req: (s) => s.deliveriesCompleted >= 250 },

  // Reputation
  { id: 'rep_500', name: 'Rising Star', desc: 'Five hundred reputation points. People speak your name with reverence. Your star is ascending.', req: (s) => s.reputation >= 500 },
  { id: 'rep_10k', name: 'Household Name', desc: 'Ten thousand reputation. You are legend. Children dream of your pizzas. The Syndicate sees potential.', req: (s) => s.reputation >= 10000 },

  // Franchise
  { id: 'franchise_5',  name: 'Corporate Board',    desc: 'Five Franchise Licenses. You sit at the table now. The Corporate veil begins to lift, revealing something darker beneath.',   req: (s) => s.franchiseLicenses >= 5  },
  { id: 'franchise_10', name: 'Pizza Conglomerate',  desc: 'Ten Franchise Licenses. Your empire spans realities. Each reset makes you stronger. The Syndicate smiles.',  req: (s) => s.franchiseLicenses >= 10 },
  { id: 'franchise_25', name: 'Global Syndicate',    desc: 'Twenty-five Licenses. You have become what you once feared. The Obsidian Syndicate welcomes you as one of their own.',  req: (s) => s.franchiseLicenses >= 25 },
  { id: 'franchise_50', name: 'Crust Fund',       desc: 'Fifty Licenses. Your wealth compounds across timelines. The Syndicate reveals the first truth: time is a circle.',  req: (s) => s.franchiseLicenses >= 50 },
  { id: 'franchise_100', name: 'Galactic Dominance', desc: 'One hundred Licenses. You control galaxies of franchises. The Syndicate whispers: "You are ready for the Golden Slices."', req: (s) => s.franchiseLicenses >= 100 },
  { id: 'franchise_150', name: 'Universal Control', desc: 'One hundred fifty Licenses. Universes bend to your franchise model. The Syndicate reveals the second truth: reality is negotiable.', req: (s) => s.franchiseLicenses >= 150 },
  { id: 'franchise_200', name: 'Dimensional Overlord', desc: 'Two hundred Licenses. You operate across dimensions. The Syndicate reveals the third truth: you were always one of us.', req: (s) => s.franchiseLicenses >= 200 },
  { id: 'franchise_250', name: 'Pizza God',          desc: 'Two hundred fifty Licenses. The maximum. You have ascended beyond mortal comprehension. The Obsidian Syndicate bows to you—for you ARE the Syndicate.',  req: (s) => s.franchiseLicenses >= 250 },

  // Lifetime earnings — deep progression
  { id: 'life_1q',  name: 'Quadrillionaire',   desc: 'One quadrillion dollars earned. Numbers lose meaning at this scale. The Syndicate nods: "You understand now."',              req: (s) => s.lifetimeMoney >= 1e15  },
  { id: 'life_1qi', name: 'Beyond Counting',   desc: 'One quintillion dollars. Mathematics breaks down. You have transcended the concept of wealth itself. The Vault awaits.',             req: (s) => s.lifetimeMoney >= 1e18  },

  // Pizza volume — long-haul
  { id: 'pizza_10b', name: 'Factory Planet',   desc: 'Ten billion pizzas. Entire planets are dedicated to your production. The Syndicate reveals: this is only one timeline.',                      req: (s) => s.totalPizzasSold >= 1e10 },
  { id: 'pizza_1t',  name: 'Universe Fed',     desc: 'One trillion pizzas. You have fed entire universes. The Syndicate whispers: "Every slice contains a fragment of eternity."',                      req: (s) => s.totalPizzasSold >= 1e12 },

  // Late upgrades
  { id: 'upgrade_wagyu',     name: 'Premium Grade', desc: 'Wagyu beef on pizza. Decadence incarnate. The Syndicate approves of your refined taste for the excessive.',              req: (s) => (s.inventory?.wagyu || 0) >= 1          },
  { id: 'upgrade_antimatter',name: 'Beyond Physics', desc: 'Antimatter crust. You have broken the laws of physics for profit. The Syndicate reveals: reality is just another ingredient.',         req: (s) => (s.inventory?.antimatterCrust || 0) >= 1 },
  { id: 'upgrade_neural',    name: 'Mind Over Pizza', desc: 'Neural interface clicking. Your thoughts become pizzas. The boundary between mind and matter dissolves. The Syndicate smiles.',            req: (s) => (s.inventory?.neuralClicker || 0) >= 1  },

  // Specific Upgrades
  { id: 'upgrade_michelin', name: 'Fine Dining', desc: 'A Michelin Star. The culinary elite recognize your mastery. But the Syndicate knows: stars are just burning gas.', req: (s) => (s.inventory?.michelin || 0) >= 1 },

  // Market Achievements
  { id: 'market_first_trade', name: 'Wall Street Rookie', desc: 'Your first market trade. You have entered the game within the game. The Syndicate controls the market—but you can learn to dance with it.', req: (s) => (s.totalMarketTrades || 0) >= 1 },
  { id: 'market_100_trades', name: 'Day Trader', desc: 'One hundred trades. You read the patterns now. Buy low, sell high. The Syndicate watches your growing understanding.', req: (s) => (s.totalMarketTrades || 0) >= 100 },
  { id: 'market_1k_trades', name: 'Market Veteran', desc: 'One thousand trades. The market is your playground. You manipulate flour prices like a puppet master. The Syndicate nods in approval.', req: (s) => (s.totalMarketTrades || 0) >= 1000 },
  { id: 'market_profit_1m', name: 'Portfolio Manager', desc: 'One million in market profits. You have learned to extract value from chaos itself. The Syndicate reveals: chaos is just order you don\'t understand yet.', req: (s) => (s.marketProfitLifetime || 0) >= 1000000 },
  { id: 'market_big_win', name: 'Diamond Hands', desc: 'One hundred thousand dollars in a single trade. You held when others would fold. The Syndicate whispers: "Diamond hands forge diamond empires."', req: (s) => (s.biggestMarketGain || 0) >= 100000 },
];

// Create file number mapping for each achievement
const ACHIEVEMENT_FILE_NUMBERS = {};
ACHIEVEMENTS.forEach((ach, index) => {
  ACHIEVEMENT_FILE_NUMBERS[ach.id] = String(index + 1).padStart(3, '0');
});

const ACHIEVEMENT_META = {
  first_blood:         { icon: <Pizza className="w-8 h-8" />,             color: 'text-amber-400',   isSecret: false, hint: 'Sell your first pizza' },
  pizza_10k:           { icon: <Pizza className="w-8 h-8" />,             color: 'text-amber-400',   isSecret: false, hint: 'Sell 10,000 pizzas' },
  pizza_1m:            { icon: <Pizza className="w-8 h-8" />,             color: 'text-amber-500',   isSecret: false, hint: 'Sell 1 million pizzas' },
  clicker_1k:          { icon: <MousePointerClick className="w-8 h-8" />, color: 'text-orange-400',  isSecret: false, hint: 'Click 1,000 times' },
  combo_max:           { icon: <Zap className="w-8 h-8" />,               color: 'text-orange-500',  isSecret: false, hint: 'Hit a 100x combo' },
  perfect_pull:        { icon: <Flame className="w-8 h-8" />,             color: 'text-red-400',     isSecret: false, hint: 'Pull a perfect pizza' },
  delivery_first:      { icon: <Car className="w-8 h-8" />,               color: 'text-green-400',   isSecret: false, hint: 'Complete 1 delivery' },
  delivery_10:         { icon: <Car className="w-8 h-8" />,               color: 'text-green-500',   isSecret: false, hint: 'Complete 10 deliveries' },
  dispo_sadge:         { icon: <DollarSign className="w-8 h-8" />,        color: 'text-zinc-400',    isSecret: true,  hint: 'a very specific bank balance awaits you...' },
  sellout:             { icon: <Building className="w-8 h-8" />,          color: 'text-fuchsia-400', isSecret: false, hint: 'Prestige for the first time' },
  billionaire:         { icon: <Crown className="w-8 h-8" />,             color: 'text-yellow-400',  isSecret: false, hint: 'Earn $1B lifetime' },
  bank_10k:            { icon: <DollarSign className="w-8 h-8" />,        color: 'text-green-400',   isSecret: false, hint: 'Save $10,000' },
  bank_100k:           { icon: <DollarSign className="w-8 h-8" />,        color: 'text-green-500',   isSecret: false, hint: 'Save $100,000' },
  bank_1m:             { icon: <DollarSign className="w-8 h-8" />,        color: 'text-emerald-400', isSecret: false, hint: 'Save $1M' },
  bank_1b:             { icon: <DollarSign className="w-8 h-8" />,        color: 'text-emerald-500', isSecret: false, hint: 'Save $1B' },
  bank_1t:             { icon: <Crown className="w-8 h-8" />,             color: 'text-yellow-300',  isSecret: false, hint: 'Save $1T' },
  life_10k:            { icon: <TrendingUp className="w-8 h-8" />,        color: 'text-blue-400',    isSecret: false, hint: 'Earn $10K lifetime' },
  life_10m:            { icon: <TrendingUp className="w-8 h-8" />,        color: 'text-blue-500',    isSecret: false, hint: 'Earn $10M lifetime' },
  life_1t:             { icon: <TrendingUp className="w-8 h-8" />,        color: 'text-sky-400',     isSecret: false, hint: 'Earn $1T lifetime' },
  pizza_100:           { icon: <Pizza className="w-8 h-8" />,             color: 'text-amber-300',   isSecret: false, hint: 'Sell 100 pizzas' },
  pizza_100k:          { icon: <Pizza className="w-8 h-8" />,             color: 'text-amber-400',   isSecret: false, hint: 'Sell 100K pizzas' },
  pizza_10m:           { icon: <Pizza className="w-8 h-8" />,             color: 'text-amber-500',   isSecret: false, hint: 'Sell 10M pizzas' },
  pizza_1b:            { icon: <Pizza className="w-8 h-8" />,             color: 'text-amber-600',   isSecret: false, hint: 'Sell 1B pizzas' },
  click_100:           { icon: <MousePointerClick className="w-8 h-8" />, color: 'text-orange-300',  isSecret: false, hint: 'Click 100 times' },
  click_10k:           { icon: <MousePointerClick className="w-8 h-8" />, color: 'text-orange-400',  isSecret: false, hint: 'Click 10,000 times' },
  click_100k:          { icon: <MousePointerClick className="w-8 h-8" />, color: 'text-orange-500',  isSecret: false, hint: 'Click 100,000 times' },
  combo_10:            { icon: <Zap className="w-8 h-8" />,               color: 'text-orange-300',  isSecret: false, hint: 'Hit a 10x combo' },
  combo_50:            { icon: <Zap className="w-8 h-8" />,               color: 'text-orange-400',  isSecret: false, hint: 'Hit a 50x combo' },
  perfect_10:          { icon: <Flame className="w-8 h-8" />,             color: 'text-red-400',     isSecret: false, hint: 'Pull 10 perfect pizzas' },
  perfect_50:          { icon: <Flame className="w-8 h-8" />,             color: 'text-red-500',     isSecret: false, hint: 'Pull 50 perfect pizzas' },
  delivery_50:         { icon: <Plane className="w-8 h-8" />,             color: 'text-green-400',   isSecret: false, hint: 'Complete 50 deliveries' },
  delivery_250:        { icon: <Rocket className="w-8 h-8" />,            color: 'text-green-500',   isSecret: false, hint: 'Complete 250 deliveries' },
  rep_500:             { icon: <Star className="w-8 h-8" />,              color: 'text-yellow-400',  isSecret: false, hint: 'Gain 500 reputation' },
  rep_10k:             { icon: <Star className="w-8 h-8" />,              color: 'text-yellow-500',  isSecret: false, hint: 'Gain 10K reputation' },
  franchise_5:         { icon: <Building className="w-8 h-8" />,          color: 'text-fuchsia-300', isSecret: false, hint: 'Own 5 licenses' },
  franchise_10:        { icon: <Building className="w-8 h-8" />,          color: 'text-fuchsia-400', isSecret: false, hint: 'Own 10 licenses' },
  franchise_25:        { icon: <Building className="w-8 h-8" />,          color: 'text-fuchsia-500', isSecret: false, hint: 'Own 25 licenses' },
  franchise_50:        { icon: <Gem className="w-8 h-8" />,               color: 'text-fuchsia-400', isSecret: false, hint: 'Own 50 licenses' },
  franchise_100:       { icon: <Crown className="w-8 h-8" />,             color: 'text-purple-400',  isSecret: false, hint: 'Own 100 licenses' },
  franchise_150:       { icon: <Crown className="w-8 h-8" />,             color: 'text-purple-500',  isSecret: false, hint: 'Own 150 licenses' },
  franchise_200:       { icon: <Crown className="w-8 h-8" />,             color: 'text-purple-600',  isSecret: false, hint: 'Own 200 licenses' },
  franchise_250:       { icon: <Crown className="w-8 h-8" />,             color: 'text-yellow-400',  isSecret: true,  hint: 'the pinnacle of corporate dominion...' },
  life_1q:             { icon: <Sparkles className="w-8 h-8" />,          color: 'text-yellow-300',  isSecret: false, hint: 'Earn $1 quadrillion lifetime' },
  life_1qi:            { icon: <Sparkles className="w-8 h-8" />,          color: 'text-yellow-200',  isSecret: true,  hint: 'a number beyond counting awaits...' },
  pizza_10b:           { icon: <Pizza className="w-8 h-8" />,             color: 'text-amber-600',   isSecret: false, hint: 'Sell 10B pizzas' },
  pizza_1t:            { icon: <Pizza className="w-8 h-8" />,             color: 'text-amber-700',   isSecret: true,  hint: 'one trillion slices consumed...' },
  upgrade_wagyu:       { icon: <Award className="w-8 h-8" />,             color: 'text-amber-400',   isSecret: false, hint: 'Buy Wagyu Topping' },
  upgrade_antimatter:  { icon: <Zap className="w-8 h-8" />,               color: 'text-cyan-400',    isSecret: false, hint: 'Buy Antimatter Crust' },
  upgrade_neural:      { icon: <Crown className="w-8 h-8" />,             color: 'text-purple-400',  isSecret: false, hint: 'Buy Neural Clicker' },
  upgrade_michelin:    { icon: <Crown className="w-8 h-8" />,             color: 'text-amber-300',   isSecret: false, hint: 'Buy Michelin Star' },
  market_first_trade:  { icon: <TrendingUp className="w-8 h-8" />,        color: 'text-teal-400',    isSecret: false, hint: 'Execute 1 market trade' },
  market_100_trades:   { icon: <TrendingUp className="w-8 h-8" />,        color: 'text-teal-500',    isSecret: false, hint: 'Execute 100 trades' },
  market_1k_trades:    { icon: <TrendingUp className="w-8 h-8" />,        color: 'text-emerald-400', isSecret: false, hint: 'Execute 1,000 trades' },
  market_profit_1m:    { icon: <DollarSign className="w-8 h-8" />,        color: 'text-green-400',   isSecret: false, hint: 'Earn $1M market profit' },
  market_big_win:      { icon: <Gem className="w-8 h-8" />,               color: 'text-cyan-400',    isSecret: true,  hint: 'a single trade of legendary magnitude...' },
};

const DESTINATIONS = [
  { id: 'suburb',   name: 'Local Suburbs',     warpSeconds: 180,  rushSeconds: 0,  vipToken: false, cooldown: 60,   icon: <Home     className="w-8 h-8 text-green-400"  />, bg: 'from-green-900/20 to-slate-800',  border: 'border-green-500/30',  color: 'text-green-400',  label: '3 Min Idle Drop',             desc: 'Instantly collect 3 minutes of your current idle production.',
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
  { id: 'hyperPress', name: 'Hyper Press', type: 'click', baseCost: 45000000, multi: 1.65, baseValue: 90, reqStars: 3, icon: <Rocket className="text-orange-400" /> },
  { id: 'quantumTap', name: 'Quantum Tap', type: 'click', baseCost: 4000000000, multi: 1.65, baseValue: 600, reqStars: 4, icon: <Zap className="text-orange-400" /> },
  { id: 'neuralClicker', name: 'Neural Clicker', type: 'click', baseCost: 1200000000000, multi: 1.65, baseValue: 4500, reqStars: 5, icon: <Crown className="text-orange-400" /> },
  { id: 'doughRoller', name: 'Auto-Roller', type: 'production', baseCost: 75, multi: 1.18, baseValue: 0.33, reqStars: 0, icon: <ChefHat className="text-blue-400" /> },
  { id: 'lineCook', name: 'Line Cook', type: 'production', baseCost: 450, multi: 1.18, baseValue: 0.8, reqStars: 1, icon: <Users className="text-blue-400" /> },
  { id: 'driver', name: 'Prep Station', type: 'production', baseCost: 2800, multi: 1.18, baseValue: 4, reqStars: 2, icon: <Flame className="text-blue-400" /> },
  { id: 'franchise', name: 'Ghost Kitchen', type: 'production', baseCost: 125000, multi: 1.18, baseValue: 25, reqStars: 3, icon: <Store className="text-blue-400" /> },
  { id: 'drone', name: 'Robo Kitchen', type: 'production', baseCost: 1200000, multi: 1.18, baseValue: 100, reqStars: 4, icon: <Zap className="text-blue-400" /> },
  { id: 'orbital', name: 'Mega Facility', type: 'production', baseCost: 18000000, multi: 1.18, baseValue: 500, reqStars: 5, icon: <Rocket className="text-blue-400" /> },
  { id: 'darkKitchen', name: 'Dark Kitchen Grid', type: 'production', baseCost: 500000000, multi: 1.18, baseValue: 2500, reqStars: 5, icon: <Moon className="text-blue-400" /> },
  { id: 'pizzaMatrix', name: 'Pizza Matrix', type: 'production', baseCost: 90000000000, multi: 1.18, baseValue: 15000, reqStars: 5, icon: <Building className="text-blue-400" /> },
  { id: 'soda', name: 'Soda Combos', type: 'quality', baseCost: 350, multi: 1.72, baseValue: 2.00, reqStars: 0, icon: <Coffee className="text-amber-400" /> },
  { id: 'garlicCrust', name: 'Garlic Crust', type: 'quality', baseCost: 800, multi: 1.72, baseValue: 4.00, reqStars: 1, icon: <Award className="text-amber-400" /> },
  { id: 'premiumMeat', name: 'Premium Meats', type: 'quality', baseCost: 5000, multi: 1.72, baseValue: 8.00, reqStars: 2, icon: <Pizza className="text-amber-400" /> },
  { id: 'woodFire', name: 'Wood-Fired Oven', type: 'quality', baseCost: 200000, multi: 1.72, baseValue: 1.50, reqStars: 3, icon: <Zap className="text-amber-400" /> },
  { id: 'truffles', name: 'Artisan Truffles', type: 'quality', baseCost: 2200000, multi: 1.72, baseValue: 3.75, reqStars: 4, icon: <Gem className="text-amber-400" /> },
  { id: 'michelin', name: 'Michelin Star', type: 'quality', baseCost: 25000000, multi: 1.72, baseValue: 12.00, reqStars: 5, icon: <Crown className="text-amber-400" /> },
  { id: 'wagyu', name: 'Wagyu Topping', type: 'quality', baseCost: 1500000000, multi: 1.72, baseValue: 37.50, reqStars: 5, icon: <Flame className="text-amber-400" /> },
  { id: 'antimatterCrust', name: 'Antimatter Crust', type: 'quality', baseCost: 300000000000, multi: 1.72, baseValue: 225.00, reqStars: 5, icon: <Sparkles className="text-amber-400" /> },
];

const MILESTONES = [10, 25, 50, 100, 250];
const MILESTONE_MULTS_OVERRIDE = [2.5, 2.0, 1.75, 1.5, 1.25];
const STAR_THRESHOLDS = [0, 500, 3000, 15000, 75000, 400000];
const FRANCHISE_BASE_COST = 5e14; // steeper license progression to slow late-game snowballing
const LICENSES_PER_ASCENSION_SLICE = 25;

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

  const licenseFloor   = licenses > 0 ? Math.sqrt(licenses) * 0.5 : 0;
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

const BIG_ABBR_MOD = [
  [1e303,'Ce'],[1e100,'Gg'],[1e63,'Vg'],[1e60,'Nvd'],[1e57,'Otd'],[1e54,'Spd'],
  [1e51,'Sxd'],[1e48,'Qnd'],[1e45,'Qtd'],[1e42,'Trd'],[1e39,'Dud'],[1e36,'Und'],
  [1e33,'Dc'],[1e30,'No'],[1e27,'Oc'],[1e24,'Sp'],[1e21,'Sx'],[1e18,'Qi'],
  [1e15,'Qu'],[1e12,'T'],[1e9,'B'],[1e6,'M'],[1e3,'K'],
];
const fmtMod = (n) => {
  if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return '0';
  const abs = Math.abs(n);
  for (const [thresh, abbr] of BIG_ABBR_MOD) {
    if (abs >= thresh) {
      const num = (n / thresh).toFixed(2);
      return `${num}${abbr}`;
    }
  }
  return n.toFixed(2);
};

const PrestigeModal = React.memo(function PrestigeModal({ snapshot, onDecline, onConfirm }) {
  if (!snapshot) return null;
  const { pendingLicenses: snapPending, franchiseLicenses: snapCurrent } = snapshot;
  const newLics = snapCurrent + snapPending;
  const startCash = 500 * Math.pow(newLics, 2);
  const floorPizzas = Math.sqrt(newLics) * 0.5;
  const floorMoney = floorPizzas * Math.pow(1.25, newLics) * 2.5;
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border-4 border-amber-600/80 rounded-xl p-5 sm:p-10 max-w-lg w-full text-center relative shadow-[0_0_60px_rgba(217,119,6,0.3)]">
        <Building className="w-14 h-14 sm:w-20 sm:h-20 text-amber-500 mx-auto mb-4 sm:mb-6" />
        <h2 className="text-2xl sm:text-4xl text-amber-400 mb-3 sm:mb-4 leading-tight whitespace-normal" style={{fontFamily: 'Playfair Display, serif', fontWeight: 700, letterSpacing: '0.05em'}}>Corporate Buyout</h2>
        <p className="text-amber-200/70 text-base sm:text-lg mb-6 sm:mb-8" style={{fontFamily: 'Playfair Display, serif'}}>Are you certain you wish to sell your establishment to Corporate?</p>
        <div className="bg-black/40 p-6 rounded-lg border-2 border-amber-700/50 mb-8 text-left space-y-4">
          <div className="text-red-300/90 text-base flex items-start gap-3" style={{fontFamily: 'Playfair Display, serif'}}><span className="text-2xl leading-none text-red-400">−</span> <span>All currency, improvements, and standing shall be forfeit.</span></div>
          <div className="text-amber-300 text-base flex items-start gap-3" style={{fontFamily: 'Playfair Display, serif'}}><span className="text-2xl leading-none text-amber-400">+</span> <span>Acquire <span className="text-2xl font-bold tabular-nums">{snapPending}</span> Franchise License{snapPending !== 1 ? 's' : ''} ({newLics} total).</span></div>
          <div className="text-amber-300 text-base flex items-start gap-3" style={{fontFamily: 'Playfair Display, serif'}}><span className="text-2xl leading-none text-amber-400">+</span> <span>Commence next venture with <span className="font-bold tabular-nums">${fmtMod(startCash)}</span> capital.</span></div>
          <div className="text-amber-300 text-base flex items-start gap-3" style={{fontFamily: 'Playfair Display, serif'}}><span className="text-2xl leading-none text-amber-400">+</span> <span>Passive foundation: ~<span className="font-bold tabular-nums">${fmtMod(floorMoney)}</span>/sec prior to enhancements.</span></div>
          <div className="text-amber-300 text-base flex items-start gap-3" style={{fontFamily: 'Playfair Display, serif'}}><span className="text-2xl leading-none text-amber-400">+</span> <span>{fmtMod(1 + newLics * 1.2)}× production/click · {fmtMod(Math.pow(1.25, newLics))}× price multiplier.</span></div>
        </div>
        <div className="flex gap-4">
          <button onClick={onDecline} className="flex-1 py-3 sm:py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-base sm:text-xl rounded-lg border-2 border-zinc-700 hover:border-zinc-600 transition-colors" style={{fontFamily: 'Playfair Display, serif', fontWeight: 600}}>Decline</button>
          <button onClick={onConfirm} className="flex-1 py-3 sm:py-4 bg-amber-700 hover:bg-amber-600 text-zinc-950 text-base sm:text-xl rounded-lg border-2 border-amber-500 hover:border-amber-400 transition-colors shadow-[0_0_20px_rgba(217,119,6,0.4)]" style={{fontFamily: 'Playfair Display, serif', fontWeight: 700}}>Accept Offer</button>
        </div>
      </div>
    </div>
  );
});

const AscensionModal = React.memo(function AscensionModal({ snapshot, onDecline, onConfirm }) {
  if (!snapshot) return null;
  const { sliceGain, licenseCost, remainingLicenses } = snapshot;
  return (
    <div className="fixed inset-0 z-[101] bg-black/95 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border-4 border-yellow-600/80 rounded-xl p-10 max-w-lg w-full text-center relative shadow-[0_0_60px_rgba(161,98,7,0.35)]">
        <Moon className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
        <h2 className="text-4xl text-yellow-400 mb-4 whitespace-nowrap" style={{fontFamily: 'Playfair Display, serif', fontWeight: 700, letterSpacing: '0.05em'}}>Ascension Rite</h2>
        <p className="text-yellow-200/70 text-lg mb-8" style={{fontFamily: 'Playfair Display, serif'}}>Ascend into a hard reset and transmute your Licenses into Golden Slices?</p>
        <div className="bg-black/50 p-6 rounded-lg border-2 border-yellow-700/50 mb-8 text-left space-y-4">
          <div className="text-red-300/90 text-base flex items-start gap-3" style={{fontFamily: 'Playfair Display, serif'}}><span className="text-2xl leading-none text-red-400">−</span> <span>Spend <span className="font-bold tabular-nums">{licenseCost}</span> Franchise License{licenseCost !== 1 ? 's' : ''}.</span></div>
          <div className="text-red-300/90 text-base flex items-start gap-3" style={{fontFamily: 'Playfair Display, serif'}}><span className="text-2xl leading-none text-red-400">−</span> <span>All run progress is wiped: cash, upgrades, reputation, market position, cooldowns, perks, and current run achievements.</span></div>
          <div className="text-yellow-300 text-base flex items-start gap-3" style={{fontFamily: 'Playfair Display, serif'}}><span className="text-2xl leading-none text-yellow-400">+</span> <span>Acquire <span className="text-2xl font-bold tabular-nums">{sliceGain}</span> Golden Slice{sliceGain !== 1 ? 's' : ''} permanently.</span></div>
          <div className="text-yellow-300 text-base flex items-start gap-3" style={{fontFamily: 'Playfair Display, serif'}}><span className="text-2xl leading-none text-yellow-400">+</span> <span>Licenses remaining after Ascension: <span className="font-bold tabular-nums">{remainingLicenses}</span>.</span></div>
          <div className="text-yellow-300 text-base flex items-start gap-3" style={{fontFamily: 'Playfair Display, serif'}}><span className="text-2xl leading-none text-yellow-400">+</span> <span>Lifetime totals, Golden Slices, and remaining Licenses are preserved.</span></div>
        </div>
        <div className="flex gap-4">
          <button onClick={onDecline} className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xl rounded-lg border-2 border-zinc-700 hover:border-zinc-600 transition-colors" style={{fontFamily: 'Playfair Display, serif', fontWeight: 600}}>Decline</button>
          <button onClick={onConfirm} className="flex-1 py-4 bg-yellow-700 hover:bg-yellow-600 text-zinc-950 text-xl rounded-lg border-2 border-yellow-500 hover:border-yellow-400 transition-colors shadow-[0_0_20px_rgba(161,98,7,0.4)]" style={{fontFamily: 'Playfair Display, serif', fontWeight: 700}}>Ascend</button>
        </div>
      </div>
    </div>
  );
});


export default function App() {
  // --- EMERGENCY UNLOCK EFFECT ---
  useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.touchAction = 'manipulation';
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
  const [ascensionSpentLicenses, setAscensionSpentLicenses] = useState(safeNum(initialData?.ascensionSpentLicenses, 0));
  const [syndicatePerks, setSyndicatePerks] = useState(() => ({
    shadowCapital:    initialData?.syndicatePerks?.shadowCapital    ?? false,
    quantumOven:      initialData?.syndicatePerks?.quantumOven      ?? false,
    insiderTrading:   initialData?.syndicatePerks?.insiderTrading   ?? false,
    autoArm:          initialData?.syndicatePerks?.autoArm          ?? false,
    goldenPowerCount: initialData?.syndicatePerks?.goldenPowerCount ?? 0,
    realityBend:      initialData?.syndicatePerks?.realityBend      ?? false,
    goldenTouch:      initialData?.syndicatePerks?.goldenTouch      ?? false,
    pizzaSingularity: initialData?.syndicatePerks?.pizzaSingularity ?? false,
    infiniteOven:     initialData?.syndicatePerks?.infiniteOven     ?? false,
    ascension:        initialData?.syndicatePerks?.ascension        ?? false,
    timeLoop:         initialData?.syndicatePerks?.timeLoop         ?? false,
    marketGod:        initialData?.syndicatePerks?.marketGod        ?? false,
  }));

  // --- MARKET STATE ---
  const [marketUnlocked, setMarketUnlocked] = useState(initialData?.marketUnlocked || false);
  const [marketShares, setMarketShares] = useState(initialData?.marketShares || { flour: 0, cheese: 0, pepperoni: 0, truffles: 0 });
  const [marketPrices, setMarketPrices] = useState(initialData?.marketPrices || { flour: 15, cheese: 60, pepperoni: 250, truffles: 1200 });
  const [marketTrends, setMarketTrends] = useState({ flour: 1, cheese: 1, pepperoni: 1, truffles: 1 });
  const [portfolioDelta, setPortfolioDelta] = useState(initialData?.portfolioDelta ?? null);
  const [marketCostBasis, setMarketCostBasis] = useState(initialData?.marketCostBasis || { flour: 0, cheese: 0, pepperoni: 0, truffles: 0 });
  const [marketHistory, setMarketHistory] = useState(initialData?.marketHistory || { flour: Array(20).fill(15), cheese: Array(20).fill(60), pepperoni: Array(20).fill(250), truffles: Array(20).fill(1200) });
  const [totalMarketTrades, setTotalMarketTrades] = useState(initialData?.totalMarketTrades || 0);
  const [marketProfitLifetime, setMarketProfitLifetime] = useState(initialData?.marketProfitLifetime || 0);
  const [biggestMarketGain, setBiggestMarketGain] = useState(initialData?.biggestMarketGain || 0);

  // --- MODAL STATE ---
  const [corpOfficeOpen, setCorpOfficeOpen] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [buyMultiplier, setBuyMultiplier] = useState(1); // Can be 1, 5, 10, 'custom', or 'MAX' (locked at value when selected)
  const [customBuyAmount, setCustomBuyAmount] = useState(100); // Custom buy amount
  
  // Global Network Sync Engine
  const [globalPizzas, setGlobalPizzas] = useState(0);
  const pendingProduction = useRef(0);
  const lastSyncTime = useRef(0);
  const lastPollTime = useRef(0);

  // --- SPECIAL DELIVERY STATE ---
  const [specialDelivery, setSpecialDelivery] = useState(null);
  const [deliveryGame, setDeliveryGame] = useState(null);
  const calculateCost = (baseCost, ownedCount) => Math.floor(baseCost * Math.pow(1.15, ownedCount));

  const calculateBulkCost = (baseCost, currentCount, amount) => {
    let totalCost = 0;
    for (let i = 0; i < amount; i++) totalCost += calculateCost(baseCost, currentCount + i);
    return totalCost;
  };

  const calculateMaxAffordable = (baseCost, currentCount, balance, maxPurchases = Infinity) => {
    let cost = 0;
    let amount = 0;
    while (amount < maxPurchases) {
      const nextCost = calculateCost(baseCost, currentCount + amount);
      if (balance >= cost + nextCost) {
        cost += nextCost;
        amount++;
      } else {
        break;
      }
    }
    return { amount, cost };
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
  const [prestigeSnapshot, setPrestigeSnapshot] = useState(null);
  const [showAscensionModal, setShowAscensionModal] = useState(false);
  const [ascensionSnapshot, setAscensionSnapshot] = useState(null);
  const prestigeSnapshotRef = useRef(null);
  const ascensionSnapshotRef = useRef(null);
  const [bakeState, setBakeState] = useState('idle'); // 'idle' | 'pressed' | 'flash'
  const bakeTimerRef = useRef(null);
  const [particles, setParticles] = useState([]);
  const [pressStyle, setPressStyle] = useState({ tiltX: 0, tiltY: 0, parallaxX: 0, parallaxY: 0 });
  const [isPressed, setIsPressed] = useState(false);
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

  // --- DERIVED STATS MATH ---
  const prestigeStarScale = Math.min(2.0, 1 + (franchiseLicenses * 0.15));
  const scaledStarThresholds = STAR_THRESHOLDS.map((t, i) => i === 0 ? 0 : Math.floor(t * prestigeStarScale));
  const starLevel = scaledStarThresholds.filter(t => reputation >= t).length - 1;
  const nextStarReq = scaledStarThresholds[starLevel + 1] || scaledStarThresholds[scaledStarThresholds.length - 1];
  const latestRevealInputsRef = useRef({ money, inventory, starLevel });
  latestRevealInputsRef.current = { money, inventory, starLevel };

  // --- UPGRADE REVEAL EFFECT ---
  useEffect(() => {
    const capturedMoney = money;
    const capturedInventory = inventory;
    const capturedStarLevel = starLevel;

    setRevealedUpgrades(prev => {
      const latest = latestRevealInputsRef.current;
      if (
        !latest ||
        latest.money !== capturedMoney ||
        latest.inventory !== capturedInventory ||
        latest.starLevel !== capturedStarLevel
      ) {
        return prev;
      }

      const next = new Set(prev);
      ['click','production','quality'].forEach(type => {
        const path = UPGRADES.filter(u => u.type === type);
        path.forEach((upgrade, idx) => {
          if (idx === 0) { next.add(upgrade.id); return; }
          const prev_upgrade = path[idx - 1];
          const prevCount = safeNum(inventory?.[prev_upgrade.id], 0);
          const cost = calculateCost(upgrade.baseCost, safeNum(inventory?.[upgrade.id], 0));
          if (prevCount >= 1 && money >= cost * 0.8 && starLevel >= upgrade.reqStars) {
            next.add(upgrade.id);
          }
        });
      });
      return next;
    });
  // eslint-disable-next-line
  }, [money, inventory, starLevel]);

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
  const effectiveEarnableLicenses = Math.max(0, totalEarnableLicenses - ascensionSpentLicenses);
  const pendingLicenses = Math.max(0, effectiveEarnableLicenses - franchiseLicenses);
  const affordableAscensionSlices = Math.floor(franchiseLicenses / LICENSES_PER_ASCENSION_SLICE);
  const ascensionLicenseCost = affordableAscensionSlices * LICENSES_PER_ASCENSION_SLICE;
  const hasVaultProgress = goldenSlices > 0 || Object.values(syndicatePerks).some(Boolean);
  const canAccessVaultTab = hasVaultProgress;
  const canExchangeLicensesForSlice = affordableAscensionSlices > 0;
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
  
  // Ascension perk: clicks gain +10% of idle production rate (uses franchisedProduction to avoid forward reference)
  const synergisticClickBonus = syndicatePerks.ascension ? franchisedProduction * 0.10 : 0;
  const franchisedClick = (baseClickPower + synergisticClickBonus) * franchiseMultiplier * starPowerMultiplier * vipTokenMultiplier * goldenPowerMult;
  
  const productionRate = isRush ? franchisedProduction * 2 : franchisedProduction;
  const pizzaPrice = isRush ? franchisedPrice * 1.25 : franchisedPrice;
  const currentClickPower = franchisedClick * (isClean ? 2 : 1) * comboMultiplier * frenzyMultiplier; 
  const clickMultiplierForGlow = (isClean ? 2 : 1) * comboMultiplier * frenzyMultiplier;
  const clickGlowStrength = Math.min(1, Math.max(0, (clickMultiplierForGlow - 1) / 5));
  const bankBalanceGlowStyle = {
    textShadow: isRush
      ? `0 0 ${8 + clickGlowStrength * 12}px rgba(248, 113, 113, ${0.35 + clickGlowStrength * 0.45}), 0 0 ${16 + clickGlowStrength * 18}px rgba(239, 68, 68, ${0.2 + clickGlowStrength * 0.35})`
      : `0 0 ${8 + clickGlowStrength * 12}px rgba(250, 204, 21, ${0.35 + clickGlowStrength * 0.45}), 0 0 ${16 + clickGlowStrength * 18}px rgba(249, 115, 22, ${0.2 + clickGlowStrength * 0.35})`,
    transition: 'text-shadow 120ms linear',
  };
  
  const idlePizzasPerSec = productionRate;
  const activePizzasPerSec = smoothCps * currentClickPower;
  const totalDisplayPizzasPerSec = idlePizzasPerSec + activePizzasPerSec;
  
  const idleProfitPerSec = idlePizzasPerSec * pizzaPrice * goldenTouchMult;
  const activeProfitPerSec = activePizzasPerSec * pizzaPrice * goldenTouchMult;
  const displayProfitPerSec = idleProfitPerSec + activeProfitPerSec;

  const getCost = (upgrade) => calculateCost(upgrade.baseCost, safeNum(inventory?.[upgrade.id], 0));

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

  const handleBakePress = (e) => {
    if (e.type?.includes('touch') && e.cancelable) {
      e.preventDefault();
    }
    playSound('pop');
    setBakeState('pressed');
    setIsPressed(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches?.[0]?.clientX ?? rect.left + rect.width / 2);
    const clientY = e.clientY ?? (e.touches?.[0]?.clientY ?? rect.top + rect.height / 2);
    const rawX = ((clientX - rect.left) / rect.width - 0.5) * 2;
    const rawY = ((clientY - rect.top) / rect.height - 0.5) * 2;
    const tiltY = Math.sign(rawX) * Math.pow(Math.abs(rawX), 0.9) * 15;
    const tiltX = -Math.sign(rawY) * Math.pow(Math.abs(rawY), 0.9) * 15;
    setPressStyle({ tiltX, tiltY, parallaxX: rawX * 0.08 * rect.width * 0.5, parallaxY: rawY * 0.08 * rect.height * 0.5 });
    // Click spark particles intentionally disabled; keep core click/press engine unchanged.
  };

  const handleBakeRelease = () => {
    setIsPressed(false);
    setBakeState('flash');
    setPressStyle({ tiltX: 0, tiltY: 0, parallaxX: 0, parallaxY: 0 });
    if (bakeTimerRef.current) clearTimeout(bakeTimerRef.current);
    bakeTimerRef.current = setTimeout(() => setBakeState('idle'), 80);
  };

  // --- CORE ACTIONS ---
  const handleBakeAndBox = (e) => {
    const moneyEarned = pizzaPrice * currentClickPower;
    const reputationEarned = Math.max(1, Math.ceil(Math.pow(currentClickPower, 0.6) * 0.35));

    setMoney(prev => prev + moneyEarned);
    setLifetimeMoney(prev => prev + moneyEarned);
    setTotalPizzasSold(prev => prev + currentClickPower);
    setReputation(prev => prev + reputationEarned);
    setTotalClicks(prev => prev + 1);
    
    // Add to pending production for global sync
    pendingProduction.current += currentClickPower;
    
    // Save to localStorage as backup for mobile
    const backupData = {
      pendingPizzas: pendingProduction.current,
      timestamp: Date.now()
    };
    localStorage.setItem('pizzaGlobalSyncBackup', JSON.stringify(backupData));
    
    // Immediate sync for every click to minimize mobile loss
    syncWithGlobalSyndicate();
    
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
    setClickPopups(prev => { const next = [...prev, { id: now + Math.random(), x, y, value: fmt(moneyEarned), expiresAt: now + 1000 }]; return next.length > 25 ? next.slice(next.length - 25) : next; });
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
    
    const totalCost = calculateBulkCost(upgrade.baseCost, currentCount, actualPurchases);
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
      const WARP_CAP = 1e8;
      const ips = engineRefs.current.idleProfitPerSec;
      const efficiency = ips <= WARP_CAP ? 1.0 : 1.0 / (1 + Math.log10(ips / WARP_CAP));
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

    const WARP_CAP = 1e8; // softcap threshold: $100M/sec idle
    const warpEfficiency = idleProfitPerSec <= WARP_CAP ? 1.0 : 1.0 / (1 + Math.log10(idleProfitPerSec / WARP_CAP));
    const warpMoney = idleProfitPerSec * dest.warpSeconds * warpEfficiency;
    const warpPizzas = idlePizzasPerSec * dest.warpSeconds * warpEfficiency;

    setMoney(m => m + warpMoney);
    setLifetimeMoney(m => m + warpMoney);
    pushLog('delivery', `🚗 Delivery — ${dest.name}`, warpMoney);
    setTotalPizzasSold(tp => tp + warpPizzas);
    
    // Add to pending production for global sync
    pendingProduction.current += warpPizzas;

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

  const confirmPrestige = useCallback(() => {
    const snap = prestigeSnapshotRef.current;
    if (!snap) return;
    const newLicenses = snap.franchiseLicenses + snap.pendingLicenses;
    setFranchiseLicenses(newLicenses);
    const licenseStartMoney = 500 * Math.pow(newLicenses, 2);
    setMoney(prev => Math.max(syndicatePerks.shadowCapital ? 100000 : 0, licenseStartMoney));
    setReputation(0); setTotalPizzasSold(0); setRushTimeLeft(0); setVipTimeLeft(0);
    setVipSpawned(false); setSideOrder(null); setCombo(0); setDeliveryCooldowns({});
    setInventory({});
    const prestigeDefaultRevealed = new Set();
    ['click', 'production', 'quality'].forEach(type => {
      const first = UPGRADES.find(u => u.type === type);
      if (first) prestigeDefaultRevealed.add(first.id);
    });
    setRevealedUpgrades(prestigeDefaultRevealed);
    pushLog('spend', `🏢 Prestige +${snap.pendingLicenses} License${snap.pendingLicenses > 1 ? 's' : ''}`, 0);
    setShowPrestigeModal(false);
  }, [syndicatePerks.shadowCapital, pushLog]);

  const usePrestigeDecline = useCallback(() => setShowPrestigeModal(false), []);

  const openAscensionModal = useCallback(() => {
    const sliceGain = Math.floor(franchiseLicenses / LICENSES_PER_ASCENSION_SLICE);
    if (sliceGain <= 0) return;
    const licenseCost = sliceGain * LICENSES_PER_ASCENSION_SLICE;
    const snap = {
      sliceGain,
      licenseCost,
      remainingLicenses: franchiseLicenses - licenseCost,
    };
    setAscensionSnapshot(snap);
    ascensionSnapshotRef.current = snap;
    setShowAscensionModal(true);
  }, [franchiseLicenses]);

  const confirmAscension = useCallback(() => {
    const snap = ascensionSnapshotRef.current;
    if (!snap) return;

    const defaultRevealed = new Set();
    ['click', 'production', 'quality'].forEach(type => {
      const first = UPGRADES.find(u => u.type === type);
      if (first) defaultRevealed.add(first.id);
    });

    // Hard prestige: preserve only lifetime totals, licenses, golden slices, and ascension spend history.
    setMoney(0);
    setReputation(0);
    setInventory({});
    setUnlockedAchievements([]);
    setCombo(0);
    setComboDecayTimer(0);
    setSmoothCps(0);
    setRecentCps(0);
    clickTimestampsRef.current = [];
    setVipTokens(0);
    setDeliveryCooldowns({});
    setSyndicatePerks({ shadowCapital: false, quantumOven: false, insiderTrading: false, autoArm: false, goldenPowerCount: 0, realityBend: false, goldenTouch: false, pizzaSingularity: false, infiniteOven: false, ascension: false, timeLoop: false, marketGod: false });
    setMarketUnlocked(false);
    setMarketShares({ flour: 0, cheese: 0, pepperoni: 0, truffles: 0 });
    setMarketPrices({ flour: 15, cheese: 60, pepperoni: 250, truffles: 1200 });
    setMarketTrends({ flour: 1, cheese: 1, pepperoni: 1, truffles: 1 });
    setPortfolioDelta(null);
    setMarketCostBasis({ flour: 0, cheese: 0, pepperoni: 0, truffles: 0 });
    setMarketHistory({ flour: Array(20).fill(15), cheese: Array(20).fill(60), pepperoni: Array(20).fill(250), truffles: Array(20).fill(1200) });
    setCorpOfficeOpen(false);
    setSpecialDelivery(null);
    setDeliveryGame(null);
    setMoneyLog([]);
    pendingClickRef.current = { total: 0, count: 0, lastFlush: Date.now() };
    setMarketCrashBanner(false);
    setInstantCashPopup(null);
    setMarketCooldowns({ rumors: 0, squeeze: 0 });
    setManipTarget('flour');
    setActiveTab('upgrades');
    setAchievementToasts([]);
    setClickPopups([]);
    setRushTimeLeft(0);
    setVipTimeLeft(0);
    setVipSpawned(false);
    setSideOrder(null);
    setCleanBoostTimer(0);
    setShowPrestigeModal(false);
    setPrestigeSnapshot(null);
    prestigeSnapshotRef.current = null;
    setBakeState('idle');
    setParticles([]);
    setPressStyle({ tiltX: 0, tiltY: 0, parallaxX: 0, parallaxY: 0 });
    setIsPressed(false);
    setShowParchmentModal(false);
    setShowSettings(false);
    setImportText('');
    setShowWipeConfirm(false);
    setHudSettingsOpen(false);
    setUpgradeFilter('all');
    setStatsOpen({ production: true, clicking: false, lifetime: false, prestige: false, owned: false });
    setRevealedUpgrades(defaultRevealed);

    setFranchiseLicenses(prev => Math.max(0, prev - snap.licenseCost));
    setAscensionSpentLicenses(prev => prev + snap.licenseCost);
    setGoldenSlices(prev => prev + snap.sliceGain);
    pushLog('spend', `🌙 Ascension exchange: -${snap.licenseCost} Licenses, +${snap.sliceGain} Golden Slice${snap.sliceGain !== 1 ? 's' : ''}`, 0);
    ascensionSnapshotRef.current = null;
    setAscensionSnapshot(null);
    setShowAscensionModal(false);
  }, [pushLog]);

  const declineAscension = useCallback(() => setShowAscensionModal(false), []);

  // --- GLOBAL NETWORK SYNC ENGINE ---
  const syncWithGlobalSyndicate = useCallback(async () => {
    const amountToSend = Math.floor(pendingProduction.current);
    
    console.log('Sync attempt - pending pizzas:', amountToSend);
    
    if (amountToSend <= 0) {
      console.log('No pending pizzas to sync');
      return;
    }
    
    try {
      // Use correct API URL based on environment
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5173/api/global-stats'
        : '/api/global-stats';
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: amountToSend }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Sync response:', data);
        if (data.success) {
          // CRITICAL: Only subtract after successful response
          pendingProduction.current -= amountToSend;
          setGlobalPizzas(data.total);
          lastSyncTime.current = Date.now();
          
          console.log('Sync successful - sent', amountToSend, 'pizzas, new total:', data.total);
          
          // Log different response types
          if (data.mock) {
            console.warn('Using mock KV data - environment variables not configured');
          } else if (data.cached && data.estimated) {
            console.warn('Using estimated total (Redis down):', data.total);
          } else if (data.cached) {
            console.warn('Using cached total:', data.total);
          } else {
            console.log('Real Redis data - global total updated:', data.total);
          }
        } else {
          console.warn('Sync failed - success false:', data);
        }
      } else {
        console.warn('Sync failed - HTTP error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error syncing with global syndicate:', error);
      // Don't subtract on error - keep for retry
    }
  }, []);

  // Poll global stats to keep fresh
  const pollGlobalStats = useCallback(async () => {
    const now = Date.now();
    
    // Only poll every 15 seconds and only if idle (no recent production)
    if (now - lastPollTime.current < 15000 || pendingProduction.current > 0) return;
    
    try {
      // Use correct API URL based on environment
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5173/api/global-stats'
        : '/api/global-stats';
        
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGlobalPizzas(data.total);
          lastPollTime.current = now;
          
          // Log different response types
          if (data.mock) {
            console.warn('Poll - Using mock KV data');
          } else if (data.cached) {
            console.warn('Poll - Using cached total:', data.total);
          } else {
            console.log('Poll - Real Redis data:', data.total);
          }
        }
      }
    } catch (error) {
      console.error('Error polling global stats:', error);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    const fetchInitialStats = async () => {
      try {
        // Use correct API URL based on environment
        const apiUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:5173/api/global-stats'
          : '/api/global-stats';
          
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
                    if (data.success) {
            setGlobalPizzas(data.total);
            
            // Log different response types
            if (data.mock) {
              console.warn('Initial - Using mock KV data');
            } else if (data.cached) {
              console.warn('Initial - Using cached total:', data.total);
            } else {
              console.log('Initial - Real Redis data:', data.total);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching initial global stats:', error);
      }
    };
    
    fetchInitialStats();
    
    // Add offline pizzas to global sync
    if (_offlineCalc.report?.pizzasEarned > 0) {
      const offlinePizzas = Math.floor(_offlineCalc.report.pizzasEarned);
      pendingProduction.current += offlinePizzas;
      console.log('Added offline pizzas to global sync:', offlinePizzas);
      console.log('Offline report details:', _offlineCalc.report);
      
      // Always sync offline pizzas immediately, regardless of amount
      setTimeout(() => {
        console.log('Triggering immediate offline sync...');
        syncWithGlobalSyndicate();
      }, 500); // Shorter delay for faster sync
    } else {
      console.log('No offline pizzas to sync');
    }
    
    // Check for localStorage backup from mobile session
    const backupData = localStorage.getItem('pizzaGlobalSyncBackup');
    if (backupData) {
      try {
        const parsed = JSON.parse(backupData);
        const now = Date.now();
        const ageMinutes = (now - parsed.timestamp) / (1000 * 60);
        
        // Only use backup if it's less than 10 minutes old
        if (ageMinutes < 10 && parsed.pendingPizzas > 0) {
          console.log('Found localStorage backup -', parsed.pendingPizzas, 'pizzas from', ageMinutes.toFixed(1), 'minutes ago');
          pendingProduction.current += parsed.pendingPizzas;
          
          // Clear the backup after using it
          localStorage.removeItem('pizzaGlobalSyncBackup');
          
          // Sync immediately
          setTimeout(() => {
            console.log('Triggering backup sync...');
            syncWithGlobalSyndicate();
          }, 500);
        } else {
          console.log('localStorage backup too old or empty, clearing...');
          localStorage.removeItem('pizzaGlobalSyncBackup');
        }
      } catch (error) {
        console.error('Error parsing localStorage backup:', error);
        localStorage.removeItem('pizzaGlobalSyncBackup');
      }
    } else {
      console.log('No localStorage backup found');
    }
    
    // Check for production state recovery (when app was minimized)
    const productionState = localStorage.getItem('pizzaProductionState');
    if (productionState) {
      try {
        const parsed = JSON.parse(productionState);
        const now = Date.now();
        const timeSinceLastSave = (now - parsed.timestamp) / 1000; // seconds
        
        // If it's been more than 5 seconds, we were probably minimized
        if (timeSinceLastSave > 5 && parsed.idlePizzasPerSec > 0) {
          const missingPizzas = parsed.idlePizzasPerSec * timeSinceLastSave;
          console.log('App was minimized for', timeSinceLastSave.toFixed(1), 'seconds');
          console.log('Calculating missing production:', missingPizzas.toFixed(1), 'pizzas');
          
          pendingProduction.current += missingPizzas;
          
          // Clear the production state after recovery
          localStorage.removeItem('pizzaProductionState');
          
          // Sync immediately
          setTimeout(() => {
            console.log('Triggering production recovery sync...');
            syncWithGlobalSyndicate();
          }, 500);
        } else {
          console.log('Production state is recent or no production, clearing...');
          localStorage.removeItem('pizzaProductionState');
        }
      } catch (error) {
        console.error('Error parsing production state:', error);
        localStorage.removeItem('pizzaProductionState');
      }
    } else {
      console.log('No production state found');
    }
    
    // Check for emergency backup (last resort recovery)
    const emergencyBackup = localStorage.getItem('pizzaEmergencyBackup');
    if (emergencyBackup) {
      try {
        const parsed = JSON.parse(emergencyBackup);
        const now = Date.now();
        const ageMinutes = (now - parsed.timestamp) / (1000 * 60);
        
        // Only use emergency backup if it's less than 5 minutes old
        if (ageMinutes < 5 && parsed.pendingPizzas > 0) {
          console.log('Found emergency backup -', parsed.pendingPizzas, 'pizzas from', ageMinutes.toFixed(1), 'minutes ago');
          pendingProduction.current += parsed.pendingPizzas;
          
          // Clear the emergency backup after using it
          localStorage.removeItem('pizzaEmergencyBackup');
          
          // Sync immediately
          setTimeout(() => {
            console.log('Triggering emergency backup sync...');
            syncWithGlobalSyndicate();
          }, 500);
        } else {
          console.log('Emergency backup too old or empty, clearing...');
          localStorage.removeItem('pizzaEmergencyBackup');
        }
      } catch (error) {
        console.error('Error parsing emergency backup:', error);
        localStorage.removeItem('pizzaEmergencyBackup');
      }
    } else {
      console.log('No emergency backup found');
    }
  }, [syncWithGlobalSyndicate, _offlineCalc]);

  // Continuous production state saving for mobile reliability
  useEffect(() => {
    const saveInterval = setInterval(() => {
      const now = Date.now();
      const state = {
        pendingPizzas: pendingProduction.current,
        idlePizzasPerSec: engineRefs.current.idlePizzasPerSec,
        timestamp: now,
        lastSaveTime: engineRefs.current.lastGlobalSyncSave
      };
      localStorage.setItem('pizzaProductionState', JSON.stringify(state));
      engineRefs.current.lastGlobalSyncSave = now;
    }, 2000); // Save every 2 seconds

    return () => clearInterval(saveInterval);
  }, []);

  // Sync Loop - every 300ms for maximum robustness
  useEffect(() => {
    const syncInterval = setInterval(() => {
      syncWithGlobalSyndicate();
    }, 300); // Sync every 300ms for maximum reliability

    return () => clearInterval(syncInterval);
  }, [syncWithGlobalSyndicate]);

  // Polling Loop - every 10 seconds for fresher data
  useEffect(() => {
    const pollInterval = setInterval(() => {
      pollGlobalStats();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [pollGlobalStats]);

  // Force sync on page unload and visibility change
  useEffect(() => {
    const forceSyncAll = async () => {
      const amountToSend = Math.floor(pendingProduction.current);
      console.log('Force sync attempt - pending pizzas:', amountToSend);
      
      if (amountToSend > 0) {
        try {
          const apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:5173/api/global-stats'
            : '/api/global-stats';
            
          // Try multiple times for robustness
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amountToSend }),
                // Use keepalive for better reliability during page unload
                keepalive: true,
                // Short timeout for mobile reliability
                signal: AbortSignal.timeout(2000)
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log('Force sync successful - sent', amountToSend, 'pizzas, new total:', data.total);
                pendingProduction.current -= amountToSend;
                setGlobalPizzas(data.total);
                return; // Success, exit retry loop
              } else {
                console.warn('Force sync attempt', attempt, 'failed:', response.status);
                if (attempt === 3) {
                  // Save to localStorage as last resort
                  const emergencyBackup = {
                    pendingPizzas: amountToSend,
                    timestamp: Date.now(),
                    emergency: true
                  };
                  localStorage.setItem('pizzaEmergencyBackup', JSON.stringify(emergencyBackup));
                  console.log('Emergency backup saved to localStorage');
                }
              }
            } catch (attemptError) {
              console.error('Force sync attempt', attempt, 'error:', attemptError);
              if (attempt === 3) {
                // Save to localStorage as last resort
                const emergencyBackup = {
                  pendingPizzas: amountToSend,
                  timestamp: Date.now(),
                  emergency: true
                };
                localStorage.setItem('pizzaEmergencyBackup', JSON.stringify(emergencyBackup));
                console.log('Emergency backup saved to localStorage due to error');
              }
            }
            
            // Brief delay between retries
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } catch (error) {
          console.error('All force sync attempts failed:', error);
          // Final emergency backup
          const emergencyBackup = {
            pendingPizzas: amountToSend,
            timestamp: Date.now(),
            emergency: true
          };
          localStorage.setItem('pizzaEmergencyBackup', JSON.stringify(emergencyBackup));
          console.log('Final emergency backup saved to localStorage');
        }
      } else {
        console.log('No pending pizzas to force sync');
      }
    };

    const handleBeforeUnload = (e) => {
      // Sync immediately when page is unloading
      forceSyncAll();
      // Don't show confirmation dialog - just sync
      e.preventDefault = undefined;
    };

    const handleVisibilityChange = () => {
      // Sync when page becomes hidden (app closed, tab switched, etc.)
      if (document.hidden) {
        console.log('Page hidden, triggering force sync...');
        forceSyncAll();
      }
    };

    const handlePageHide = (e) => {
      // This is more reliable for mobile apps
      console.log('Page hide event, triggering force sync...');
      forceSyncAll();
    };

    const handleBlur = (e) => {
      // When window loses focus (app switching, etc.)
      console.log('Window blur event, triggering force sync...');
      forceSyncAll();
    };

    const handleFocus = (e) => {
      // When window regains focus
      console.log('Window focus event - resumed game');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

// --- SETTINGS ACTIONS ---
  const handleExportSave = () => {
    const data = { 
       money, totalPizzasSold, reputation, lifetimeMoney, franchiseLicenses, inventory, 
       totalClicks, perfectBakes, unlockedAchievements, deliveriesCompleted, vipTokens,
       marketUnlocked, marketShares, totalMarketTrades, marketProfitLifetime, biggestMarketGain, goldenSlices, ascensionSpentLicenses, syndicatePerks, marketCooldowns, manipTarget, deliveryCooldowns, revealedUpgrades: Array.from(revealedUpgrades)
    };
    navigator.clipboard.writeText(btoa(JSON.stringify(data)));
    alert("Save code copied to clipboard!");
  };

  const handleImportSave = () => {
    if (importText.trim().toLowerCase() === 'breakthegame') {
      setMoney(1e18);
      setLifetimeMoney(1e18);
      setFranchiseLicenses(50);
      setGoldenSlices(500);
      setTotalPizzasSold(1e12);
      setReputation(99999);
      setAscensionSpentLicenses(25);
      setMarketUnlocked(true);
      setVipTokens(20);
      setRevealedUpgrades(new Set(UPGRADES.map(u => u.id)));
      setShowSettings(false);
      setImportText('');
      return;
    }
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
        if (decoded.ascensionSpentLicenses !== undefined) setAscensionSpentLicenses(safeNum(decoded.ascensionSpentLicenses));
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
       marketUnlocked, marketShares, totalMarketTrades, marketProfitLifetime, biggestMarketGain, goldenSlices, ascensionSpentLicenses, syndicatePerks, marketCooldowns, manipTarget, deliveryCooldowns, revealedUpgrades: Array.from(revealedUpgrades), lastSaveTime: Date.now() 
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    alert("Game saved successfully!");
  };

  const idleLogTickRef = useRef(0);
  const autoArmTickRef = useRef(0);
  const pushLogRef = useRef(null);
  useEffect(() => { pushLogRef.current = pushLog; }, [pushLog]);

  // --- HIGH PERFORMANCE ENGINE REF CACHING ---
  const engineRefs = useRef({
      idleProfitPerSec: 0, idlePizzasPerSec: 0, idleRepPerSec: 0,
      lastClickTime: Date.now(), clicksThisSecond: 0,
      rushTimeLeft: 0, vipSpawned: false, hasStarted: false,
      clickTimestamps: [], // ring buffer for rolling CPS
      syndicatePerks: { shadowCapital: false, quantumOven: false, insiderTrading: false, autoArm: false },
      currentClickPower: 1, pizzaPrice: 2.5, idleClickMoney: 0, marketUnlocked: false,
      lastGlobalSyncSave: Date.now(), // Track when we last saved global sync state
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
      engineRefs.current.marketUnlocked = marketUnlocked;
  }, [idleProfitPerSec, idlePizzasPerSec, rushTimeLeft, vipSpawned, totalPizzasSold, syndicatePerks, currentClickPower, pizzaPrice, marketUnlocked]);

  // 1. The 100ms Smooth Ticker & Combo Engine
  useEffect(() => {
      const smoothTick = setInterval(() => {
          const state = engineRefs.current;
          
          if (state.idlePizzasPerSec > 0) {
              const pizzasThisTick = state.idlePizzasPerSec / 10;
              setMoney(m => m + (state.idleProfitPerSec / 10));
              setLifetimeMoney(lm => lm + (state.idleProfitPerSec / 10));
              setTotalPizzasSold(tp => tp + pizzasThisTick);
              setReputation(r => r + (state.idleRepPerSec / 10));
              
              // Add to pending production for global sync
              pendingProduction.current += pizzasThisTick;
              
              // Save to localStorage as backup for mobile
              const backupData = {
                pendingPizzas: pendingProduction.current,
                timestamp: Date.now()
              };
              localStorage.setItem('pizzaGlobalSyncBackup', JSON.stringify(backupData));
              
              // Immediate sync for production to minimize mobile loss
              if (pizzasThisTick >= 1) {
                syncWithGlobalSyndicate();
              }
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

          const timerSlowdown = state.syndicatePerks?.timeLoop ? 0.2 : 1; // 5× slower = decrement by 0.2 instead of 1
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
            const types = state.marketUnlocked ? ['frenzy', 'marketCrash', 'instantCash'] : ['frenzy', 'instantCash'];
            return {
              id: Date.now(),
              type: types[Math.floor(Math.random() * types.length)],
              x: 10 + Math.random() * 70,
              y: 10 + Math.random() * 70,
              expiresAt: Date.now() + 15000,
            };
          });

          // Market manipulation cooldowns (global)
          const marketCooldownReduction = state.syndicatePerks?.marketGod ? 0.25 : 1; // 75% faster = decrement by 0.25 instead of 1
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

          // autoArm perk: burst 10 clicks every 2 seconds
          if (state.syndicatePerks.autoArm && state.hasStarted) {
              autoArmTickRef.current = (autoArmTickRef.current + 1) % 2;
              if (autoArmTickRef.current === 0) {
                const autoMoney = state.idleClickMoney * 10;
                setMoney(m => m + autoMoney);
                setLifetimeMoney(lm => lm + autoMoney);
                setTotalPizzasSold(tp => tp + state.currentClickPower * 10);
                setReputation(r => r + Math.ceil(state.currentClickPower * 0.1 * 10));
                setTotalClicks(tc => tc + 10);
              }
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
     const stateSnapshot = { totalPizzasSold, totalClicks, perfectBakes, money, franchiseLicenses, lifetimeMoney, combo, deliveriesCompleted, reputation, inventory, totalMarketTrades, marketProfitLifetime, biggestMarketGain, vipTokens, marketShares };
     let newlyUnlocked = [];
     ACHIEVEMENTS.forEach(ach => {
        if (!unlockedAchievements.includes(ach.id) && ach.req(stateSnapshot)) {
           newlyUnlocked.push(ach.id);
           console.log('Achievement unlocked:', ach.name);
           const popupId = Date.now() + Math.random();
           setAchievementToasts(prev => [...prev, { id: popupId, name: ach.name }]);
           setTimeout(() => setAchievementToasts(prev => prev.filter(t => t.id !== popupId)), 4000);
        }
     });
     if (newlyUnlocked.length > 0) setUnlockedAchievements(prev => [...prev, ...newlyUnlocked]);
  // money/reputation/combo update every 100ms — excluded from deps to prevent render storms.
  // Achievements that depend on them (combo_max etc.) will still fire because totalPizzasSold
  // and totalClicks are updated on every click/tick and will re-trigger this effect.
  }, [totalPizzasSold, totalClicks, perfectBakes, franchiseLicenses, lifetimeMoney, unlockedAchievements, deliveriesCompleted, inventory, totalMarketTrades, marketProfitLifetime, biggestMarketGain, vipTokens, marketShares, money, reputation]);

  // --- SAVE SYSTEM ---
  const saveStateRef = useRef();
  // Use a ref to always have fresh values without triggering re-renders
  saveStateRef.current = { money, totalPizzasSold, reputation, lifetimeMoney, franchiseLicenses, inventory, totalClicks, perfectBakes, unlockedAchievements, deliveriesCompleted, vipTokens, marketUnlocked, marketShares, marketPrices, marketHistory, portfolioDelta, marketCostBasis, totalMarketTrades, marketProfitLifetime, biggestMarketGain, goldenSlices, ascensionSpentLicenses, syndicatePerks, marketCooldowns, manipTarget, deliveryCooldowns, revealedUpgrades: Array.from(revealedUpgrades) };

  useEffect(() => {
    const saveLoop = setInterval(() => {
      if (saveStateRef.current) localStorage.setItem(SAVE_KEY, JSON.stringify({ ...saveStateRef.current, lastSaveTime: Date.now() }));
    }, 2000);
    return () => clearInterval(saveLoop);
  }, []);

  // 6. Special Delivery Timer Loop (DISABLED - delivery game removed from auto-spawn)
  // useEffect(() => {
  //   // Check if player has at least one delivery unlocked
  //   const hasAnyDelivery = DESTINATIONS.some(dest => {
  //     const req = dest.unlockReq;
  //     return totalPizzasSold >= req.pizzas && starLevel >= req.stars && lifetimeMoney >= req.lifetime && franchiseLicenses >= (req.licenses || 0);
  //   });

  //   if (!hasAnyDelivery) return;

  //   const specialDeliveryTick = setInterval(() => {
  //     setSpecialDelivery(prev => {
  //       // If there's already a special delivery, don't create a new one
  //       if (prev) return prev;
        
  //       // 20% chance every 30 seconds (roughly every 6-8 minutes on average)
  //       if (Math.random() < 0.2) {
  //         const expiresAt = Date.now() + 45000; // 45 seconds to accept
  //         return {
  //           id: `special-${Date.now()}`,
  //           expiresAt,
  //           rewardMultiplier: 2.0, // 2x rewards
  //           created: Date.now()
  //         };
  //       }
  //       return prev;
  //     });
  //   }, 30000); // Check every 30 seconds

  //   return () => clearInterval(specialDeliveryTick);
  // }, [totalPizzasSold, starLevel, lifetimeMoney, franchiseLicenses]);

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
    const MARKET_BASE = {
      flour:     15,
      cheese:    60,
      pepperoni: 250,
      truffles:  1500,
    };
    // Absolute floor — can't crash below 20% of baseline
    const MARKET_FLOOR = {
      flour:     3,
      cheese:    12,
      pepperoni: 50,
      truffles:  300,
    };
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

          // Hard floor — never below minimum
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
          Object.keys(prevH).forEach(key => {
            nextH[key] = [...prevH[key].slice(-19), next[key]];
          });
          return nextH;
        });
        return next;
      });
    }, syndicatePerks.insiderTrading ? 7500 : 15000);
    return () => clearInterval(marketTick);
  }, [syndicatePerks.insiderTrading]);


  // Cookie Clicker-style large number naming
  const BIG_NAMES = [
    [1e303, 'Centillion'],
    [1e100, 'Googol'],
    [1e63,  'Vigintillion'],
    [1e60,  'Novemdecillion'],
    [1e57,  'Octodecillion'],
    [1e54,  'Septendecillion'],
    [1e51,  'Sexdecillion'],
    [1e48,  'Quindecillion'],
    [1e45,  'Quattuordecillion'],
    [1e42,  'Tredecillion'],
    [1e39,  'Duodecillion'],
    [1e36,  'Undecillion'],
    [1e33,  'Decillion'],
    [1e30,  'Nonillion'],
    [1e27,  'Octillion'],
    [1e24,  'Septillion'],
    [1e21,  'Sextillion'],
    [1e18,  'Quintillion'],
    [1e15,  'Quadrillion'],
    [1e12,  'Trillion'],
    [1e9,   'Billion'],
    [1e6,   'Million'],
    [1e3,   'Thousand'],
  ];
  const BIG_ABBR = [
    [1e303, 'Ce'],
    [1e100, 'Gg'],
    [1e63,  'Vg'],
    [1e60,  'Nvd'],
    [1e57,  'Otd'],
    [1e54,  'Spd'],
    [1e51,  'Sxd'],
    [1e48,  'Qnd'],
    [1e45,  'Qtd'],
    [1e42,  'Trd'],
    [1e39,  'Dud'],
    [1e36,  'Und'],
    [1e33,  'Dc'],
    [1e30,  'No'],
    [1e27,  'Oc'],
    [1e24,  'Sp'],
    [1e21,  'Sx'],
    [1e18,  'Qi'],
    [1e15,  'Qu'],
    [1e12,  'T'],
    [1e9,   'B'],
    [1e6,   'M'],
    [1e3,   'K'],
  ];

  const fmt = (n, decimals = 2) => {
    if (n === Infinity) return '∞';
    if (n === -Infinity) return '-∞';
    if (n === null || n === undefined || Number.isNaN(n)) return '0';
    const abs = Math.abs(n);
    for (const [thresh, abbr] of BIG_ABBR) {
      if (abs >= thresh) {
        return `${(n / thresh).toFixed(decimals)}${abbr}`;
      }
    }
    return Number(n).toFixed(decimals);
  };

  const fmtInt = (n) => {
    if (n === Infinity) return '∞';
    if (n === -Infinity) return '-∞';
    if (n === null || n === undefined || Number.isNaN(n)) return '0';
    const abs = Math.abs(n);
    for (const [thresh, abbr] of BIG_ABBR) {
      if (abs >= thresh) {
        return `${(n / thresh).toFixed(2)}${abbr}`;
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
    : 'bg-zinc-900 text-zinc-100';

  useEffect(() => {
    if (!canAccessVaultTab && activeTab === 'vault') {
      setActiveTab('upgrades');
    }
  }, [canAccessVaultTab, activeTab]);

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
    <>
      <div className={`min-h-screen font-body select-none flex flex-col relative overflow-x-hidden transition-colors duration-500 pb-24 md:pb-28 ${appBgClass} ${isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>

      {/* Floating Spy Icon - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <a 
          href="https://discord.gg/kd5FTs3Gsd" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group relative flex flex-col items-center"
        >
          {/* Spy Icon */}
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center shadow-lg border-2 border-purple-500/50 hover:from-purple-500 hover:to-purple-700 transition-all duration-300 hover:scale-110 hover:shadow-purple-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {/* Spy hat */}
              <path d="M12 2 L8 6 L16 6 Z" fill="currentColor"/>
              <rect x="8" y="6" width="8" height="2" fill="currentColor"/>
              {/* Face */}
              <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor"/>
              {/* Eye */}
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
              <circle cx="13" cy="11" r="0.5" fill="white"/>
              {/* Brim of hat */}
              <path d="M6 8 Q12 10 18 8" fill="none" stroke="currentColor"/>
            </svg>
          </div>
          
          {/* Tooltip */}
          <div className="absolute top-full mt-2 right-0 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
            <div className="text-xs font-black text-purple-300 uppercase tracking-wider">Join the Syndicate</div>
            {/* Arrow */}
            <div className="absolute -top-2 right-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-zinc-800"></div>
          </div>
          
          {/* Pulsing Effect */}
          <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping"></div>
        </a>
      </div>

      {/* ── GOLDEN SLICE EVENT OVERLAY ── */}
      {goldenSliceEvent && (
        <button
          onClick={handleGoldenSliceClick}
          style={{ position: 'fixed', left: `${goldenSliceEvent.x}%`, top: `${goldenSliceEvent.y}%`, zIndex: 9999 }}
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
        <div className="fixed top-[72px] inset-x-0 z-[9998] pointer-events-none flex justify-center">
          <div className="px-8 py-2 bg-yellow-500 border-b-[4px] border-yellow-800 rounded-b-2xl animate-pulse">
            <span className="font-display text-base text-yellow-900 tracking-widest">⚡ 7x CLICK FRENZY ACTIVE ⚡</span>
          </div>
        </div>
      )}
      
      {/* ── MARKET CRASH BANNER ── */}
      {marketCrashBanner && (
        <div className="fixed inset-x-0 top-[68px] z-[9997] pointer-events-none flex flex-col items-center animate-[logSlideIn_0.15s_ease-out]">
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
        <div className="fixed inset-0 z-[9996] pointer-events-none flex items-center justify-center">
          <div className="animate-[floatUpFade_3.5s_ease-out_forwards] flex flex-col items-center gap-1">
            <span className="font-display text-5xl md:text-6xl font-black text-money tabular-nums">
              +<Num value={instantCashPopup} prefix="$" />
            </span>
            <span className="text-sm font-black uppercase tracking-widest text-yellow-900 bg-yellow-400 px-3 py-0.5 rounded">Golden Slice Bonus</span>
          </div>
        </div>
      )}

      {/* ACHIEVEMENT TOASTS - Center Stack */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
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

      {/* ── FIXED HUD ── */}
      <div className={`fixed top-0 inset-x-0 z-40 bg-[#050505] border-b-4 border-zinc-900 transition-colors duration-300 ${isRush ? 'bg-red-950 border-red-900' : ''}`}>
        <div className="max-w-6xl mx-auto px-3 h-24 flex items-center gap-3 relative">

          {/* LEFT: Title + stars */}
          <div className="flex flex-col justify-center shrink-0 min-w-0">
            <h1 className="text-2xl md:text-3xl font-display tracking-widest metallic-text whitespace-nowrap leading-none">CRUST FUND</h1>
            <div className="flex gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < starLevel ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700 fill-zinc-700'}`} />
              ))}
            </div>
          </div>

          {/* CENTER: Dominant bank display */}
          <div className="flex-1 flex justify-end sm:justify-center min-w-0">
            <div className={`flex flex-col items-center gap-0.5 px-3 sm:px-6 py-2 sm:py-3 rounded-xl border-b-[4px] min-w-0 ${
              isRush ? 'bg-red-800 border-red-950' : 'bg-zinc-800 border-zinc-950'
            }`}>
              <div className="text-xs sm:text-sm text-zinc-400 font-bold uppercase tracking-widest whitespace-nowrap leading-none">BANK BALANCE</div>
              <div className="flex items-baseline gap-2">
                <span className={`font-display text-2xl sm:text-3xl md:text-4xl tabular-nums leading-none ${isRush ? 'text-red-200' : 'text-money'}`} style={bankBalanceGlowStyle}>
                  <Num value={money} prefix="$" decimals={2} />
                </span>
                {numWords(money) && (
                  <span className="text-sm text-zinc-500 font-bold hidden sm:block">{numWords(money)}</span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Secondary stat pills + settings */}
          <div className="flex items-center gap-3 shrink-0 flex-1 justify-end">
            {/* Profit/sec */}
            <div className={`hidden sm:flex flex-col items-center gap-1.5 px-6 py-3 rounded-xl border-b-[4px] ${
              isRush ? 'bg-red-800 border-red-950 text-red-200' : recentCps > 0 ? 'bg-orange-900 border-orange-950 text-orange-200' : 'bg-zinc-800 border-zinc-950 text-zinc-400'
            }`}>
              <div className="text-sm text-zinc-400 font-bold uppercase tracking-widest">PROFIT</div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 shrink-0" />
                <span className="font-display text-xl tabular-nums leading-none"><Num value={displayProfitPerSec} prefix="$" decimals={1} />/s</span>
              </div>
            </div>
            {/* Pizzas/sec */}
            <div className="hidden lg:flex flex-col items-center gap-1.5 px-6 py-3 rounded-xl bg-zinc-800 border-b-[4px] border-zinc-950">
              <div className="text-sm text-zinc-400 font-bold uppercase tracking-widest">PIZZAS</div>
              <div className="flex items-center gap-2">
                <Pizza className="w-5 h-5 text-orange-400 shrink-0" />
                <span className="font-display text-xl text-zinc-300 tabular-nums leading-none"><Num value={idlePizzasPerSec} decimals={1} />/s</span>
              </div>
            </div>
            {/* Ticket avg */}
            <div className="hidden lg:flex flex-col items-center gap-1.5 px-6 py-3 rounded-xl bg-zinc-800 border-b-[4px] border-zinc-950">
              <div className="text-sm text-zinc-400 font-bold uppercase tracking-widest">PRICE</div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500 shrink-0" />
                <span className="font-display text-xl text-yellow-300 tabular-nums leading-none"><Num value={pizzaPrice} prefix="$" decimals={2} /></span>
              </div>
            </div>
            {/* Settings only */}
            <div className="flex items-center gap-1.5 ml-2">
              <button onClick={() => setShowSettings(true)} className="bg-zinc-800 border border-zinc-700 border-b-2 border-b-zinc-950 p-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-700 btn-tactile active:border-b-0 active:translate-y-[2px]">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>

        {/* Rep bar — thin strip under HUD */}
        <div className="h-1 bg-zinc-950 w-full">
          <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${Math.min(100, (reputation / (nextStarReq || 1)) * 100)}%` }} />
        </div>
        
        {/* Global Progress Section */}
        <div className="bg-zinc-900/60 border-b border-zinc-800/30 px-4 py-2">
          <div className="max-w-7xl mx-auto">
            <GlobalProgressBar currentGlobalPizzas={globalPizzas} />
          </div>
        </div>
      </div>

      {/* --- SETTINGS MODAL --- */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-[#050505]/90 flex items-center justify-center p-4">
          <div className="bg-zinc-800 border-2 border-zinc-600 border-b-4 border-b-zinc-950 rounded-2xl p-6 md:p-8 max-w-md w-full relative shadow-2xl">
            <h2 className="text-3xl font-display text-white tracking-widest mb-6 border-b border-zinc-700 pb-4 flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-400" /> GAME SETTINGS
            </h2>

            {!showWipeConfirm ? (
              <div className="space-y-4">
                <button onClick={handleManualSave} className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-display tracking-widest rounded-xl flex items-center justify-center gap-3 btn-tactile border-b-[3px] border-zinc-900 active:border-b-0 active:translate-y-[3px]">
                  <Save className="w-5 h-5" /> FORCE SAVE GAME
                </button>
                <button onClick={handleExportSave} className="w-full py-3 bg-blue-800 hover:bg-blue-700 border-b-[3px] border-blue-950 text-blue-100 font-display tracking-widest rounded-xl flex items-center justify-center gap-3 btn-tactile active:border-b-0 active:translate-y-[3px]">
                  <Download className="w-5 h-5" /> EXPORT SAVE CODE
                </button>
                <a
                  href="https://ko-fi.com/pizzalord"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-amber-800 hover:bg-amber-700 border-b-[3px] border-amber-950 text-amber-100 font-display tracking-widest rounded-xl flex items-center justify-center gap-3 btn-tactile active:border-b-0 active:translate-y-[3px]"
                >
                  <Moon className="w-5 h-5" /> SUPPORT THE DEVELOPER
                </a>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-700 flex flex-col gap-2">
                  <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Import Save Code</div>
                  <div className="flex gap-2">
                    <input type="text" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste code here..." className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-blue-500 tabular-nums" />
                    <button onClick={handleImportSave} className="bg-zinc-700 hover:bg-zinc-600 px-4 rounded-lg font-display tracking-widest transition-colors"><Upload className="w-4 h-4"/></button>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-700">
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
                  <p className="text-sm text-zinc-400">This will permanently delete all your money, upgrades, reputation, and Corporate Licenses. This cannot be undone.</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowWipeConfirm(false)} className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl font-display tracking-widest btn-tactile border-b-[3px] border-zinc-900 active:border-b-0 active:translate-y-[3px]">CANCEL</button>
                  <button onClick={handleHardReset} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-display tracking-widest btn-tactile border-b-[3px] border-red-900 active:border-b-0 active:translate-y-[3px]">DELETE SAVE</button>
                </div>
              </div>
            )}
            <button onClick={() => {setShowSettings(false); setShowWipeConfirm(false);}} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* --- PARCHMENT TALE MODAL --- */}
      {showParchmentModal && (
        <div className="fixed inset-0 z-[100] bg-gray-900/95 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-gray-800/90 rounded-2xl border-2 border-amber-600 shadow-2xl overflow-hidden">
            {/* Header with decorative element */}
            <div className="bg-gradient-to-b from-amber-700/30 to-transparent p-6 border-b border-amber-600/30">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-800 rounded-full border-2 border-red-900 flex items-center justify-center">
                  <div className="w-4 h-4 bg-yellow-500 transform rotate-45"></div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-amber-100" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  The Legend of Crust Fund
                </h1>
                <div className="w-8 h-8 bg-red-800 rounded-full border-2 border-red-900 flex items-center justify-center">
                  <div className="w-4 h-4 bg-yellow-500 transform rotate-45"></div>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 md:p-8 text-center" style={{ fontFamily: "'Dancing Script', cursive" }}>
              <div className="space-y-4 text-amber-100" style={{ fontSize: '16px' }}>
                <p className="leading-relaxed">
                  In a world where dough rises like the morning sun,
                </p>
                <p className="leading-relaxed">
                  Where cheese flows like rivers of gold,
                </p>
                <p className="leading-relaxed">
                  One hero dared to dream of pizza perfection.
                </p>
              </div>
              
              <div className="mt-8 pt-6 border-t border-amber-600/30">
                <p className="font-semibold text-amber-200 mb-4" style={{ fontSize: '18px' }}>
                  Chapter {franchiseLicenses}: The Empire Grows
                </p>
                <p className="text-amber-100" style={{ fontSize: '16px' }}>
                  With <span className="font-bold text-orange-400">{fmtInt(totalPizzasSold)}</span> pizzas sold and <span className="font-bold text-green-400">${fmtInt(lifetimeMoney)}</span> earned,
                </p>
                <p className="text-amber-100 mt-2" style={{ fontSize: '16px' }}>
                  your legacy spreads across the land.
                </p>
              </div>
              
              <div className="mt-8 text-amber-200/80 italic" style={{ fontSize: '14px' }}>
                <p>"From humble oven to global dominion,"</p>
                <p className="mt-1">"the slice that conquered all."</p>
              </div>
              
              <button
                onClick={() => setShowParchmentModal(false)}
                className="mt-8 px-6 py-2 bg-amber-600 hover:bg-amber-500 text-gray-900 rounded-lg font-bold transition-colors"
                style={{ fontFamily: "'Dancing Script', cursive", fontSize: '16px' }}
              >
                Close This Chapter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- OFFLINE PROGRESS MODAL --- */}
      {offlineReport && (() => {
        const r = offlineReport;
        const hrs  = Math.floor(r.goneSec / 3600);
        const mins = Math.floor((r.goneSec % 3600) / 60);
        const secs = Math.floor(r.goneSec % 60);
        const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        const wasCapped = r.goneMs / 1000 > 8 * 3600;
        return (
          <div className="fixed inset-0 z-[100] bg-[#050505]/90 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border-2 border-blue-800 border-b-4 border-b-zinc-950 rounded-2xl max-w-lg w-full relative overflow-hidden">
              {/* Header */}
              <div className="bg-blue-950 px-8 pt-8 pb-6 border-b-4 border-zinc-950">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-900 border border-blue-700 rounded-xl p-3">
                    <Moon className="w-8 h-8 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display text-white tracking-widest">OFFLINE REPORT</h2>
                    <p className="text-zinc-400 text-sm font-bold mt-0.5">Your kitchen never stopped while you were away</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 bg-blue-900 border border-blue-700 rounded-xl px-4 py-2.5 flex justify-between items-center">
                    <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">You were gone</span>
                    <span className="text-white font-display text-lg tabular-nums">{timeStr}</span>
                  </div>
                  <div className="flex-1 bg-blue-900 border border-blue-700 rounded-xl px-4 py-2.5 flex justify-between items-center">
                    <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Efficiency</span>
                    <span className="text-blue-200 font-display text-lg tabular-nums">{Math.round(r.efficiency * 100)}%</span>
                  </div>
                </div>
                {wasCapped && (
                  <div className="mt-3 text-xs text-amber-400/80 font-bold bg-amber-900/20 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                    <span>⚠</span> Offline earnings are capped at 8 hours. Come back sooner to maximise gains!
                  </div>
                )}
              </div>

              {/* Breakdown rows */}
              <div className="px-8 py-6 space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-900 border border-green-700 rounded-xl">
                  <div>
                    <div className="text-green-400 text-sm font-black uppercase tracking-widest mb-0.5">Money Earned</div>
                    <div className="text-green-600 text-sm tabular-nums">${fmt(r.profitPerSec)} / sec idle rate</div>
                  </div>
                  <div className="text-money font-display text-2xl tabular-nums">+${fmt(r.moneyEarned)}</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-900 border border-orange-700 rounded-xl">
                  <div>
                    <div className="text-orange-300 text-sm font-black uppercase tracking-widest mb-0.5">Pizzas Baked</div>
                    <div className="text-orange-600 text-sm tabular-nums">{fmt(r.pizzasEarned / r.goneSec)} / sec</div>
                  </div>
                  <div className="text-orange-200 font-display text-2xl tabular-nums">+{fmtInt(r.pizzasEarned)}</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-zinc-800 border border-zinc-700 rounded-xl">
                  <div>
                    <div className="text-zinc-400 text-sm font-black uppercase tracking-widest mb-0.5">Time Active</div>
                    <div className="text-zinc-500 text-sm">50% of full rate while offline</div>
                  </div>
                  <div className="text-zinc-300 font-display text-2xl tabular-nums">{timeStr}</div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 pb-8">
                <button onClick={() => setOfflineReport(null)} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-display text-xl tracking-widest rounded-xl btn-tactile border-b-[4px] border-blue-900 active:border-b-0 active:translate-y-[4px]">
                  LET'S GET COOKING
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- PRESTIGE MODAL --- */}
      {showPrestigeModal && (
        <PrestigeModal
          snapshot={prestigeSnapshot}
          onDecline={usePrestigeDecline}
          onConfirm={confirmPrestige}
        />
      )}

      {showAscensionModal && (
        <AscensionModal
          snapshot={ascensionSnapshot}
          onDecline={declineAscension}
          onConfirm={confirmAscension}
        />
      )}

      {/* --- ACHIEVEMENT DETAIL MODAL --- */}
      {selectedAchievement && (() => {
        const meta = ACHIEVEMENT_META[selectedAchievement.id] || {};
        const isSecret = meta.isSecret;
        const isUnlocked = unlockedAchievements.includes(selectedAchievement.id);
        const isSecretLocked = isSecret && !isUnlocked;
        
        return (
          <div className="fixed inset-0 z-[102] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedAchievement(null)}>
            <div 
              className={`bg-zinc-950 border-4 rounded-2xl p-8 max-w-md w-full text-center relative`}
              style={{
                borderColor: isSecretLocked ? '#d946ef' : '#f59e0b',
                boxShadow: isSecretLocked ? '0 0 60px rgba(217,70,239,0.6)' : '0 0 60px rgba(245,158,11,0.4)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button onClick={() => setSelectedAchievement(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors">
                <span className="text-2xl">×</span>
              </button>
              
              {/* Icon */}
              <div className="mb-4">
                {isSecretLocked ? (
                  <svg className="w-24 h-24 mx-auto text-fuchsia-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{
                    filter: 'drop-shadow(0 0 20px #d946ef) drop-shadow(0 0 40px #a855f7)'
                  }}>
                    <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                ) : (
                  meta.icon ? React.cloneElement(meta.icon, { className: 'w-24 h-24 mx-auto' }) : <Star className="w-24 h-24 mx-auto" />
                )}
              </div>
              
              {/* Title */}
              <h2 
                className={`text-2xl font-black uppercase tracking-widest mb-3 ${isSecretLocked ? 'text-fuchsia-400' : 'text-amber-400'}`}
                style={{ fontSize: '1.5rem' }}
              >
                {selectedAchievement.name}
              </h2>
              
              {/* Description or Hint */}
              <p className={`mb-6 ${isSecretLocked ? 'text-fuchsia-300' : 'text-zinc-300'}`} style={{ fontSize: '14pt', lineHeight: '1.5' }}>
                {isSecretLocked ? meta.hint : selectedAchievement.desc}
              </p>
              
              {/* Close button */}
              <button 
                onClick={() => setSelectedAchievement(null)}
                className={`px-6 py-3 font-bold rounded-lg transition-colors ${
                  isSecretLocked 
                    ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white' 
                    : 'bg-amber-600 hover:bg-amber-500 text-zinc-950'
                }`}
                style={{ fontSize: '14pt' }}
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}

      {/* --- DELIVERY MICROGAME (placeholder — DeliveryMicrogame component not yet implemented) --- */}

      {/* ── MAIN CONTENT (offset for HUD) ── */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 pt-28 pb-6 px-4 md:px-6">
        
        {/* Left Area: Action Center */}
        <div className="lg:col-span-5 flex flex-col gap-6 relative mt-2">
          
          {/* TICKET QUEUE / MINI-GAMES */}
          <div className="min-h-[120px] flex items-center justify-center">
            
            {vipSpawned && !sideOrder && (
              <button 
                onClick={triggerVIP}
                className="w-full h-full bg-yellow-500 rounded-2xl border-b-[4px] border-yellow-800 flex items-center justify-center gap-3 animate-bounce btn-tactile active:border-b-0 active:translate-y-[4px]"
              >
                <Zap className="w-8 h-8 text-yellow-100 fill-yellow-100" />
                <div className="text-left">
                  <div className="text-2xl font-display text-white uppercase tracking-widest">VIP Customer Alert!</div>
                  <div className="text-sm text-yellow-100 font-bold">Click to trigger Dinner Rush!</div>
                </div>
              </button>
            )}

            {isRush && !sideOrder && (
              <div className="w-full h-full bg-red-800 rounded-2xl border-b-[4px] border-red-950 flex items-center justify-between px-8">
                <div className="flex items-center gap-3 text-red-200">
                  <Zap className="w-8 h-8 fill-red-200 animate-pulse" />
                  <div>
                    <div className="text-2xl font-display uppercase tracking-widest text-white">Dinner Rush!</div>
                    <div className="text-sm font-bold">2x Speed & 2x Prices</div>
                  </div>
                </div>
                <div className="text-4xl font-display text-red-100 flex items-center gap-2 tabular-nums">
                  <Clock className="w-8 h-8" /> 0:{Math.ceil(rushTimeLeft).toString().padStart(2, '0')}
                </div>
              </div>
            )}

            {sideOrder && sideOrder.status === 'cooking' && (
              <div className="w-full h-full bg-orange-950 rounded-2xl border border-orange-800 border-b-[4px] border-b-orange-950 flex flex-col items-center justify-center p-5 gap-3 relative">
                <div className="flex justify-between w-full text-sm font-display tracking-widest text-orange-400">
                   <span className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500 animate-pulse"/> TICKET: {sideOrder.type === 'wings' ? 'SPICY WINGS' : 'GARLIC BREAD'}</span>
                   <span className="animate-pulse">BAKING...</span>
                </div>
                
                <div className="w-full h-8 bg-zinc-950 rounded-lg relative overflow-hidden border-2 border-zinc-800">
                   {/* Burn warning: faint red after sweet spot */}
                   <div className="absolute top-0 bottom-0 bg-red-950/40 z-[5]" style={{ left: '88%', right: 0 }}></div>
                   {/* Sweet spot indicator */}
                   <div className="absolute top-0 bottom-0 bg-green-700 border-x-2 border-green-500 z-10" style={{ left: '75%', width: '13%' }}></div>
                   {/* Progress bar */}
                   <div className="h-full bg-orange-600 z-0" style={{ width: `${sideOrder.progress}%` }}></div>
                   {/* Playhead: sharp white line at leading edge */}
                   <div className="absolute top-0 bottom-0 z-30 w-[2px] bg-white" style={{ left: `calc(${sideOrder.progress}% - 1px)`, boxShadow: '0 0 4px rgba(255,255,255,0.9)' }}></div>
                </div>
                
                <button 
                  onClick={handlePullFromOven} 
                  className={`w-full py-2 text-white font-display tracking-widest rounded-xl btn-tactile border-b-[3px] active:border-b-0 active:translate-y-[3px] transition-colors duration-150 ${
                    sideOrder.progress >= 75 && sideOrder.progress <= 88
                      ? 'bg-green-500 hover:bg-green-400 border-green-900 animate-pulse'
                      : 'bg-orange-600 hover:bg-orange-500 border-orange-900'
                  }`}
                >
                  PULL FROM OVEN!
                </button>
              </div>
            )}

            {/* REDESIGNED SCRUB BOARD */}
            {sideOrder && sideOrder.type === 'dishes' && sideOrder.status === 'dirty' && (
              <div className="w-full h-full bg-zinc-800 rounded-2xl border border-zinc-700 p-4 shadow-lg flex flex-col items-center justify-center gap-2">
                 <div className="flex justify-between w-full text-xs font-display tracking-widest text-blue-300">
                    <span className="flex items-center gap-2"><Droplets className="w-3 h-3 text-blue-400" /> SINK FULL</span>
                    <span className="tabular-nums text-blue-400 font-bold bg-blue-900/50 px-2 py-0.5 rounded border border-blue-500/30">{Math.floor((sideOrder.progress / sideOrder.required) * 100)}%</span>
                 </div>
                 
                 <div 
                    className="relative w-full h-16 sm:h-20 rounded-xl bg-zinc-950 border-2 border-dashed border-blue-500/40 flex items-center justify-center cursor-crosshair touch-none overflow-hidden group shadow-inner"
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
              <div className="w-full h-full rounded-2xl border-b-[4px] bg-green-800 border-green-950 text-green-100 flex items-center justify-center flex-col gap-1 p-4">
                  <Sparkles className="w-10 h-10 animate-spin-slow mb-1" />
                  <div className="text-3xl font-display tracking-widest uppercase">Spotless!</div>
                  <div className="text-sm font-bold text-green-300 mt-1">2x Click Power for 60 seconds!</div>
              </div>
            )}

            {sideOrder && sideOrder.status !== 'cooking' && sideOrder.type !== 'dishes' && (
              <div className={`w-full h-full rounded-2xl border-b-[4px] flex items-center justify-center flex-col gap-1 p-4
                  ${sideOrder.status === 'perfect' ? 'bg-green-800 border-green-950 text-green-100' :
                    sideOrder.status === 'burnt' ? 'bg-red-900 border-red-950 text-red-200' :
                    'bg-yellow-800 border-yellow-950 text-yellow-100'}`}>
                  <div className={`text-3xl font-display tracking-widest uppercase ${sideOrder.status === 'perfect' ? 'animate-bounce' : ''}`}>
                     {sideOrder.status}!
                  </div>
                  <div className="font-bold font-body text-lg text-white tabular-nums">
                     {sideOrder.status === 'perfect' ? <>Huge Bonus! +<Num value={sideOrder.rewardEarned} prefix="$" /></> :
                      sideOrder.status === 'burnt' ? 'Ruined! $0' :
                      <>Okay. +<Num value={sideOrder.rewardEarned} prefix="$" /></>}
                  </div>
              </div>
            )}
            
            {!vipSpawned && !isRush && !sideOrder && (
              <div className="w-full h-full border-2 border-dashed border-zinc-700 rounded-2xl flex flex-col items-center justify-center text-zinc-500 text-sm font-bold uppercase tracking-widest bg-zinc-800/30">
                {specialDelivery ? (
                  <>
                    <div className="text-center mb-4">
                      <div className="text-amber-400 text-lg font-display tracking-wider mb-2">🚗 Special Delivery Ready!</div>
                      <div className="text-zinc-400 text-xs mb-3">Complete the lane challenge for 2x rewards</div>
                      <div className="text-amber-300 text-xs tabular-nums mb-4">
                        Expires in: {Math.max(0, Math.ceil((specialDelivery.expiresAt - Date.now()) / 1000))}s
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setDeliveryGame(true); // Just set to true to trigger the microgame
                        setSpecialDelivery(null);
                      }}
                      className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-display text-sm font-black tracking-wider rounded-xl border-b-[3px] border-amber-800 active:border-b-0 active:translate-y-[3px] transition-all btn-tactile"
                    >
                      START NOW
                    </button>
                  </>
                ) : isClean ? (
                  <>
                    <Sparkles className="w-6 h-6 text-blue-400 mr-2" />
                    <span className="text-blue-300 tabular-nums">Clean Kitchen Boost: {Math.ceil(cleanBoostTimer)}s</span>
                  </>
                ) : (
                  'Awaiting Orders...'
                )}
              </div>
            )}
          </div>

          <div className="relative perspective-[1000px] select-none flex items-center justify-center">
            {/* Layer 3: Socket — static depth base */}
            <div className="absolute -inset-1 rounded-[2.2rem] bg-black border-4 border-zinc-900 shadow-[inset_0_15px_30px_rgba(0,0,0,0.9)] translate-y-2 pointer-events-none" />
            {/* Layer 4: Opposing shadow — shifts opposite to tilt */}
            <div className="absolute -inset-1 rounded-[2.2rem] bg-black/60 pointer-events-none"
              style={{
                filter: 'blur(20px)',
                transform: `translate(${-pressStyle.tiltY * 0.3}px, ${pressStyle.tiltX * 0.3}px)`,
                transition: isPressed ? 'transform 30ms ease-in' : 'transform 550ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }} />
            {/* Layer 2: Particles */}
            {particles.map(p => (
              <div key={p.id}
                className="absolute z-[70] w-1.5 h-8 bg-amber-200 rounded-full shadow-[0_0_10px_#fde047] animate-premium-burst pointer-events-none"
                style={{
                  left: p.x, top: p.y,
                  '--tx': `${p.targetX}px`, '--ty': `${p.targetY}px`,
                  '--rot': `${p.rot}deg`, '--scale': p.scale,
                  animationDuration: `${p.duration}ms`,
                }} />
            ))}
            {/* Visual Hull */}
            <div
              className={`w-full rounded-[2rem] p-6 pb-8 md:pb-6 flex flex-col items-center justify-center gap-4 group relative outline-none touch-none
                ${isRush
                  ? 'bg-gradient-to-b from-red-600 to-red-700 border border-red-950 border-t-red-500'
                  : 'bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-950 border-t-zinc-700'
                }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isPressed
                  ? `rotateX(${pressStyle.tiltX}deg) rotateY(${pressStyle.tiltY}deg) scale(0.96) translateZ(-20px) translateY(8px)`
                  : 'rotateX(0deg) rotateY(0deg) scale(1) translateZ(0px) translateY(0px)',
                filter: bakeState === 'flash'
                  ? isRush ? 'brightness(1.55) drop-shadow(0 0 28px rgba(239,68,68,0.7))' : 'brightness(1.55) drop-shadow(0 0 28px rgba(251,146,60,0.7))'
                  : 'brightness(1)',
                transition: isPressed
                  ? 'transform 30ms ease-in, filter 30ms ease-in'
                  : bakeState === 'flash'
                    ? 'transform 550ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 0ms'
                    : 'transform 550ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 280ms ease-out',
                willChange: 'transform',
              }}
            >
              {/* Parallax inner content — floats above hull surface */}
              <div style={{
                transform: `translate3d(${pressStyle.parallaxX}px, ${pressStyle.parallaxY}px, 40px)`,
                transition: isPressed ? 'transform 30ms ease-in' : 'transform 550ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', position: 'relative',
              }}>
                {/* COMBO METER */}
                {combo > 0 && (
                  <div className="absolute top-5 right-5 flex flex-col items-end pointer-events-none">
                    <div className={`font-display text-3xl md:text-5xl transition-all duration-100 tabular-nums font-black
                      ${combo >= 100 && heatBarPct >= 0.9 ? 'text-white scale-125' : combo > 50 ? 'text-red-200 scale-110' : combo > 20 ? 'text-orange-100' : 'text-yellow-200'}`}>
                      x{comboMultiplier.toFixed(2)}
                    </div>
                    <div className="text-sm font-black tracking-widest uppercase text-orange-900 bg-orange-200 px-2 py-0.5 rounded mt-1">Combo</div>
                    <div className="w-20 h-2 bg-orange-900 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-yellow-300 transition-all duration-100" style={{ width: `${(comboDecayTimer / 20) * 100}%` }} />
                    </div>
                  </div>
                )}

                {clickPopups.map(popup => (
                  <div
                    key={popup.id}
                    className="absolute text-4xl font-black pointer-events-none drop-shadow-md z-50 floating-popup tabular-nums"
                    style={{ left: popup.x, top: popup.y, color: isRush ? '#f87171' : '#4ade80' }}
                  >
                    +${popup.value}
                  </div>
                ))}

                <div className="relative pointer-events-none flex flex-col items-center">
                  {hasMichelin && (
                    <Crown className="absolute -top-7 left-1/2 -translate-x-1/2 w-7 h-7 text-yellow-300 animate-bounce z-20" />
                  )}
                  {hasTruffles && !isRush && (
                    <>
                      <Sparkles className="absolute -top-1 -left-4 w-5 h-5 text-cyan-200 opacity-90 animate-bounce z-20" style={{ animationDelay: '0s' }} />
                      <Sparkles className="absolute -top-1 -right-4 w-5 h-5 text-cyan-200 opacity-90 animate-bounce z-20" style={{ animationDelay: '0.3s' }} />
                    </>
                  )}
                  {/* Pizza icon — slow continuous spin */}
                  <Pizza className={`w-32 h-32 md:w-40 md:h-40 relative z-10 pizza-spin group-hover:scale-110 transition-transform duration-150 ${pizzaColorClass}`} />
                  {/* Ellipse pedestal shadow */}
                  <div className="w-28 h-4 bg-orange-900 rounded-full mt-1 opacity-60" style={{ filter: 'blur(6px)' }} />
                </div>

                <div className="pointer-events-none flex flex-col items-center z-10">
                  <div className={`text-4xl font-display tracking-widest uppercase mb-2 ${isRush ? 'text-red-100' : 'text-orange-100'}`}>Bake &amp; Box</div>
                  <div className={`text-sm md:text-base font-display px-5 py-2 rounded-full inline-flex items-center gap-2 tracking-wider tabular-nums transition-all duration-300 ${
                    isClean
                      ? 'text-cyan-100 bg-cyan-800 border-b-2 border-cyan-950'
                      : 'text-amber-100 bg-amber-700 border-b-2 border-amber-950'
                  }`}>
                    {isClean && (
                      <span className="text-sm font-black uppercase tracking-widest text-cyan-400 bg-cyan-900/60 border border-cyan-500/50 px-1.5 py-0.5 rounded shrink-0">2× CLEAN</span>
                    )}
                    <span>+$<Num value={pizzaPrice * currentClickPower} decimals={2} /></span>
                    <span className={isClean ? 'text-cyan-600' : 'text-zinc-500'}>|</span>
                    <span>+<Num value={currentClickPower} decimals={1} /> Pizzas per Click</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Layer 1: Ghost Hitbox — absorbs all pointer events */}
            <div
              className="absolute inset-0 z-[60] cursor-pointer touch-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              onClick={handleBakeAndBox}
              onMouseDown={handleBakePress}
              onMouseUp={handleBakeRelease}
              onMouseLeave={handleBakeRelease}
              onTouchStart={handleBakePress}
              onTouchEnd={handleBakeRelease}
            />
          </div>

          {/* CORPORATE OFFICE - Below Bake & Box */}
          {(lifetimeMoney > 100000 || franchiseLicenses > 0) && (
            <div className="w-full max-w-md mx-auto mt-4">
              <div className="bg-[#030005] rounded-xl border-2 border-fuchsia-900 shadow-[0_0_40px_rgba(168,85,247,0.1)] overflow-hidden">
                {/* Header toggle */}
                <button
                  onClick={() => setCorpOfficeOpen(prev => !prev)}
                  className="w-full px-5 py-3 bg-fuchsia-950/40 hover:bg-fuchsia-950/70 flex items-center justify-between gap-2 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Building className="w-5 h-5 text-fuchsia-400" />
                    <span className="text-base font-black uppercase tracking-widest text-fuchsia-300">Corporate Office</span>
                  </div>
                  <span className={`text-base font-black text-fuchsia-400 transition-transform duration-200 ${corpOfficeOpen ? 'rotate-180' : ''}`}>▾</span>
                </button>

                {corpOfficeOpen && (
                  <div className="p-5 flex flex-col gap-4">
                    {/* Licenses owned row */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Licenses Owned</span>
                      <span className="font-display text-xl text-fuchsia-300 tabular-nums">{franchiseLicenses}</span>
                    </div>

                    {/* ── Transmutation Grid ── */}
                    {canExchangeLicensesForSlice && (
                      <div className="flex items-center justify-center gap-6 p-4 bg-black/40 rounded-2xl">
                        {/* Input: Licenses */}
                        <div className="flex flex-col items-center gap-1">
                          <Building className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                          <span className="text-4xl font-black italic text-white tabular-nums leading-none">{ascensionLicenseCost}</span>
                          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">licenses</span>
                        </div>
                        {/* Catalyst */}
                        <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
                          <div className="absolute inset-0 rounded-full bg-fuchsia-500/25 blur-md" />
                          <Sparkles className="w-8 h-8 text-fuchsia-400 relative z-10 animate-pulse" style={{ filter: 'drop-shadow(0 0 10px #a855f7)' }} />
                        </div>
                        {/* Output: Golden Slices */}
                        <div className="flex flex-col items-center gap-1">
                          <Star className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                          <span className="text-4xl font-black text-amber-500 tabular-nums leading-none">{affordableAscensionSlices}</span>
                          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">golden slice{affordableAscensionSlices !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}

                    {/* ── Ascend Button ── */}
                    {canExchangeLicensesForSlice && (
                      <button
                        onClick={openAscensionModal}
                        className="w-full bg-gradient-to-r from-fuchsia-700 to-purple-600 border-b-[8px] border-purple-900 rounded-xl px-10 py-5 text-white font-black hover:scale-105 active:scale-95 active:border-b-[4px] active:translate-y-1 transition-all duration-[60ms] flex flex-col items-center shadow-[0_20px_40px_rgba(112,26,117,0.5)] group"
                      >
                        <span className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-70 group-hover:opacity-100 transition-opacity">SELL EMPIRE & LIQUIDATE ASSETS</span>
                        <span className="text-2xl font-black uppercase tracking-wider mt-0.5">ASCEND TO THE SYNDICATE</span>
                      </button>
                    )}

                    {/* ── Pending Licenses (Prestige) ── */}
                    {pendingLicenses > 0 && (
                      <button
                        onClick={() => {
                          const snap = { pendingLicenses, franchiseLicenses };
                          setPrestigeSnapshot(snap);
                          prestigeSnapshotRef.current = snap;
                          setShowPrestigeModal(true);
                        }}
                        className="w-full py-3 bg-zinc-950 border-2 border-zinc-800 hover:border-amber-900 text-zinc-400 text-sm font-bold uppercase tracking-widest rounded-xl transition-colors"
                      >
                        SELL FOR +{pendingLicenses} LICENSE{pendingLicenses > 1 ? 'S' : ''}
                      </button>
                    )}

                    {/* ── Next License cost ── */}
                    {pendingLicenses === 0 && (
                      <div className="text-center py-1">
                        <div className="text-xs text-zinc-600 font-bold uppercase tracking-wider mb-0.5">Next License</div>
                        <div className="font-display text-base text-fuchsia-400 tabular-nums"><Num value={nextLicenseCost} prefix="$" decimals={0} /></div>
                      </div>
                    )}

                    {/* Flavor text */}
                    <p className="text-xs text-zinc-700 italic text-center">The obsidian ledger remembers every empire that fed it.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Area: Management & Upgrades */}
        <div className="lg:col-span-7 flex flex-col gap-8 transition-all duration-300 opacity-100 mt-2">

            {/* ── TAB NAV ── */}
            <div className="bg-zinc-900 border-b-4 border-zinc-950 px-3 pt-3 pb-3">
              <div className="bg-zinc-800 p-2 rounded-xl border border-zinc-700 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1">
                {[
                  { id: 'upgrades',     icon: <ShoppingCart className="w-3.5 h-3.5" />, label: 'Shop',  active: 'bg-blue-600 text-white border-b-2 border-blue-900'       },
                  { id: 'map',          icon: <Map          className="w-3.5 h-3.5" />, label: 'Map',       active: 'bg-emerald-600 text-white border-b-2 border-emerald-900' },
                  { id: 'achievements', icon: <Trophy       className="w-3.5 h-3.5" />, label: 'Award',  active: 'bg-yellow-500 text-zinc-900 border-b-2 border-yellow-800'},
                  { id: 'stats',        icon: <TrendingUp   className="w-3.5 h-3.5" />, label: 'Stats',     active: 'bg-sky-600 text-white border-b-2 border-sky-900'         },
                  { id: 'market',       icon: <DollarSign   className="w-3.5 h-3.5" />, label: marketUnlocked ? 'PTSE' : 'Mkt', active: 'bg-teal-600 text-white border-b-2 border-teal-900' },
                  { id: 'log',          icon: <ScrollText   className="w-3.5 h-3.5" />, label: 'Log',       active: 'bg-zinc-600 text-white border-b-2 border-zinc-900'    },
                  ...(canAccessVaultTab
                    ? [{ id: 'vault', icon: <Gem className="w-3.5 h-3.5" />, label: 'Vault', active: 'bg-yellow-600 text-zinc-900 border-b-2 border-yellow-900' }]
                    : []),
                ].map(({ id, icon, label, active }) => {
                  // Calculate available deliveries for map tab
                  const availableDeliveries = id === 'map' ? DESTINATIONS.filter(dest => {
                    const cooldown = deliveryCooldowns[dest.id] || 0;
                    const onCooldown = cooldown > 0;
                    const req = dest.unlockReq;
                    const isUnlocked = totalPizzasSold >= req.pizzas && starLevel >= req.stars && lifetimeMoney >= req.lifetime && franchiseLicenses >= (req.licenses || 0);
                    return isUnlocked && !onCooldown;
                  }) : [];

                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg font-display text-sm tracking-widest uppercase btn-tactile transition-colors duration-100 min-w-0 relative ${
                        activeTab === id
                          ? active
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {icon}
                      <span className="truncate">{label}</span>
                      {/* Delivery notification indicator */}
                      {id === 'map' && availableDeliveries.length > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-red-700 rounded-full flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-pulse">
                          <span className="text-red-100 text-xs font-black leading-none">!</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>


            <div className="p-4 pt-6 space-y-4 bg-zinc-900">
              
              
              {/* --- TAB: VAULT --- */}
              {activeTab === 'vault' && canAccessVaultTab && (() => {
                const SYNDICATE_PERKS_DEF = [
                  {
                    id: 'shadowCapital',
                    name: 'Shadow Capital',
                    cost: 1,
                    icon: <DollarSign className="w-6 h-6 text-yellow-300" />,
                    desc: 'Begin every new run with $100,000 in seed money. No more starting from scratch.',
                    effect: 'Start each run with $100K',
                  },
                  {
                    id: 'quantumOven',
                    name: 'Quantum Oven',
                    cost: 2,
                    icon: <Flame className="w-6 h-6 text-yellow-300" />,
                    desc: 'Warps the oven clock. Side orders advance at half-speed, making Perfect bakes trivially easy.',
                    effect: 'Oven 2× slower — always hit Perfect',
                  },
                  {
                    id: 'insiderTrading',
                    name: 'Insider Trading',
                    cost: 3,
                    icon: <TrendingUp className="w-6 h-6 text-yellow-300" />,
                    desc: 'Your market connections feed you live data. Market prices update twice as fast.',
                    effect: 'Market ticks every 7.5s instead of 15s',
                  },
                  {
                    id: 'autoArm',
                    name: 'Auto-Arm',
                    cost: 5,
                    icon: <Rocket className="w-6 h-6 text-yellow-300" />,
                    desc: 'A robotic arm bakes and boxes pizzas automatically. Bursts 10 clicks every 2 seconds, fully scaled with all click multipliers.',
                    effect: '+10 clicks every 2 seconds (with all multipliers)',
                  },
                  {
                    id: 'timeLoop',
                    name: 'Time Loop',
                    cost: 10,
                    icon: <Clock className="w-6 h-6 text-yellow-300" />,
                    desc: 'Break the causal fabric of time itself. All timers (rush, clean, VIP) run 5× slower, effectively giving you 5× duration.',
                    effect: 'All buff timers last 5× longer',
                  },
                  {
                    id: 'realityBend',
                    name: 'Reality Bender',
                    cost: 15,
                    icon: <Sparkles className="w-6 h-6 text-yellow-300" />,
                    desc: 'Your pizza transcends physical laws. All production multipliers (franchise, stars, VIP, synergies) are doubled.',
                    effect: 'All production multipliers ×2',
                  },
                  {
                    id: 'infiniteOven',
                    name: 'Infinite Oven',
                    cost: 20,
                    icon: <Zap className="w-6 h-6 text-yellow-300" />,
                    desc: 'The oven contains a pocket dimension. Side orders are instantly Perfect and give 10× rewards.',
                    effect: 'Instant Perfect side orders with 10× rewards',
                  },
                  {
                    id: 'marketGod',
                    name: 'Market Master',
                    cost: 25,
                    icon: <TrendingUp className="w-6 h-6 text-yellow-300" />,
                    desc: 'Your market connections are unparalleled. Market manipulation cooldowns are reduced by 75% and effects are increased by 50%.',
                    effect: '75% faster cooldowns, 1.5× manipulation power',
                  },
                  {
                    id: 'pizzaSingularity',
                    name: 'Pizza Cascade',
                    cost: 50,
                    icon: <Gem className="w-6 h-6 text-yellow-300" />,
                    desc: 'Unlock a special oven mode where side orders cascade - each perfect pull has a 20% chance to spawn another side order.',
                    effect: 'Cascade side orders from perfect pulls',
                  },
                  {
                    id: 'goldenTouch',
                    name: 'Golden Touch',
                    cost: 75,
                    icon: <Crown className="w-6 h-6 text-yellow-300" />,
                    desc: 'Your expertise turns everything to gold. All money gains are multiplied by 3×.',
                    effect: 'All money gains ×3',
                  },
                  {
                    id: 'ascension',
                    name: 'Synergistic Click',
                    cost: 100,
                    icon: <Moon className="w-6 h-6 text-yellow-300" />,
                    desc: 'Your clicks become synergistic with your production. Each click gains +10% of your current /sec production as bonus power.',
                    effect: 'Clicks gain +10% of /sec production',
                  },
                  {
                    id: 'goldenPower',
                    name: 'Golden Power',
                    cost: 10,
                    icon: <Star className="w-6 h-6 text-yellow-300" />,
                    desc: 'Channel the essence of golden slices into pure power. Increases all production and click multipliers by 5% permanently. This can be purchased repeatedly.',
                    effect: '+5% global multiplier per purchase (repeatable)',
                    repeatable: true,
                  },
                ];
                return (
                  <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="relative overflow-hidden rounded-xl border border-yellow-700 bg-yellow-950 p-5">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                          <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-3">
                            <Moon className="w-7 h-7 text-yellow-400" />
                          </div>
                          <div>
                            <div className="text-sm font-black uppercase tracking-widest text-yellow-600 mb-0.5">Hard Prestige Layer</div>
                            <h2 className="font-display text-2xl text-yellow-100 tracking-widest">The Syndicate Vault</h2>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-yellow-900/40 border border-yellow-500/40 rounded-xl px-4 py-3">
                          <Gem className="w-5 h-5 text-yellow-400" />
                          <div>
                            <div className="text-sm font-black uppercase tracking-widest text-yellow-600">Golden Slices</div>
                            <div className="font-display text-2xl text-yellow-300 tabular-nums leading-none">{goldenSlices}</div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                        Golden Slices are permanent currency earned by ascending through The Culinary Syndicate. Spend them on perks that persist across all future runs.
                      </p>
                    </div>

                    {/* Perk Cards */}
                    {SYNDICATE_PERKS_DEF.map(perk => {
                      const owned = syndicatePerks[perk.id];
                      const canBuy = (!owned || perk.repeatable) && goldenSlices >= perk.cost;
                      const currentCount = perk.repeatable ? syndicatePerks.goldenPowerCount || 0 : (owned ? 1 : 0);
                      return (
                        <div
                          key={perk.id}
                          className={`rounded-xl border ${
                            owned ? 'border-yellow-700 bg-yellow-950' : 'border-zinc-700 bg-zinc-900'
                          }`}
                        >
                          <div className="relative z-10 p-4">
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-xl border shrink-0 ${
                                owned ? 'bg-yellow-900/40 border-yellow-500/50' : 'bg-zinc-800/60 border-zinc-700'
                              }`}>
                                {perk.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={`font-display text-base tracking-wider ${owned ? 'text-yellow-200' : 'text-zinc-300'}`}>{perk.name}</h3>
                                  {owned && !perk.repeatable && (
                                    <span className="text-sm font-black uppercase tracking-widest text-yellow-900 bg-yellow-400 px-2 py-0.5 rounded-full shrink-0">UNLOCKED</span>
                                  )}
                                  {perk.repeatable && currentCount > 0 && (
                                    <span className="text-sm font-black uppercase tracking-widest text-yellow-900 bg-yellow-400 px-2 py-0.5 rounded-full shrink-0">×{currentCount}</span>
                                  )}
                                </div>
                                <p className="text-sm text-zinc-500 mb-2 leading-relaxed">{perk.desc}</p>
                                <div className={`text-sm font-black uppercase tracking-wider ${owned ? 'text-yellow-500' : 'text-zinc-600'}`}>
                                  ✦ {perk.effect}
                                </div>
                              </div>
                              <div className="shrink-0 flex flex-col items-end gap-2">
                                {owned && !perk.repeatable ? (
                                  <div className="flex items-center gap-1.5 text-yellow-400">
                                    <Gem className="w-4 h-4" />
                                    <span className="font-display text-sm">Owned</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-1 text-right">
                                      <Gem className="w-3.5 h-3.5 text-yellow-500" />
                                      <span className={`font-display text-lg tabular-nums ${canBuy ? 'text-yellow-300' : 'text-zinc-600'}`}>{perk.cost}</span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (!canBuy) return;
                                        setGoldenSlices(g => g - perk.cost);
                                        if (perk.repeatable) {
                                          setSyndicatePerks(p => ({ ...p, goldenPowerCount: (p.goldenPowerCount || 0) + 1 }));
                                        } else {
                                          setSyndicatePerks(p => ({ ...p, [perk.id]: true }));
                                        }
                                      }}
                                      disabled={!canBuy}
                                      className={`px-3 py-1.5 rounded-lg font-display text-xs tracking-wider btn-tactile ${
                                        canBuy
                                          ? 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-black border-b-[2px] border-yellow-800 active:border-b-0 active:translate-y-[2px] cursor-pointer'
                                          : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
                                      }`}
                                    >
                                      {canBuy ? (perk.repeatable ? 'Buy' : 'Unlock') : goldenSlices < perk.cost ? `Need ${perk.cost - goldenSlices} more` : (perk.repeatable ? 'Buy' : 'Unlock')}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              
              {/* --- TAB: UPGRADES --- */}
              {activeTab === 'upgrades' && (
                <>
                  {/* Upgrades Container - wraps filters, multiplier, and cards */}
                  <div className="bg-zinc-800/50 rounded-xl p-4 space-y-4">
                    {/* Upgrade Filter Pills */}
                    <div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'all',        label: 'All',        color: 'text-zinc-300',  activeBg: 'bg-zinc-700 border-zinc-500 text-white' },
                          { id: 'production', label: 'Production', color: 'text-blue-400',   activeBg: 'bg-blue-900/40 border-blue-500/60 text-blue-300' },
                          { id: 'quality',    label: 'Quality',    color: 'text-amber-400',  activeBg: 'bg-amber-900/40 border-amber-500/60 text-amber-300' },
                          { id: 'click',      label: 'Click',      color: 'text-orange-400', activeBg: 'bg-orange-900/40 border-orange-500/60 text-orange-300' },
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setUpgradeFilter(f.id)}
                            className={`px-3 py-1 rounded-full border text-sm font-black uppercase tracking-widest transition-all ${
                              upgradeFilter === f.id ? f.activeBg : `border-zinc-700 ${f.color} hover:border-zinc-600 bg-zinc-900/30`
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                        <div className="col-span-2 text-center text-sm text-zinc-600 font-bold uppercase tracking-widest pt-1">
                          {UPGRADES.filter(u => upgradeFilter === 'all' || u.type === upgradeFilter).length} items
                        </div>
                      </div>
                    </div>

                    {/* Buy Multiplier Toggle */}
                    <div>
                      <div className="flex bg-zinc-800 border border-zinc-600 rounded-xl p-1 mx-auto max-w-xs">
                        {[1, 5, 10, 'custom', 'MAX'].map((mult) => (
                          <button
                            key={mult}
                            onClick={() => {
                              if (mult === 5) {
                                setBuyMultiplier(5);
                              } else if (mult === 10) {
                                setBuyMultiplier(10);
                              } else if (mult === 'custom') {
                                setBuyMultiplier('custom');
                              } else if (mult === 'MAX') {
                                setBuyMultiplier('MAX');
                              } else {
                                setBuyMultiplier(1);
                              }
                            }}
                            className={`flex-1 px-2 py-2 rounded-lg font-display text-xs sm:text-sm font-black tracking-wider transition-all ${
                              buyMultiplier === mult
                                ? 'bg-zinc-700 text-white border border-zinc-500'
                                : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
                            }`}
                          >
                            {mult === 'MAX' ? 'MAX' : mult === 'custom' ? `${customBuyAmount}` : `${mult}x`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Buy Amount Input (shown when custom is selected) */}
                    {buyMultiplier === 'custom' && (
                      <div className="mt-2 px-2">
                        <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-600 rounded-lg p-2">
                          <button
                            onClick={() => setCustomBuyAmount(Math.max(1, customBuyAmount - 10))}
                            className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-sm font-bold"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => setCustomBuyAmount(Math.max(1, customBuyAmount - 1))}
                            className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-sm font-bold"
                          >
                            -1
                          </button>
                          <input
                            type="number"
                            value={customBuyAmount}
                            onChange={(e) => setCustomBuyAmount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="flex-1 bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-center text-zinc-300 font-bold text-sm w-20"
                            min="1"
                            max="9999"
                          />
                          <button
                            onClick={() => setCustomBuyAmount(customBuyAmount + 1)}
                            className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-sm font-bold"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => setCustomBuyAmount(customBuyAmount + 10)}
                            className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-sm font-bold"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Upgrade Cards */}
                  {UPGRADES.filter(u => upgradeFilter === 'all' || u.type === upgradeFilter).map((upgrade) => {
                const isLocked = franchiseLicenses === 0 && starLevel < upgrade.reqStars;
                const count = safeNum(inventory?.[upgrade.id], 0);
                const cost = getCost(upgrade);
                const nextMilestone = getNextMilestone(count);
                const multi = getMilestoneMultiplier(count);

                // Show only revealed upgrades (path-gated); applies to locked and unlocked alike
                if (!revealedUpgrades.has(upgrade.id)) return null;

                // Projected pizza price after buying this upgrade (next level)
                const nextCount = count + 1;
                let projectedPizzaPrice = 2.50;
                UPGRADES.forEach(u => {
                  if (u.type !== 'quality') return;
                  const c = u.id === upgrade.id ? nextCount : safeNum(inventory?.[u.id], 0);
                  projectedPizzaPrice += u.baseValue * c;
                });
                projectedPizzaPrice *= achievementMultiplier * vipTokenMultiplier;

                const theme = {
                  production: { bg: 'bg-blue-950',   border: 'border-blue-800',   depthBorder: 'border-b-[4px] border-blue-950',   iconBg: 'bg-blue-900 border-blue-700',   bar: 'bg-blue-400',   text: 'text-blue-300',   badge: 'bg-blue-800 text-blue-200' },
                  quality:    { bg: 'bg-amber-950',  border: 'border-amber-800',  depthBorder: 'border-b-[4px] border-amber-950',  iconBg: 'bg-amber-900 border-amber-700', bar: 'bg-amber-400',  text: 'text-amber-300',  badge: 'bg-amber-800 text-amber-200' },
                  click:      { bg: 'bg-orange-950', border: 'border-orange-800', depthBorder: 'border-b-[4px] border-orange-950', iconBg: 'bg-orange-900 border-orange-700',bar: 'bg-orange-400', text: 'text-orange-300', badge: 'bg-orange-800 text-orange-200' },
                }[upgrade.type];

                if (isLocked) {
                  return (
                    <div key={upgrade.id} className={`w-full relative overflow-hidden rounded-xl border p-4 flex items-center justify-between gap-4 opacity-40 ${theme.bg} ${theme.border}`}>
                      <div className="flex items-center gap-3 relative z-10 min-w-0">
                        <div className={`p-3 rounded-xl shadow-inner border shrink-0 ${theme.iconBg} grayscale`}>
                          {upgrade.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-display text-base text-zinc-400 tracking-wider truncate">{upgrade.name}</h3>
                            <Lock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                          </div>
                          <p className="text-xs text-zinc-500 font-bold flex items-center gap-1.5">
                            <Star className="w-3 h-3 shrink-0" /> Requires {upgrade.reqStars} ★ · {fmtInt(scaledStarThresholds[upgrade.reqStars])} rep
                          </p>
                        </div>
                      </div>
                      <div className="text-right relative z-10 shrink-0">
                        <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Next Cost</div>
                        <div className="font-display text-base font-black text-money opacity-50 tabular-nums">${fmt(cost)}</div>
                      </div>
                    </div>
                  );
                }

                // Calculate display cost and buy amount
                const maxBoost = MILESTONES[MILESTONES.length - 1]; // 250
                const allowedPurchases = Math.max(0, maxBoost - count);
                let buyAmount = 0;
                let displayCost = 0;
                let intendedCost = 0;

                if (buyMultiplier === 'MAX') {
                  const maxBundle = calculateMaxAffordable(upgrade.baseCost, count, money, allowedPurchases);
                  buyAmount = maxBundle.amount;
                  displayCost = maxBundle.cost;
                  // If can't afford any, show cost of 1 upgrade
                  intendedCost = maxBundle.amount > 0 ? maxBundle.cost : calculateCost(upgrade.baseCost, count);
                  // Ensure we never try to buy more than 250 total upgrades
                  if (count + buyAmount > 250) {
                    const cappedAmount = Math.max(0, 250 - count);
                    buyAmount = cappedAmount;
                    displayCost = cappedAmount > 0 ? calculateBulkCost(upgrade.baseCost, count, cappedAmount) : 0;
                  }
                } else if (buyMultiplier === 'custom') {
                  const requestedAmount = Math.min(customBuyAmount, allowedPurchases);
                  const affordableBundle = calculateMaxAffordable(upgrade.baseCost, count, money, requestedAmount);
                  buyAmount = affordableBundle.amount;
                  displayCost = affordableBundle.cost;
                  // For intendedCost, use the actual purchasable amount (respecting 250 cap)
                  const actualCustomAmount = Math.min(customBuyAmount, Math.max(0, 250 - count));
                  intendedCost = calculateBulkCost(upgrade.baseCost, count, actualCustomAmount);
                } else {
                  // Keep the multiplier locked - buy what you can afford, not what the multiplier says
                  const requestedAmount = Math.min(Number(buyMultiplier), allowedPurchases);
                  const affordableBundle = calculateMaxAffordable(upgrade.baseCost, count, money, requestedAmount);
                  buyAmount = affordableBundle.amount;
                  displayCost = affordableBundle.cost;
                  // For intendedCost, always use the full multiplier amount (not capped by allowedPurchases)
                  intendedCost = calculateBulkCost(upgrade.baseCost, count, Number(buyMultiplier));
                  
                  // Don't change the multiplier - keep it locked at user's selection
                  // This prevents accidental 1x purchases when user has 10x locked
                }

                const canAfford = buyAmount > 0;
                
                return (
                  <div key={upgrade.id} className="bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-950 border-t-zinc-700 rounded-xl shadow-[0_8px_0_#000000] p-4 gap-4 relative group">
                    
                    {/* Desktop: Horizontal Layout | Mobile: Vertical Layout */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      
                      {/* Icon Block */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg bg-zinc-950 border border-zinc-900 shadow-inner flex items-center justify-center relative overflow-hidden group-hover:border-zinc-800 transition-colors">
                        <div className={`text-3xl sm:text-4xl ${
                          upgrade.type === 'production' ? 'text-blue-400' :
                          upgrade.type === 'quality' ? 'text-amber-400' :
                          'text-orange-400'
                        }`}>
                          {upgrade.icon}
                        </div>
                        
                        {/* Owned Badge */}
                        {count > 0 && (
                          <div className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 bg-zinc-900 border border-zinc-700 px-1.5 py-1 rounded shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-10 flex items-center">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-display text-lg sm:text-xl font-black text-amber-100 tracking-wider leading-tight">{upgrade.name}</h3>
                              {/* Milestone Multiplier Badges */}
                              {MILESTONES.map((milestone, idx) => {
                                if (count >= milestone) {
                                  const multiplier = MILESTONE_MULTS_OVERRIDE[idx];
                                  return (
                                    <span key={milestone} className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider shrink-0 ${
                                      upgrade.type === 'production' ? 'bg-blue-900/60 text-blue-300 border border-blue-700' :
                                      upgrade.type === 'quality' ? 'bg-amber-900/60 text-amber-300 border border-amber-700' :
                                      'bg-orange-900/60 text-orange-300 border border-orange-700'
                                    }`}>
                                      {multiplier}×
                                    </span>
                                  );
                                }
                                return null;
                              })}
                            </div>
                            <p className="text-xs sm:text-sm text-zinc-300 font-medium tabular-nums">
                              {upgrade.type === 'production' && (() => {
                                const cur = fmt(upgrade.baseValue * count * multi * vipTokenMultiplier);
                                const nxt = fmt(upgrade.baseValue * (count + 1) * getMilestoneMultiplier(count + 1) * vipTokenMultiplier);
                                return count === 0
                                  ? <span>Next: <span className="text-blue-400 font-bold">+{nxt}/sec</span></span>
                                  : <span><span className="text-blue-400 font-bold">{cur}/sec</span><span className="text-zinc-500 mx-1">→</span><span className="text-blue-300 font-bold">{nxt}/sec</span></span>;
                              })()}
                              {upgrade.type === 'quality' && (() => {
                                const gainPerPizza = upgrade.baseValue;
                                return count === 0
                                  ? <span>Next: <span className="text-amber-400 font-bold">+<span className="text-amber-300">${Math.floor(gainPerPizza * 100) / 100}</span>/pizza</span></span>
                                  : <span><span className="text-amber-400 font-bold">+<span className="text-amber-300">${Math.floor(gainPerPizza * 100) / 100}</span>/pizza</span><span className="text-zinc-500 mx-1">→</span><span className="text-amber-300 font-bold">${fmt(projectedPizzaPrice)}/pizza</span></span>;
                              })()}
                              {upgrade.type === 'click' && (() => {
                                const cur = fmt(upgrade.baseValue * count * multi * franchiseMultiplier * starPowerMultiplier * vipTokenMultiplier);
                                const nxt = fmt(upgrade.baseValue * (count + 1) * getMilestoneMultiplier(count + 1) * franchiseMultiplier * starPowerMultiplier * vipTokenMultiplier);
                                return count === 0
                                  ? <span>Next: <span className="text-orange-400 font-bold">+{nxt} pizzas/click</span></span>
                                  : <span><span className="text-orange-400 font-bold">{cur}/click</span><span className="text-zinc-500 mx-1">→</span><span className="text-orange-300 font-bold">{nxt}/click</span></span>;
                              })()}
                            </p>
                          </div>
                        </div>

                        {/* Laser Cut Progress Bar */}
                        {nextMilestone !== 'MAX' && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-sm font-display font-black text-zinc-400 tabular-nums">
                                {count}/{nextMilestone}
                              </div>
                              <div className="text-sm font-black text-zinc-500 uppercase tracking-wider tabular-nums">
                                Next ${fmt(cost)}
                              </div>
                            </div>
                            <div className="h-1.5 bg-zinc-950 rounded-full relative shadow-inner overflow-hidden border border-zinc-900/50">
                              <div className="h-full bg-amber-600 relative transition-all duration-300 shadow-[0_0_8px_rgba(217,119,6,0.8)]" style={{ width: `${Math.min(100, (count / nextMilestone) * 100)}%` }}></div>
                            </div>
                          </div>
                        )}

                        {nextMilestone === 'MAX' && (
                          <div className="mt-2 text-sm font-black text-zinc-500 uppercase tracking-wider tabular-nums">
                            Next ${fmt(cost)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile-Optimized Action Button */}
                    <button 
                      onClick={() => {
                        if (!canAfford || buyAmount <= 0) return;
                        if (buyAmount === 1) {
                          buyUpgrade(upgrade);
                        } else {
                          buyUpgradeN(upgrade, buyAmount);
                        }
                      }}
                      disabled={!canAfford}
                      className={`w-full h-14 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all duration-150 relative overflow-hidden group ${
                        canAfford 
                          ? 'bg-gradient-to-b from-amber-600 to-amber-700 border-amber-950 border-t-amber-500 shadow-[0_4px_0_#78350f,0_0_15px_rgba(217,119,6,0.1)] hover:from-amber-500 hover:to-amber-600 active:shadow-[0_0px_0_#78350f] active:translate-y-[4px] cursor-pointer' 
                          : 'bg-zinc-900 border-zinc-950 border-t-zinc-800 shadow-[0_4px_0_#000000] cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span className={`font-display text-xl font-black tabular-nums leading-none ${
                        canAfford ? 'text-amber-100' : 'text-zinc-600'
                      }`}>
                        ${fmt(canAfford ? displayCost : intendedCost)}
                      </span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        canAfford ? 'text-amber-200' : 'text-zinc-500'
                      }`}>
                        {(() => {
                          if (buyMultiplier === 'MAX') {
                            return buyAmount > 1 ? 'MAX' : 'BUY ×1';
                          }
                          return buyAmount > 0 ? `BUY ×${buyAmount}` : (() => {
                            if (buyMultiplier === 'custom') {
                              const actualCustomAmount = Math.min(customBuyAmount, Math.max(0, 250 - count));
                              return `BUY ×${actualCustomAmount}`;
                            }
                            return `BUY ×${buyMultiplier}`;
                          })();
                        })()}
                      </span>
                    </button>
                  </div>
                );
              })}
                  </div>
                </>
              )}

              {/* --- TAB: TIME WARP DELIVERIES --- */}
              {activeTab === 'map' && (
                <div className="bg-zinc-800/50 rounded-xl p-4">
                <div className="flex flex-col gap-4">

                  {/* Header Banner */}
                  <div className="bg-zinc-900/80 rounded-xl p-5 border border-zinc-700 shadow-inner flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Zap className="w-8 h-8 text-yellow-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-display text-xl text-yellow-100 tracking-wider">Time Warp Deliveries</h3>
                        <p className="text-sm text-zinc-400 mt-1">Instantly collect hours of idle production. Each run is on cooldown after use.</p>
                      </div>
                    </div>
                    {vipTokens > 0 && (
                      <div className="shrink-0 flex flex-col items-center bg-purple-900 border border-purple-700 border-b-[3px] border-b-purple-950 rounded-xl px-4 py-3">
                        <div className="text-sm text-purple-400 font-bold uppercase tracking-widest mb-1">VIP Tokens</div>
                        <div className="font-display text-2xl text-purple-300 tabular-nums">{vipTokens}</div>
                        <div className="text-sm text-purple-400 font-bold mt-1">+{fmt(vipTokens * 5)}% All</div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Cards */}
                  <div className="grid grid-cols-1 gap-4">
                    {DESTINATIONS.map(dest => {
                      const cooldown = deliveryCooldowns[dest.id] || 0;
                      const onCooldown = cooldown > 0;
                      const req = dest.unlockReq;
                      const isUnlocked = totalPizzasSold >= req.pizzas && starLevel >= req.stars && lifetimeMoney >= req.lifetime && franchiseLicenses >= (req.licenses || 0);
                      const WARP_CAP = 1e8;
                      const warpEfficiencyDisplay = idleProfitPerSec <= WARP_CAP ? 1.0 : 1.0 / (1 + Math.log10(idleProfitPerSec / WARP_CAP));
                      const warpMoney = idleProfitPerSec * dest.warpSeconds * warpEfficiencyDisplay;
                      const cooldownPct = onCooldown ? (cooldown / dest.cooldown) * 100 : 0;
                      if (!isUnlocked) {
                        const conditions = [
                          req.pizzas  > 0 && { label: `Sell ${fmtInt(req.pizzas)} pizzas`,          current: totalPizzasSold,       target: req.pizzas    },
                          req.stars   > 0 && { label: `Reach ${req.stars}-star reputation`,          current: starLevel,             target: req.stars     },
                          req.lifetime > 0 && { label: `Earn $${fmt(req.lifetime)} lifetime`,        current: lifetimeMoney,         target: req.lifetime  },
                          (req.licenses||0) > 0 && { label: `Own ${req.licenses} Franchise Licenses`, current: franchiseLicenses,   target: req.licenses  },
                        ].filter(Boolean);
                        return (
                          <div key={dest.id} className="w-full p-5 rounded-xl border border-zinc-700/50 bg-zinc-900/60 flex flex-col sm:flex-row items-start sm:items-center gap-4 opacity-70">
                            <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-950/60 shrink-0">
                              <Lock className="w-8 h-8 text-zinc-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-display text-xl text-zinc-400 tracking-wider mb-0.5">{dest.name}</h3>
                              <p className="text-sm text-zinc-600 font-bold uppercase tracking-widest mb-2">{dest.label}</p>
                              <p className="text-sm text-zinc-500 italic mb-3">{dest.unlockHint}</p>
                              <div className="flex flex-col gap-1.5">
                                {conditions.map(({ label, current, target }) => {
                                  const pct = Math.min(100, (current / target) * 100);
                                  return (
                                    <div key={label}>
                                      <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-zinc-500 mb-0.5">
                                        <span>{label}</span>
                                        <span className="tabular-nums text-zinc-400">{pct >= 100 ? '✓' : `${Math.floor(pct)}%`}</span>
                                      </div>
                                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-green-500' : 'bg-zinc-600'}`} style={{ width: `${pct}%` }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      }

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
                            <div className="absolute bottom-0 left-0 h-1 bg-zinc-700 w-full">
                              <div className="h-full bg-zinc-400/60 transition-all duration-1000" style={{ width: `${cooldownPct}%` }} />
                            </div>
                          )}

                          <div className="flex items-center gap-4 w-full sm:w-auto mb-3 sm:mb-0">
                            <div className={`p-4 rounded-xl shadow-inner border bg-zinc-950/50 ${dest.border} ${!onCooldown ? 'group-hover:scale-110' : ''} transition-transform shrink-0`}>
                              {dest.icon}
                            </div>
                            <div>
                              <h3 className="font-display text-xl text-zinc-100 tracking-wider mb-1">{dest.name}</h3>
                              <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest mb-2">{dest.label}</p>
                              <p className="text-sm text-zinc-400">{dest.desc}</p>
                            </div>
                          </div>

                          <div className="w-full sm:w-auto sm:text-right shrink-0 border-t border-zinc-700/50 sm:border-0 pt-3 sm:pt-0 sm:pl-4">
                            {onCooldown ? (
                              <div className="flex flex-col sm:items-end gap-1">
                                <div className="text-sm text-zinc-500 font-bold uppercase tracking-widest">Cooldown</div>
                                <div className="font-display text-2xl text-zinc-500 tabular-nums flex items-center gap-2">
                                  <Clock className="w-5 h-5" />{Math.floor(cooldown / 60)}:{String(cooldown % 60).padStart(2, '0')}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:items-end gap-1">
                                <div className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Instant Payout</div>
                                <div className="font-display text-2xl text-money tabular-nums">
                                  +$<Num value={warpMoney} decimals={0} />
                                </div>
                                {warpEfficiencyDisplay < 0.99 && (
                                  <div className="text-sm font-bold text-amber-500 tabular-nums mt-1">
                                    {fmt(warpEfficiencyDisplay * 100)}% efficiency (softcap)
                                  </div>
                                )}
                                {dest.rushSeconds > 0 && (
                                  <div className="text-sm font-bold text-red-400 flex items-center gap-1 mt-1"><Zap className="w-3 h-3 fill-red-400" />{dest.rushSeconds}s Dinner Rush</div>
                                )}
                                {dest.vipToken && (
                                  <div className="text-sm font-bold text-purple-400 flex items-center gap-1 mt-1"><Crown className="w-3 h-3" />+1 VIP Token (+5% All)</div>
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                </div>
              )}

              {/* --- TAB: ACHIEVEMENTS (Executive Portfolio) --- */}
              {activeTab === 'achievements' && <ExecutiveStickerbook unlockedIds={unlockedAchievements} />}

              {/* --- TAB: STATS --- */}
              {activeTab === 'stats' && (() => {
                return (
                  <div className="flex flex-col gap-2">
                    <AccSection sKey="production" statsOpen={statsOpen} setStatsOpen={setStatsOpen} icon={<TrendingUp className="w-4 h-4 inline" />} label="Production"
                      accentBorder="border-blue-500/20" accentBg="bg-blue-900/20" accentText="text-blue-400" valueColor="text-blue-300"
                      rows={[
                        { label: 'Idle Pizzas / Sec', value: fmt(idlePizzasPerSec), sub: 'base production rate' },
                        { label: 'Idle Profit / Sec', value: `$${fmtInt(idleProfitPerSec)}`, sub: 'without clicking' },
                        { label: 'Pizza Price', value: `$${fmt(pizzaPrice, 2)}`, sub: 'current ticket value' },
                        { label: 'Base Price', value: `$${fmt(basePizzaPrice, 2)}`, sub: 'before multipliers' },
                        { label: 'VIP Boost', value: `+${fmtInt((vipTokenMultiplier - 1) * 100)}%`, sub: 'all stats' },
                        { label: 'Ach. Boost', value: `+${fmtInt((achievementMultiplier - 1) * 100)}%`, sub: 'price only' },
                      ]}
                    />
                    <AccSection sKey="clicking" statsOpen={statsOpen} setStatsOpen={setStatsOpen} icon={<MousePointerClick className="w-4 h-4 inline" />} label="Clicking"
                      accentBorder="border-orange-500/20" accentBg="bg-orange-900/20" accentText="text-orange-400" valueColor="text-orange-300"
                      rows={[
                        { label: 'Click Power', value: fmt(currentClickPower), sub: 'pizzas per click' },
                        { label: 'Per Click $', value: `$${fmtInt(currentClickPower * pizzaPrice)}`, sub: 'money per click' },
                        { label: 'Per Click Rep', value: fmtInt(currentClickPower), sub: 'rep per click' },
                        { label: 'Total Clicks', value: fmtInt(totalClicks), sub: 'lifetime' },
                        { label: 'Click Mult.', value: `${fmtInt(franchiseMultiplier * 100)}%`, sub: `${fmtInt(franchiseLicenses)} licenses` },
                        { label: 'Combo', value: `${fmtInt(combo)}x`, sub: 'decays on idle' },
                      ]}
                    />
                    <AccSection sKey="lifetime" statsOpen={statsOpen} setStatsOpen={setStatsOpen} icon={<DollarSign className="w-4 h-4 inline" />} label="Lifetime Totals"
                      accentBorder="border-green-500/20" accentBg="bg-green-900/20" accentText="text-green-400" valueColor="text-green-300"
                      rows={[
                        { label: 'Money Earned', value: `$${fmtInt(lifetimeMoney)}`, sub: fmtInt(lifetimeMoney) },
                        { label: 'Pizzas Sold', value: fmtInt(totalPizzasSold), sub: 'all time' },
                        { label: 'Perfect Bakes', value: fmtInt(perfectBakes), sub: 'oven mini-game' },
                        { label: 'Deliveries', value: fmtInt(deliveriesCompleted), sub: 'time warp runs' },
                        { label: 'VIP Tokens', value: fmtInt(vipTokens), sub: '+8% all per token' },
                        { label: 'Achievements', value: `${unlockedAchievements.length} / ${ACHIEVEMENTS.length}`, sub: `+${unlockedAchievements.length * 3}% price` },
                      ]}
                    />
                    <AccSection sKey="prestige" statsOpen={statsOpen} setStatsOpen={setStatsOpen} icon={<Building className="w-4 h-4 inline" />} label="Prestige & Reputation"
                      accentBorder="border-purple-500/20" accentBg="bg-purple-900/20" accentText="text-purple-400" valueColor="text-purple-300"
                      rows={[
                        { label: 'Licenses', value: fmtInt(franchiseLicenses), sub: '+prod & click' },
                        { label: 'Franchise Mult', value: `${fmtInt(franchiseMultiplier * 100)}%`, sub: 'prod + click boost' },
                        { label: 'Franchise Price', value: `${fmtInt(franchisePriceMultiplier * 100)}%`, sub: '+15% $/pizza per license' },
                        { label: 'Star Power', value: `${fmtInt(starPowerMultiplier * 100)}%`, sub: `1.6^${fmtInt(starLevel)} stars` },
                        { label: 'Pending', value: fmtInt(pendingLicenses), sub: 'available to claim' },
                        { label: 'Star Level', value: `${'★'.repeat(starLevel)}${'☆'.repeat(Math.max(0, 5 - starLevel))}`, sub: `${fmtInt(nextStarReq)} rep for next` },
                        { label: 'Next License', value: `$${fmtInt(nextLicenseCost)}`, sub: 'lifetime earnings req.' },
                      ]}
                    />

                    {/* Upgrades Owned — inline accordion */}
                    <div className="bg-zinc-900/60 border border-zinc-600/30 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setStatsOpen(prev => ({ ...prev, owned: !prev.owned }))}
                        className="w-full px-4 py-2.5 bg-zinc-800/40 flex items-center justify-between gap-2 hover:brightness-110 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-zinc-400" />
                          <span className="text-sm font-black uppercase tracking-widest text-zinc-400">Upgrades Owned</span>
                        </div>
                        <span className={`text-sm font-black text-zinc-400 transition-transform duration-200 ${statsOpen.owned ? 'rotate-180' : ''}`}>▾</span>
                      </button>
                      {statsOpen.owned && (
                        <div className="divide-y divide-zinc-800/60">
                          {['production', 'quality', 'click'].map(type => {
                            const typeUpgrades = UPGRADES.filter(u => u.type === type);
                            const colors = { production: 'text-blue-400', quality: 'text-amber-400', click: 'text-orange-400' };
                            const labels = { production: 'Production', quality: 'Quality', click: 'Click' };
                            return (
                              <div key={type} className="px-4 py-3">
                                <div className={`text-sm font-black uppercase tracking-widest mb-2 ${colors[type]}`}>{labels[type]}</div>
                                <div className="flex flex-wrap gap-2">
                                  {typeUpgrades.map(u => {
                                    const count = safeNum(inventory?.[u.id], 0);
                                    const locked = franchiseLicenses === 0 && starLevel < u.reqStars;
                                    return (
                                      <div key={u.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-sm font-bold tabular-nums ${
                                        locked ? 'bg-zinc-900/40 border-zinc-700/30 text-zinc-600' :
                                        count > 0 ? `bg-zinc-900/60 border-zinc-600/40 ${colors[type]}` :
                                        'bg-zinc-900/40 border-zinc-700/30 text-zinc-500'
                                      }`}>
                                        {u.name}
                                        <span className="bg-zinc-950/60 px-1.5 py-0.5 rounded font-display">
                                          {locked ? '🔒' : count}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* --- TAB: MARKET --- */}
              {activeTab === 'market' && (
                <div className="flex flex-col gap-4">
                  {!marketUnlocked ? (
                    /* Locked State */
                    <div className="flex flex-col items-center justify-center py-16 gap-6">
                      <div className="p-6 rounded-full bg-zinc-800 border border-zinc-600">
                        <TrendingUp className="w-16 h-16 text-zinc-300" />
                      </div>
                      <div className="text-center">
                        <h2 className="font-display text-3xl text-zinc-100 tracking-widest mb-2">Crust Fund Stock Exchange</h2>
                        <p className="text-zinc-500 text-sm max-w-sm">Trade ingredient commodities. Flour and Pepperoni shares passively boost your production and pizza price.</p>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-8 py-5 text-center">
                        <div className="text-sm text-zinc-500 font-black uppercase tracking-widest mb-1">Unlock Cost</div>
                        <div className="font-display text-3xl text-zinc-200 tabular-nums mb-4">$25,000</div>
                        <button
                          onClick={() => { if (money >= 25000) { setMoney(m => m - 25000); setMarketUnlocked(true); pushLog('spend', '🔓 Unlock Market', -25000); } }}
                          disabled={money < 25000}
                          className={`px-8 py-3 rounded-xl font-display text-lg tracking-widest btn-tactile ${money >= 25000 ? 'bg-zinc-600 hover:bg-zinc-500 text-white border-b-[3px] border-zinc-900 active:border-b-0 active:translate-y-[3px]' : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800'}`}
                        >
                          {money >= 25000 ? 'Open the Exchange' : `Need $${Math.floor(25000 - money).toLocaleString()} more`}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Unlocked Market — Terminal UI */
                    <>
                      {/* ── Terminal Header Bar ── */}
                      <div className="bg-zinc-900 border border-zinc-700/60 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
                        {/* Top chrome strip */}
                        <div className="bg-gradient-to-r from-zinc-800 to-zinc-850 border-b border-zinc-700/50 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                              <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                            </div>
                            <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">PESE — Crust Fund Stock Exchange</span>
                          </div>
                          <span className="text-sm text-zinc-600 font-mono tabular-nums">15s interval · live</span>
                        </div>

                        {/* Portfolio summary row */}
                        {(() => {
                          const totalVal = marketShares.flour * marketPrices.flour + marketShares.cheese * marketPrices.cheese + marketShares.pepperoni * marketPrices.pepperoni + marketShares.truffles * marketPrices.truffles;
                          const totalShares = marketShares.flour + marketShares.cheese + marketShares.pepperoni + marketShares.truffles;
                          const hasSynergy = marketShares.flour > 0 || marketShares.pepperoni > 0;
                          return (
                            <div className="px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                              <div>
                                <div className="text-sm text-zinc-600 font-black uppercase tracking-widest mb-0.5">Total Portfolio</div>
                                <div className="font-mono text-2xl text-zinc-100 tabular-nums font-bold">${fmt(totalVal)}</div>
                                {portfolioDelta !== null && portfolioDelta !== 0 && (
                                  <div className={`flex items-center gap-1 mt-0.5 ${portfolioDelta > 0 ? 'text-money' : 'text-red-400'}`}>
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                      {portfolioDelta > 0
                                        ? <><polyline points="1,9 4,4 7,6 11,2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8,2 11,2 11,5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>
                                        : <><polyline points="1,3 4,8 7,6 11,10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8,10 11,10 11,7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>}
                                    </svg>
                                    <span className="text-sm font-black font-mono tabular-nums">{portfolioDelta > 0 ? '+' : ''}${fmt(portfolioDelta)} session P&L</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-4">
                                <div className="text-right">
                                  <div className="text-sm text-zinc-600 font-black uppercase tracking-widest mb-0.5">Shares Held</div>
                                  <div className="font-mono text-lg text-zinc-300 tabular-nums font-bold">{fmtInt(totalShares)}</div>
                                </div>
                                {hasSynergy && (
                                  <div className="text-right border-l border-zinc-700/50 pl-4">
                                    <div className="text-sm text-zinc-600 font-black uppercase tracking-widest mb-0.5">Active Synergies</div>
                                    <div className="flex flex-col items-end gap-0.5">
                                      {marketShares.flour > 0 && <span className="text-sm text-zinc-300 font-mono">🌾 +{fmt(marketShares.flour * 0.1)}% Prod</span>}
                                      {marketShares.pepperoni > 0 && <span className="text-sm text-zinc-300 font-mono">🍕 +{fmt(marketShares.pepperoni * 0.1)}% Price</span>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Ticker tape */}
                        <div className="border-t border-zinc-700/50 bg-zinc-950/60 px-4 py-1.5 flex gap-6 overflow-x-auto scrollbar-none">
                          {[
                            { key: 'flour', ticker: 'FLUR' },
                            { key: 'cheese', ticker: 'CHSE' },
                            { key: 'pepperoni', ticker: 'PPRI' },
                            { key: 'truffles', ticker: 'TRFL' },
                          ].map(({ key, ticker }) => (
                            <div key={key} className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-black text-zinc-500 tracking-widest font-mono">{ticker}</span>
                              <span className={`text-sm font-bold font-mono tabular-nums ${marketTrends[key] === 1 ? 'text-money' : 'text-red-400'}`}>
                                ${fmt(marketPrices[key])}
                              </span>
                              <span className={`text-sm font-mono ${marketTrends[key] === 1 ? 'text-green-600' : 'text-red-600'}`}>
                                {marketTrends[key] === 1 ? '▲' : '▼'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Market Controls (shared global cooldown) ── */}
                      {(() => {
                        const TARGETS = [
                          { key: 'flour',     label: 'Flour',     emoji: '🌾' },
                          { key: 'cheese',    label: 'Cheese',    emoji: '🧀' },
                          { key: 'pepperoni', label: 'Pepperoni', emoji: '🍕' },
                          { key: 'truffles',  label: 'Truffles',  emoji: '💎' },
                        ];
                        const rumorCd   = marketCooldowns.rumors;
                        const squeezeCd = marketCooldowns.squeeze;
                        const targetPrice = marketPrices[manipTarget];
                        const targetShares = marketShares[manipTarget];
                        const forceSellTarget = (sellPrice = targetPrice, actionLabel = 'Squeeze Sell') => {
                          if (targetShares > 0) {
                            const proceeds = targetShares * sellPrice * 0.995;
                            setMoney(m => m + proceeds);
                            setLifetimeMoney(lm => lm + proceeds);
                            setMarketShares(prev => ({ ...prev, [manipTarget]: 0 }));
                            setMarketCostBasis(prev => ({ ...prev, [manipTarget]: 0 }));
                            const targetLabel = {
                              flour: 'Flour',
                              cheese: 'Cheese', 
                              pepperoni: 'Pepperoni',
                              truffles: 'Truffles'
                            }[manipTarget];
                            pushLog('market', `📈 ${actionLabel} ${targetShares}× ${targetLabel} @ $${fmt(sellPrice)}`, proceeds);
                          }
                        };
                        return (
                          <div className="bg-zinc-900/80 border border-zinc-700/60 rounded-xl p-3 flex flex-col gap-2.5">
                            <div className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                              <Briefcase className="w-3 h-3" /> Market Controls
                              <span className="ml-auto text-zinc-700 font-mono text-sm">one action locks all</span>
                            </div>
                            {/* Target selector */}
                            <div className="flex gap-1.5">
                              {TARGETS.map(t => (
                                <button key={t.key} onClick={() => setManipTarget(t.key)}
                                  className={`flex-1 py-1.5 rounded text-sm font-black uppercase tracking-widest font-mono transition-all flex items-center justify-center gap-1 ${
                                    manipTarget === t.key
                                      ? 'bg-zinc-600 text-zinc-100 border border-zinc-400/60'
                                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300'
                                  }`}>
                                  <span>{t.emoji}</span><span className="hidden sm:inline">{t.label}</span>
                                </button>
                              ))}
                            </div>
                            {/* Action buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (rumorCd > 0) return;
                                  forceSellTarget(targetPrice, 'Rumor Sell');
                                  const crashMult = 0.75 - Math.min(0.15, franchiseLicenses * 0.015);
                                  setMarketPrices(p => ({ ...p, [manipTarget]: parseFloat((p[manipTarget] * crashMult).toFixed(2)) }));
                                  setMarketCooldowns(c => ({ ...c, rumors: 600 }));
                                }}
                                disabled={rumorCd > 0}
                                className={`flex-1 py-2 rounded text-sm font-black uppercase tracking-widest font-mono transition-all ${
                                  rumorCd > 0
                                    ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-zinc-800'
                                    : 'bg-red-950/60 hover:bg-red-900/60 text-red-400 border border-red-800/50'
                                }`}
                              >
                                {rumorCd > 0 ? `📉 ${Math.floor(rumorCd / 60)}m${rumorCd % 60}s` : '📉 Rumor'}
                              </button>
                              <button
                                onClick={() => {
                                  if (squeezeCd > 0) return;
                                  const squeezeMult = 1.3 + Math.min(1.0, franchiseLicenses * 0.08);
                                  const squeezedPrice = parseFloat((targetPrice * squeezeMult).toFixed(2));
                                  setMarketPrices(p => ({ ...p, [manipTarget]: squeezedPrice }));
                                  forceSellTarget(squeezedPrice, 'Squeeze Sell');
                                  setMarketCooldowns(c => ({ ...c, squeeze: 600 }));
                                }}
                                disabled={squeezeCd > 0}
                                className={`flex-1 py-2 rounded text-sm font-black uppercase tracking-widest font-mono transition-all ${
                                  squeezeCd > 0
                                    ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-zinc-800'
                                    : 'bg-green-950/60 hover:bg-green-900/60 text-green-400 border border-green-800/50'
                                }`}
                              >
                                {squeezeCd > 0 ? `📈 ${Math.floor(squeezeCd / 60)}m${squeezeCd % 60}s` : '📈 Squeeze'}
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* ── Commodity Cards ── */}
                      {(() => {
                        const COMMODITIES = [
                          { key: 'flour',     label: 'Flour',     ticker: 'FLUR', emoji: '🌾', synergy: '+1% Production per 10 shares' },
                          { key: 'cheese',    label: 'Cheese',    ticker: 'CHSE', emoji: '🧀', synergy: null },
                          { key: 'pepperoni', label: 'Pepperoni', ticker: 'PPRI', emoji: '🍕', synergy: '+1% Pizza Price per 10 shares' },
                          { key: 'truffles',  label: 'Truffles',  ticker: 'TRFL', emoji: '💎', synergy: null },
                        ];

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {COMMODITIES.map(({ key, label, ticker, emoji, synergy }) => {
                              const price = marketPrices[key];
                              const trend = marketTrends[key];
                              const shares = marketShares[key];
                              const holdingValue = shares * price;
                              const FEE = 0.005;
                              const canBuy1  = money >= price * 1 * (1 + FEE);
                              const canBuy10 = money >= price * 10 * (1 + FEE);
                              const maxBuy   = Math.floor(money / (price * (1 + FEE)));
                              const buyShares = (n) => {
                                const cost = price * n * (1 + FEE);
                                if (money < cost) return;
                                setMoney(m => m - cost);
                                setMarketShares(prev => ({ ...prev, [key]: prev[key] + n }));
                                setMarketCostBasis(prev => ({ ...prev, [key]: prev[key] + cost }));
                                setTotalMarketTrades(t => t + 1);
                                pushLog('market', `📉 Buy ${n}× ${label} @ $${fmt(price)}`, -cost);
                              };
                              const sellAll = () => {
                                if (shares <= 0) return;
                                const proceeds = shares * price * (1 - FEE);
                                const basis = marketCostBasis[key] || 0;
                                const pnl = proceeds - basis;
                                                setMoney(m => m + proceeds);
                                setLifetimeMoney(lm => lm + proceeds);
                                setMarketShares(prev => ({ ...prev, [key]: 0 }));
                                setMarketCostBasis(prev => ({ ...prev, [key]: 0 }));
                                setTotalMarketTrades(t => t + 1);
                                if (pnl > 0) {
                                  setMarketProfitLifetime(p => p + pnl);
                                  setBiggestMarketGain(prev => Math.max(prev, pnl));
                                }
                                pushLog('market', `📈 Sell ${shares}× ${label} (P&L: ${pnl >= 0 ? '+' : ''}$${fmt(pnl)})`, proceeds);
                              };

                              // Chart math
                              const history = marketHistory[key] || [];
                              const csColor = { up: '#22c55e', down: '#ef4444', wick: '#52525b' };
                              const candles = [];
                              for (let i = 1; i < history.length; i++) {
                                const open  = history[i - 1];
                                const close = history[i];
                                const high  = Math.max(open, close) * 1.005;
                                const low   = Math.min(open, close) * 0.995;
                                candles.push({ open, close, high, low });
                              }
                              const grouped = candles.slice(-16);
                              const allPrices = grouped.length > 0 ? grouped.flatMap(c => [c.high, c.low]) : [price * 0.9, price * 1.1];
                              const priceMin = Math.min(...allPrices);
                              const priceMax = Math.max(...allPrices);
                              const priceRange = priceMax - priceMin || price * 0.1 || 1;
                              const labelW = 44;
                              const svgH = 110, svgW = 240, padT = 10, padB = 10, padL = labelW + 4, padR = 6;
                              const chartH = svgH - padT - padB;
                              const chartW = svgW - padL - padR;
                              const toY = (p) => padT + chartH - ((p - priceMin) / priceRange) * chartH;
                              const candleW = grouped.length > 0 ? chartW / grouped.length : chartW;
                              const midPrice = (priceMin + priceMax) / 2;
                              // Session high/low from history
                              const sessionHigh = history.length > 0 ? Math.max(...history) : price;
                              const sessionLow  = history.length > 0 ? Math.min(...history) : price;
                              const sessionRange = sessionHigh - sessionLow || 1;
                              const pricePosPct = Math.min(100, Math.max(0, ((price - sessionLow) / sessionRange) * 100));

                              return (
                                <div key={key} className="bg-zinc-900 border border-zinc-700/50 rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]">

                                  {/* Card header */}
                                  <div className="px-4 pt-3 pb-2 flex items-start justify-between border-b border-zinc-800">
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-xl leading-none">{emoji}</span>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-xs font-black text-zinc-400 tracking-widest">{ticker}</span>
                                          {synergy && <span className="text-[8px] bg-zinc-800 border border-zinc-700 text-zinc-500 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">SYNERGY</span>}
                                        </div>
                                        <div className="font-display text-base text-zinc-100 tracking-wide leading-tight">{label}</div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className={`font-mono text-xl font-bold tabular-nums leading-tight ${trend === 1 ? 'text-green-400' : 'text-red-400'}`}>
                                        ${fmt(price)}
                                      </div>
                                      <div className={`flex items-center justify-end gap-1 text-[10px] font-mono ${trend === 1 ? 'text-green-600' : 'text-red-600'}`}>
                                        {trend === 1 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        <span>{trend === 1 ? 'BID UP' : 'BID DOWN'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Candlestick chart */}
                                  <div className="bg-zinc-950 border-b border-zinc-800">
                                    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" style={{ display: 'block', height: '110px' }}>
                                      {/* BG grid */}
                                      {[priceMax, midPrice, priceMin].map((p, gi) => {
                                        const y = toY(p);
                                        return (
                                          <g key={gi}>
                                            <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#27272a" strokeWidth="0.8" />
                                            <text x={labelW} y={y - 2} textAnchor="end" fontSize="7.5" fill="#71717a" fontFamily="monospace">${fmt(p)}</text>
                                          </g>
                                        );
                                      })}
                                      {/* Current price dashed line */}
                                      {grouped.length > 0 && (() => {
                                        const cy = toY(price);
                                        return <>
                                          <line x1={padL} y1={cy} x2={svgW - padR} y2={cy} stroke={trend === 1 ? '#16a34a' : '#dc2626'} strokeWidth="0.6" strokeDasharray="3,2" strokeOpacity="0.7" />
                                          <rect x={svgW - padR} y={cy - 5} width={padR + 2} height={10} fill={trend === 1 ? '#16a34a' : '#dc2626'} fillOpacity="0.15" />
                                        </>;
                                      })()}
                                      {/* Candles */}
                                      {grouped.map((c, i) => {
                                        const isUp = c.close >= c.open;
                                        const x = padL + i * candleW + candleW / 2;
                                        const bodyTop = toY(Math.max(c.open, c.close));
                                        const bodyBot = toY(Math.min(c.open, c.close));
                                        const bodyH = Math.max(bodyBot - bodyTop, 1.5);
                                        const bw = Math.max(candleW * 0.55, 2);
                                        return (
                                          <g key={i}>
                                            <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={isUp ? '#16a34a' : '#dc2626'} strokeWidth="0.8" strokeOpacity="0.6" />
                                            <rect x={x - bw/2} y={bodyTop} width={bw} height={bodyH} fill={isUp ? '#22c55e' : '#ef4444'} fillOpacity={isUp ? '0.85' : '0.9'} rx="0.5" />
                                          </g>
                                        );
                                      })}
                                      {grouped.length === 0 && (
                                        <text x={svgW/2} y={svgH/2+3} textAnchor="middle" fontSize="7" fill="#3f3f46" fontFamily="monospace">awaiting price data</text>
                                      )}
                                    </svg>
                                  </div>

                                  {/* Session range bar */}
                                  <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-3">
                                    <span className="text-[9px] font-mono text-zinc-600 tabular-nums shrink-0">L ${fmt(sessionLow)}</span>
                                    <div className="flex-1 h-1 bg-zinc-800 rounded-full relative">
                                      <div className="absolute h-1 bg-gradient-to-r from-red-500 to-green-500 rounded-full" style={{ width: '100%', opacity: 0.25 }} />
                                      <div className="absolute w-2 h-2 rounded-full bg-white -top-0.5 -translate-x-1/2" style={{ left: `${pricePosPct}%` }} />
                                    </div>
                                    <span className="text-[9px] font-mono text-zinc-600 tabular-nums shrink-0">H ${fmt(sessionHigh)}</span>
                                  </div>

                                  {/* Stats row */}
                                  <div className="px-4 py-2 grid grid-cols-3 gap-2 border-b border-zinc-800">
                                    <div>
                                      <div className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Shares</div>
                                      <div className="font-mono text-sm text-zinc-200 tabular-nums font-bold">{fmtInt(shares)}</div>
                                    </div>
                                    <div>
                                      <div className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Value</div>
                                      <div className="font-mono text-sm text-zinc-200 tabular-nums font-bold">${fmt(holdingValue)}</div>
                                    </div>
                                    <div>
                                      <div className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Avg Cost</div>
                                      <div className="font-mono text-sm text-zinc-400 tabular-nums">{shares > 0 && marketCostBasis[key] > 0 ? `$${fmt(marketCostBasis[key] / shares)}` : '—'}</div>
                                    </div>
                                  </div>

                                  {/* Synergy info */}
                                  {synergy && shares > 0 && (
                                    <div className="px-4 py-1.5 bg-zinc-950/40 border-b border-zinc-800 flex items-center justify-between">
                                      <span className="text-[9px] text-zinc-500 font-mono">{synergy}</span>
                                      <span className="text-[9px] text-green-500 font-mono font-bold">ACTIVE</span>
                                    </div>
                                  )}

                                  {/* Action bar */}
                                  <div className="p-3 pt-0 flex gap-2">
                                    <button onClick={() => buyShares(1)} disabled={!canBuy1}
                                      className={`flex-1 py-2 rounded text-sm font-black uppercase tracking-widest font-mono transition-all ${canBuy1 ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'}`}>
                                      +1
                                    </button>
                                    <button onClick={() => buyShares(10)} disabled={!canBuy10}
                                      className={`flex-1 py-2 rounded text-sm font-black uppercase tracking-widest font-mono transition-all ${canBuy10 ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'}`}>
                                      +10
                                    </button>
                                    <button onClick={() => buyShares(maxBuy)} disabled={maxBuy <= 0}
                                      className={`flex-1 py-2 rounded text-sm font-black uppercase tracking-widest font-mono transition-all ${maxBuy > 0 ? 'bg-zinc-600 hover:bg-zinc-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'}`}>
                                      MAX
                                    </button>
                                    <div className="w-px bg-zinc-700 mx-1 self-stretch" />
                                    <button onClick={sellAll} disabled={shares <= 0}
                                      className={`flex-1 py-2 rounded text-sm font-black uppercase tracking-widest font-mono transition-all ${shares > 0 ? 'bg-red-950 hover:bg-red-900 text-red-400 border border-red-800/60 shadow-[inset_0_1px_0_rgba(255,100,100,0.08)]' : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'}`}>
                                      SELL
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}

              {/* --- TAB: LOG --- */}
              {activeTab === 'log' && (() => {
                const CAT_META = {
                  click:    { icon: '🖱️', label: 'Click Income',      color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-500/20' },
                  idle:     { icon: '⚙️', label: 'Idle Production',   color: 'text-blue-400',   bg: 'bg-blue-900/20 border-blue-500/20'   },
                  oven:     { icon: '🔥', label: 'Oven Pull',         color: 'text-amber-400',  bg: 'bg-amber-900/20 border-amber-500/20' },
                  delivery: { icon: '🚗', label: 'Delivery',          color: 'text-green-400',  bg: 'bg-green-900/20 border-green-500/20' },
                  golden:   { icon: '✨', label: 'Golden Slice',      color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-500/20'},
                  market:   { icon: '📈', label: 'Market',            color: 'text-emerald-400',bg: 'bg-emerald-900/20 border-emerald-500/20'},
                  spend:    { icon: '💸', label: 'Expense',           color: 'text-red-400',    bg: 'bg-red-900/20 border-red-500/20'     },
                };
                const totals = moneyLog.reduce((acc, e) => {
                  acc[e.category] = (acc[e.category] || 0) + e.amount;
                  return acc;
                }, {});
                const now = Date.now();
                const fmtAge = (ts) => {
                  const s = Math.floor((now - ts) / 1000);
                  if (s < 60) return `${s}s ago`;
                  if (s < 3600) return `${Math.floor(s/60)}m ago`;
                  return `${Math.floor(s/3600)}h ago`;
                };
                return (
                  <div className="flex flex-col gap-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ScrollText className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-black uppercase tracking-widest text-zinc-400">Transaction Log</span>
                        <span className="text-xs bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded font-mono">{moneyLog.length}/200</span>
                      </div>
                      <button
                        onClick={() => setMoneyLog([])}
                        className="text-xs font-black uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-colors border border-zinc-700 hover:border-red-800 px-2 py-1 rounded"
                      >Clear</button>
                    </div>

                    {/* Summary pills */}
                    {moneyLog.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(totals).map(([cat, total]) => {
                          const m = CAT_META[cat] || CAT_META.idle;
                          return (
                            <div key={cat} className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-sm font-bold ${m.bg}`}>
                              <span>{m.icon}</span>
                              <span className="text-zinc-400 uppercase tracking-widest">{m.label}</span>
                              <span className={`font-display tabular-nums ${m.color}`}>${fmt(total)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Empty state */}
                    {moneyLog.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-600">
                        <ScrollText className="w-10 h-10 opacity-30" />
                        <p className="text-sm font-bold uppercase tracking-widest">No transactions yet</p>
                        <p className="text-xs text-zinc-700">Start clicking or wait for idle income.</p>
                      </div>
                    )}

                    {/* Entries — fixed height, fades at bottom, new entries slide in */}
                    <div className="relative">
                      <div className="overflow-y-auto flex flex-col" style={{ maxHeight: '420px' }}>
                        {moneyLog.map((entry) => {
                          const m = CAT_META[entry.category] || CAT_META.idle;
                          const isPositive = entry.amount >= 0;
                          return (
                            <div key={entry.id}
                              className="flex items-center gap-3 py-2.5 px-1 border-b border-zinc-800/60 animate-[logSlideIn_0.2s_ease-out]"
                            >
                              <span className="text-lg w-7 text-center shrink-0">{m.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-zinc-300 truncate">{entry.label}</div>
                                <div className="text-xs text-zinc-600 font-mono tabular-nums">{fmtAge(entry.ts)}</div>
                              </div>
                              <div className={`font-display text-lg font-black tabular-nums shrink-0 ${isPositive ? m.color : 'text-red-400'}`}>
                                {isPositive ? '+' : ''}<span className="text-money">$</span>{fmt(Math.abs(entry.amount))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Fade overlay at bottom */}
                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-800 to-transparent" />
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* ── MONETIZATION STRIP ── */}
            <div className="fixed bottom-0 inset-x-0 z-30 border-t-2 border-zinc-700 bg-zinc-900/95 backdrop-blur-sm px-4 py-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                <Zap className="w-3 h-3 text-zinc-600" />
                Monetization
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setIsMuted(m => !m); _isMuted = !_isMuted; }} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
                  isMuted
                    ? 'border-zinc-600/50 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
                  : 'border-zinc-600/50 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
                }`}
                >
                  {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  {isMuted ? 'Muted' : 'Sound'}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-700 bg-amber-900 text-[10px] font-black uppercase tracking-widest text-amber-300 hover:bg-amber-800 transition-colors btn-tactile border-b-[2px] border-b-amber-950 active:border-b-0 active:translate-y-[2px]">
                  <Crown className="w-3 h-3" /> Premium Pass
                </button>
              </div>
            </div>

        </div>

      <style dangerouslySetInnerHTML={{__html: `
        *, *::-webkit-scrollbar { scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }

        .tabular-nums { font-variant-numeric: tabular-nums; }

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
          filter: drop-shadow(0px 2px 1px rgba(0,0,0,0.9));
        }

        .text-money { color: #84cc16; }
        /* Tactile depth button base — add border-b-[N] border-[darker-color] and active:border-b-0 active:translate-y-[N] */
        .btn-tactile {
          transition: border-bottom-width 80ms ease, transform 80ms ease, background-color 120ms ease;
        }

        @keyframes logSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%   { transform: translate(0, 0) rotate(0deg); }
          15%  { transform: translate(-4px, 3px) rotate(-1deg); }
          30%  { transform: translate(4px, -3px) rotate(1deg); }
          45%  { transform: translate(-3px, 4px) rotate(0.5deg); }
          60%  { transform: translate(3px, -2px) rotate(-0.5deg); }
          75%  { transform: translate(-2px, 3px) rotate(0.3deg); }
          90%  { transform: translate(2px, -1px) rotate(-0.3deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes floatUpFade {
          0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -100px) scale(1.3); }
        }
        .floating-popup {
          animation: floatUpFade 0.8s ease-out forwards;
          will-change: transform, opacity;
          font-family: 'Oswald', sans-serif;
          text-shadow: 0px 3px 0px rgba(0,0,0,0.9), 1px 1px 1px rgba(0,0,0,0.9), -1px -1px 1px rgba(0,0,0,0.9);
        }
        @keyframes pizzaSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .pizza-spin { animation: pizzaSpin 20s linear infinite; }

        @keyframes premium-burst {
          0%   { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 1; }
          15%  { transform: translate(calc(-50% + var(--tx) * 0.6), calc(-50% + var(--ty) * 0.6)) scale(var(--scale)) rotate(calc(var(--rot) * 0.5)); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty) + 60px)) scale(0) rotate(var(--rot)); opacity: 0; }
        }
        .animate-premium-burst { animation: premium-burst ease-out forwards; }
      `}} />

    </div>
  </div>
    <Analytics />
    </>
  );
}

