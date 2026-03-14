import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // Check if KV/Redis is available
    if (!process.env.REDIS_URL) {
      console.warn('Redis environment variables not found, returning mock data');
      return Response.json({ 
        success: true, 
        total: 0,
        mock: true
      });
    }

    const total = await kv.get('crust_fund_global_pizzas');
    const count = total || 0;
    
    return Response.json({ 
      success: true, 
      total: count
    });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch global stats' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Check if KV/Redis is available
    if (!process.env.REDIS_URL) {
      console.warn('Redis environment variables not found, returning mock response');
      return Response.json({ 
        success: true, 
        total: 0,
        mock: true
      });
    }

    const body = await request.json();
    const { amount } = body;
    
    if (typeof amount !== 'number' || amount <= 0) {
      return Response.json({ 
        success: false, 
        error: 'Invalid amount. Must be a positive number.' 
      }, { status: 400 });
    }
    
    // Atomically increment the global counter
    const newTotal = await kv.incrby('crust_fund_global_pizzas', amount);
    
    return Response.json({ 
      success: true, 
      total: newTotal
    });
  } catch (error) {
    console.error('Error updating global stats:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to update global stats' 
    }, { status: 500 });
  }
}
