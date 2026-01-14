const express = require('express');
const cors = require('cors');
const { Auth } = require('@vonage/auth');
const { Vonage } = require('@vonage/server-sdk');
require('dotenv').config();
const { db, initDatabase } = require('./database');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Handle private key from environment variable or file
let privateKey;
if (process.env.VONAGE_PRIVATE_KEY) {
  privateKey = process.env.VONAGE_PRIVATE_KEY;
} else {
  const keyPath = path.join(__dirname, 'private.key');
  if (fs.existsSync(keyPath)) {
    privateKey = fs.readFileSync(keyPath, 'utf8');
  }
}

// Initialize Vonage with proper constructor
const vonage = new Vonage(
  new Auth({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
    applicationId: process.env.VONAGE_APPLICATION_ID,
    privateKey: privateKey
  })
);

app.locals.vonage = vonage;

// Load routes
const authRoutes = require('./routes/auth');
const callRoutes = require('./routes/calls');
const scriptRoutes = require('./routes/scripts');
const reactiveScriptRoutes = require('./routes/reactive-scripts');
const advancedCallRoutes = require('./routes/advanced-calls');

app.use('/api/auth', authRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/reactive-scripts', reactiveScriptRoutes);
app.use('/api/advanced-calls', advancedCallRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Webhook endpoints
app.post('/webhooks/event', (req, res) => {
  console.log('Event webhook:', req.body);
  res.status(204).end();
});

app.post('/webhooks/answer', (req, res) => {
  res.json([
    {
      action: 'talk',
      text: 'This is a test call from Vonage.',
      voiceName: 'Joey'
    }
  ]);
});

app.post('/webhooks/recording', (req, res) => {
  const { recording_url, call_uuid } = req.body;
  if (recording_url && call_uuid) {
    db.prepare('UPDATE calls SET recording_url = ? WHERE call_uuid = ?').run(recording_url, call_uuid);
  }
  res.status(204).end();
});

// WebSocket server for real-time updates
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on ${HOST}:${PORT}`);
});

const wss = new WebSocket.Server({ server });
global.wss = wss;

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  ws.send(JSON.stringify({ type: 'connected', message: 'Connected to call monitoring' }));

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

console.log('✅ WebSocket server ready');
