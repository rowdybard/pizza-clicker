import { kv } from '@vercel/kv';

export async function GET() {
  try {
    console.log('Environment check - REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'NOT SET');
    console.log('Environment check - KV_REST_API_URL:', process.env.KV_REST_API_URL ? 'SET' : 'NOT SET');
    console.log('Environment check - KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT SET');
    
    // Try to use KV client directly
    try {
      const total = await kv.get('crust_fund_global_pizzas');
      const count = total ? parseInt(total, 10) : 0;
      
      console.log('Successfully fetched global total:', count);
      
      return Response.json({ 
        success: true, 
        total: count
      });
    } catch (kvError) {
      console.error('KV client error:', kvError);
      console.error('KV error details:', JSON.stringify(kvError, null, 2));
      
      // Fallback to mock data
      return Response.json({ 
        success: true, 
        total: 0,
        mock: true,
        error: 'KV client failed: ' + kvError.message
      });
    }
  } catch (error) {
    console.error('Error fetching global stats:', error);
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
      console.log('POST - Successfully incremented to new total:', newTotal);
      
      return Response.json({ 
        success: true, 
        total: newTotal
      });
    } catch (kvError) {
      console.error('POST - KV client error:', kvError);
      console.error('POST - KV error details:', JSON.stringify(kvError, null, 2));
      
      // Fallback to mock data
      return Response.json({ 
        success: true, 
        total: 0,
        mock: true,
        error: 'KV client failed: ' + kvError.message
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
