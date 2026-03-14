import Redis from 'ioredis';

// Cache for fallback data
let cachedTotal = 0;
let lastSuccessfulFetch = 0;

// Create Redis client function
function createRedisClient() {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not found, using mock mode');
    return null;
  }
  
  try {
    const redisUrl = process.env.REDIS_URL;
    console.log('Attempting Redis connection to:', redisUrl.substring(0, 50) + '...');
    
    const redis = new Redis(redisUrl, {
      // Optimized for serverless environments
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      // TLS for secure connections
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      // Connection pooling
      family: 4,
      keepAlive: 30000,
    });
    
    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
    
    redis.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });
    
    redis.on('close', () => {
      console.log('Redis connection closed');
    });
    
    return redis;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    return null;
  }
}

export async function GET() {
  let redis = null;
  try {
    console.log('GET - Environment check - REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'NOT SET');
    
    redis = createRedisClient();
    
    if (!redis) {
      console.warn('GET - Redis not available, returning mock data');
      return Response.json({ 
        success: true, 
        total: 0,
        mock: true,
        error: 'REDIS_URL not configured'
      });
    }

    // Connect and get value
    await redis.connect();
    const total = await redis.get('crust_fund_global_pizzas');
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
  } catch (error) {
    console.error('GET - Redis error:', error.message);
    
    // If we have recent cached data (within 5 minutes), use it
    const now = Date.now();
    if (lastSuccessfulFetch > 0 && (now - lastSuccessfulFetch) < 300000) {
      console.log('GET - Using cached total:', cachedTotal, 'age:', Math.floor((now - lastSuccessfulFetch) / 1000), 'seconds');
      return Response.json({ 
        success: true, 
        total: cachedTotal,
        cached: true,
        error: 'Redis failed, using cached data: ' + error.message
      });
    }
    
    // Fallback to mock data
    console.log('GET - No cached data available, returning 0');
    return Response.json({ 
      success: true, 
      total: 0,
      mock: true,
      cached: false,
      error: 'Redis failed, no cache available: ' + error.message
    });
  } finally {
    if (redis) {
      await redis.disconnect();
    }
  }
}

export async function POST(request) {
  let redis = null;
  try {
    console.log('POST - Environment check - REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'NOT SET');

    const body = await request.json();
    const { amount } = body;
    
    console.log('POST - Attempting to add amount:', amount);
    
    if (typeof amount !== 'number' || amount <= 0) {
      return Response.json({ 
        success: false, 
        error: 'Invalid amount. Must be a positive number.' 
      }, { status: 400 });
    }
    
    redis = createRedisClient();
    
    if (!redis) {
      console.warn('POST - Redis not available, returning estimated total');
      const estimatedTotal = cachedTotal + amount;
      return Response.json({ 
        success: true, 
        total: estimatedTotal,
        cached: true,
        estimated: true,
        error: 'REDIS_URL not configured, using estimated total'
      });
    }

    // Connect and increment
    await redis.connect();
    const newTotal = await redis.incrby('crust_fund_global_pizzas', amount);
    
    // Update cache on successful operation
    cachedTotal = newTotal;
    lastSuccessfulFetch = Date.now();
    
    console.log('POST - Successfully incremented to new total:', newTotal);
    
    return Response.json({ 
      success: true, 
      total: newTotal,
      cached: false
    });
  } catch (error) {
    console.error('POST - Redis error:', error.message);
    
    // If Redis is down, try to update cache and return cached + amount
    const estimatedTotal = cachedTotal + amount;
    console.log('POST - Redis down, returning estimated total:', estimatedTotal);
    
    return Response.json({ 
      success: true, 
      total: estimatedTotal,
      cached: true,
      estimated: true,
      error: 'Redis failed, using estimated total: ' + error.message
    });
  } finally {
    if (redis) {
      await redis.disconnect();
    }
  }
}
