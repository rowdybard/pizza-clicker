import { kv } from '@vercel/kv';

const GLOBAL_PIZZAS_KEY = 'crust_fund_global_pizzas';

export async function GET() {
  try {
    const total = await kv.get(GLOBAL_PIZZAS_KEY);
    const count = total || 0;
    
    return new Response(JSON.stringify({ 
      success: true, 
      total: count,
      formatted: formatNumber(count)
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to fetch global stats' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount } = body;
    
    if (typeof amount !== 'number' || amount <= 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid amount. Must be a positive number.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Atomically increment the global counter
    const newTotal = await kv.incrby(GLOBAL_PIZZAS_KEY, amount);
    
    return new Response(JSON.stringify({ 
      success: true, 
      total: newTotal,
      added: amount,
      formatted: formatNumber(newTotal)
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error updating global stats:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to update global stats' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function formatNumber(num) {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(2)}B`;
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else {
    return num.toString();
  }
}
