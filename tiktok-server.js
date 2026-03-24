import { WebcastPushConnection } from 'tiktok-live-connector';
import { Server } from 'socket.io';
import http from 'http';

// 1. Create a basic HTTP server so your browser actually loads a success message
const httpServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
      <h1>🍕 Crust Fund TikTok Relay Server is Running!</h1>
      <p style="color: #555;">This window is just the server. Keep your terminal running in the background.</p>
      <p><b>Next Step:</b> Open your actual game in a new tab with the streamer flag enabled!</p>
    </div>
  `);
});

// 2. Attach Socket.io to the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow your local React app to connect
    methods: ["GET", "POST"]
  }
});

// 3. ⚠️ CHANGE THIS TO YOUR TIKTOK USERNAME ⚠️
const tiktokUsername = "playcrustfund"; 

// 4. Connect to the TikTok Live feed
const tiktokLiveConnection = new WebcastPushConnection(tiktokUsername);

console.log(`Attempting to connect to @${tiktokUsername}'s TikTok Live...`);

tiktokLiveConnection.connect().then(state => {
    console.info(`✅ Connected successfully to room ${state.roomId}`);
    console.info(`Waiting for gifts and chat...`);
}).catch(err => {
    console.error('❌ Failed to connect. Are you currently Live?', err);
});

// 5a. Every like = 1 bake & box click (batch-aware, capped at 10)
tiktokLiveConnection.on('like', data => {
    const count = Math.min(data.likeCount ?? 1, 10);
    for (let i = 0; i < count; i++) {
        io.emit('tiktok-chat', { username: data.uniqueId });
    }
});

// 5b. Listen for GIFTS (Roses, Galaxies, etc.)
tiktokLiveConnection.on('gift', data => {
    console.log(`🎁 GIFT RECEIVED: ${data.uniqueId} sent ${data.giftName} (Value: ${data.diamondCount})`);
    
    // Broadcast the gift to your React game
    io.emit('tiktok-gift', {
        username: data.uniqueId,
        giftName: data.giftName,
        diamondCount: data.diamondCount
    });
});

// 6. Listen for CHAT (Optional interactivity)
tiktokLiveConnection.on('chat', data => {
    const comment = (data.comment || '').toLowerCase();
    
    // If a viewer types "scrub", clean those dishes!
    if (comment.includes('scrub')) {
         io.emit('tiktok-scrub', { username: data.uniqueId });
    }

    // If a viewer types "slice", spawn a random golden popup event!
    if (comment.includes('slice')) {
         io.emit('tiktok-slice', { username: data.uniqueId });
    }
});

// 7. Start the server explicitly on 127.0.0.1 to avoid Windows localhost mapping issues
const PORT = 8080;
const HOST = '127.0.0.1';

httpServer.listen(PORT, HOST, () => {
  console.log(`\n🚀 HTTP & WebSocket Relay running!`);
  console.log(`👉 TYPE THIS EXACTLY INTO CHROME: http://${HOST}:${PORT}\n`);
});

// 8. Catch silent errors (like port already in use)
httpServer.on('error', (e) => {
  console.error('❌ Server Error:', e.message);
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use by another app! Try changing PORT to 8081.`);
  }
});