const express = require('express');
const cors = require('cors');
const os = require('os');
const { logWithDate } = require('./utils/logger');
const { db } = require('./utils/database');
const { initializeWebSocket } = require('./websocket/wsServer');

// Server-Setup
const app = express();
const PORT = 3520;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Datenbankverbindung prüfen
db.connect((err) => {
    if (err) {
        logWithDate('Fehler bei der Verbindung zur Datenbank: ' + err);
        return;
    }
    logWithDate('Verbindung zur Datenbank erfolgreich.');
});

// Routen
app.use('/api/gps', require('./routes/gpsRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/status', require('./routes/statusRoutes'));
app.use('/api/mitarbeiter', require('./routes/mitarbeiterRoutes'));

// HTTP-Server starten
const server = app.listen(PORT, () => {
    const address = os.networkInterfaces().eth0
        ? os.networkInterfaces().eth0[0].address
        : 'localhost';
    logWithDate(`Server läuft auf http://${address}:${PORT}`);
});

// WebSocket-Server initialisieren und an App weitergeben
const wss = initializeWebSocket(server);
app.locals.wss = wss; // WebSocket-Server über app.locals verfügbar machen
