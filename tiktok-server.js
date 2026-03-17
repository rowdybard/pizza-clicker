const { WebcastPushConnection } = require('tiktok-live-connector');
const { Server } = require('socket.io');

// 1. Create a local WebSocket server on port 8080
const io = new Server(8080, {
  cors: {
    origin: "*", // Allow your local React app to connect
  }
});

// 2. ⚠️ CHANGE THIS TO YOUR TIKTOK USERNAME ⚠️
const tiktokUsername = "your_tiktok_username"; 

// 3. Connect to the TikTok Live feed
const tiktokLiveConnection = new WebcastPushConnection(tiktokUsername);

console.log(`Attempting to connect to @${tiktokUsername}'s TikTok Live...`);

tiktokLiveConnection.connect().then(state => {
    console.info(`✅ Connected successfully to room ${state.roomId}`);
    console.info(`Waiting for gifts and chat...`);
}).catch(err => {
    console.error('❌ Failed to connect. Are you currently Live?', err);
});

// 4. Listen for GIFTS (Roses, Galaxies, etc.)
tiktokLiveConnection.on('gift', data => {
    console.log(`🎁 GIFT RECEIVED: ${data.uniqueId} sent ${data.giftName} (Value: ${data.diamondCount})`);
    
    // Broadcast the gift to your React game
    io.emit('tiktok-gift', {
        username: data.uniqueId,
        giftName: data.giftName,
        diamondCount: data.diamondCount
    });
});

// 5. Listen for CHAT (Optional interactivity)
tiktokLiveConnection.on('chat', data => {
    // If a viewer types "pizza", tell the game to click once!
    if (data.comment.toLowerCase().includes('pizza')) {
         io.emit('tiktok-chat', { username: data.uniqueId });
    }
});

console.log("🚀 WebSocket Relay running on ws://localhost:8080");