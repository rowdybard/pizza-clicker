import { kv } from '@vercel/kv';

// Cache for fallback data
let cachedTotal = 0;
let lastSuccessfulFetch = 0;

export async function GET() {
  try {
    console.log('GET - Environment check - REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'NOT SET');
    console.log('GET - Environment check - KV_REST_API_URL:', process.env.KV_REST_API_URL ? 'SET' : 'NOT SET');
    console.log('GET - Environment check - KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT SET');
    
    // Try to use KV client directly with retry
    try {
      const total = await kv.get('crust_fund_global_pizzas');
      const count = total ? parseInt(total, 10) : 0;
      
      // Update cache on successful fetch
      cachedTotal = count;
      lastSuccessfulFetch = Date.now();
      
      console.log('GET - Successfully fetched global total:', count);
      
      return Response.json({ 
        success: true, 
        total: count,
        cached: false
      });
    } catch (kvError) {
      console.error('GET - KV client error:', kvError);
      console.error('GET - KV error details:', JSON.stringify(kvError, null, 2));
      
      // If we have recent cached data (within 5 minutes), use it
      const now = Date.now();
      if (lastSuccessfulFetch > 0 && (now - lastSuccessfulFetch) < 300000) {
        console.log('GET - Using cached total:', cachedTotal, 'age:', Math.floor((now - lastSuccessfulFetch) / 1000), 'seconds');
        return Response.json({ 
          success: true, 
          total: cachedTotal,
          cached: true,
          error: 'KV client failed, using cached data: ' + kvError.message
        });
      }
      
      // Fallback to mock data
      console.log('GET - No cached data available, returning 0');
      return Response.json({ 
        success: true, 
        total: 0,
        mock: true,
        cached: false,
        error: 'KV client failed, no cache available: ' + kvError.message
      });
    }
  } catch (error) {
    console.error('GET - Error fetching global stats:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch global stats: ' + error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('POST - Environment check - REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'NOT SET');
    console.log('POST - Environment check - KV_REST_API_URL:', process.env.KV_REST_API_URL ? 'SET' : 'NOT SET');
    console.log('POST - Environment check - KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT SET');

    const body = await request.json();
    const { amount } = body;
    
    console.log('POST - Attempting to add amount:', amount);
    
    if (typeof amount !== 'number' || amount <= 0) {
      return Response.json({ 
        success: false, 
        error: 'Invalid amount. Must be a positive number.' 
      }, { status: 400 });
    }
    
    // Try to use KV client directly
    try {
      const newTotal = await kv.incrby('crust_fund_global_pizzas', amount);
      
      // Update cache on successful operation
      cachedTotal = newTotal;
      lastSuccessfulFetch = Date.now();
      
      console.log('POST - Successfully incremented to new total:', newTotal);
      
      return Response.json({ 
        success: true, 
        total: newTotal,
        cached: false
      });
    } catch (kvError) {
      console.error('POST - KV client error:', kvError);
      console.error('POST - KV error details:', JSON.stringify(kvError, null, 2));
      
      // If Redis is down, try to update cache and return cached + amount
      const estimatedTotal = cachedTotal + amount;
      console.log('POST - Redis down, returning estimated total:', estimatedTotal);
      
      return Response.json({ 
        success: true, 
        total: estimatedTotal,
        cached: true,
        estimated: true,
        error: 'KV client failed, using estimated total: ' + kvError.message
      });
    }
  } catch (error) {
    console.error('POST - Error updating global stats:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to update global stats: ' + error.message
    }, { status: 500 });
  }
}
