import { kv } from '@vercel/kv';

// Global pizza tracking keys
const GLOBAL_PIZZAS_KEY = 'global_pizzas_total';
const GLOBAL_PIZZAS_GOAL = 1000000000; // 1 billion pizzas goal

// Get global pizza count
export async function getGlobalPizzas() {
  try {
    const total = await kv.get(GLOBAL_PIZZAS_KEY);
    return total || 0;
  } catch (error) {
    console.error('Error fetching global pizzas:', error);
    return 0;
  }
}

// Add pizzas to global total
export async function addGlobalPizzas(amount) {
  try {
    const current = await getGlobalPizzas();
    const newTotal = current + amount;
    await kv.set(GLOBAL_PIZZAS_KEY, newTotal);
    return newTotal;
  } catch (error) {
    console.error('Error adding global pizzas:', error);
    return null;
  }
}

// Get global progress percentage
export async function getGlobalProgress() {
  try {
    const total = await getGlobalPizzas();
    return Math.min((total / GLOBAL_PIZZAS_GOAL) * 100, 100);
  } catch (error) {
    console.error('Error calculating global progress:', error);
    return 0;
  }
}

// Get formatted global pizza count
export async function getFormattedGlobalPizzas() {
  try {
    const total = await getGlobalPizzas();
    
    if (total >= 1000000000) {
      return `${(total / 1000000000).toFixed(2)}B`;
    } else if (total >= 1000000) {
      return `${(total / 1000000).toFixed(2)}M`;
    } else if (total >= 1000) {
      return `${(total / 1000).toFixed(1)}K`;
    } else {
      return total.toString();
    }
  } catch (error) {
    console.error('Error formatting global pizzas:', error);
    return '0';
  }
}

// Get goal info
export function getGoalInfo() {
  return {
    current: 0, // Will be updated by getGlobalPizzas
    goal: GLOBAL_PIZZAS_GOAL,
    formattedGoal: '1B',
    progress: 0
  };
}
