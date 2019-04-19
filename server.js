const path = require('path');
const express = require('express');
const ws = require('ws');

const HttpPort = process.env.PORT || 3000;
const WebsocketPort = process.env.WEBSOCKET_PORT || 3001;

const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET, MODEL_URN } = process.env;
if (!FORGE_CLIENT_ID || !FORGE_CLIENT_SECRET || !MODEL_URN) {
    console.warn('Some of the following env. variables are missing: FORGE_CLIENT_ID, FORGE_CLIENT_SECRET, MODEL_URN');
    return;
}

// Setup express server
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', require('./routes/api'));
app.listen(HttpPort, function() { console.log(`HTTP server listening on port ${HttpPort}`); });

// Setup websocket server
const wss = new ws.Server({ port: WebsocketPort }, function() { console.log(`Websocket server listening on port ${WebsocketPort}`); });
wss.on('connection', require('./socket-connection'));
