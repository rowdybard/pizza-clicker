import Redis from 'ioredis';

// Initialize Redis client
let redis;
try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
    console.log('Redis client initialized with REDIS_URL');
  } else {
    console.warn('REDIS_URL not found, using mock mode');
    redis = null;
  }
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
  redis = null;
}

export async function GET() {
  try {
    if (!redis) {
      console.warn('Redis not available, returning mock data');
      return Response.json({ 
        success: true, 
        total: 0,
        mock: true
      });
    }

    const total = await redis.get('crust_fund_global_pizzas');
    const count = total ? parseInt(total, 10) : 0;
    
    console.log('Successfully fetched global total:', count);
    
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
    if (!redis) {
      console.warn('Redis not available, returning mock response');
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
    
    console.log('POST - Attempting to add amount:', amount);
    
    // Atomically increment the global counter
    const newTotal = await redis.incrby('crust_fund_global_pizzas', amount);
    
    console.log('POST - Successfully incremented to new total:', newTotal);
    
    return Response.json({ 
      success: true, 
      total: newTotal
    });
  } catch (error) {
    console.error('POST - Error updating global stats:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to update global stats' 
    }, { status: 500 });
  }
}
