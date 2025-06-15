// --- Dependencies ---
require('dotenv').config(); // Loads environment variables from a .env file
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const CooldownManager = require('./cooldown.js'); // Import the cooldown manager

// --- Initialization ---
const app = express();
const port = process.env.PORT || 8080;
const cooldownManager = new CooldownManager(process.env.REDIS_URL);

// --- Middleware ---

// 1. Content Security Policy (CSP)
// This is a crucial security header that tells the browser what resources are safe to load.
app.use((req, res, next) => {
  const csp = [
    "default-src 'self'", // By default, only allow content from our own domain.
    "script-src 'self' https://extension-files.twitch.tv", // Allow scripts from our server and the Twitch Extension Helper.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Allow stylesheets from our server, inline styles, and Google Fonts.
    "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com", // Allow fonts from our server and Google Fonts.
    "frame-ancestors https://supervisor.ext-twitch.tv https://*.twitch.tv", // IMPORTANT: Allows Twitch to embed the extension in an iframe.
    "connect-src 'self'" // Allow API/WebSocket connections to our own domain.
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  next();
});

// 2. Cross-Origin Resource Sharing (CORS)
// Allows your frontend (on Cloudflare Pages) to make requests to this backend.
app.use(cors());

// 3. JSON Body Parser
// Allows the server to understand JSON formatted request bodies.
app.use(express.json());

// 4. Static File Serving
// Serves audio files from a 'public/audio' directory within your backend project.
app.use('/audio', express.static(path.join(__dirname, 'public/audio')));


// --- In-Memory State ---
// For a production app, you might move this to a database like Redis.
let currentPrice = 250;


// --- API Endpoints ---

// Health check endpoint to confirm the server is running.
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Voice Extension Backend is running.' });
});

// Gets the current price for a voice line redemption.
app.get('/api/get-price', (req, res) => {
  res.json({ price: currentPrice });
});

// Sets a new price for voice line redemptions.
app.post('/api/set-price', (req, res) => {
  const { price } = req.body;
  if (!price || isNaN(price) || price < 1) {
    return res.status(400).json({ success: false, message: 'Invalid price.' });
  }
  currentPrice = parseInt(price, 10);
  broadcast({ type: 'priceUpdate', price: currentPrice });
  res.json({ success: true, message: `Price set to ${currentPrice}` });
});

// Handles a voice line redemption from the frontend.
app.post('/api/redeem', async (req, res) => {
  // Assumes the frontend sends a unique userId from the Twitch Helper JWT
  const { champion, lineLabel, audioUrl, userId } = req.body;

  if (!champion || !lineLabel || !audioUrl || !userId) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  // Check if the user is on cooldown before proceeding.
  if (await cooldownManager.isOnCooldown(userId)) {
    const remaining = await cooldownManager.getCooldown(userId);
    return res.status(429).json({ success: false, message: `You are on cooldown. Please wait ${remaining} seconds.` });
  }

  // If not on cooldown, broadcast the redemption to the overlay.
  broadcast({ type: 'redeem', champion, lineLabel, audioUrl });

  // Set the user on cooldown.
  await cooldownManager.setCooldown(userId);

  res.json({ success: true, message: 'Redemption successful!' });
});


// --- Server and WebSocket Setup ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket connection handler
wss.on('connection', ws => {
  console.log('WebSocket client connected.');
  ws.send(JSON.stringify({ type: 'status', message: 'connected' }));
  ws.send(JSON.stringify({ type: 'priceUpdate', price: currentPrice }));
});

// Helper function to broadcast messages to all connected WebSocket clients.
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// Start the server.
server.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});