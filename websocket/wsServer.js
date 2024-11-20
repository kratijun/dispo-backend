const WebSocket = require('ws');
const { logWithDate } = require('../utils/logger');

function initializeWebSocket(server) {
    const wss = new WebSocket.Server({ noServer: true });

    wss.on('connection', (ws) => {
        logWithDate('Neuer WebSocket-Client verbunden.');

        ws.on('close', () => {
            logWithDate('WebSocket-Client getrennt.');
        });
    });

    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });

    return wss;
}

module.exports = { initializeWebSocket };
