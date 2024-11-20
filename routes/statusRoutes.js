const express = require('express');
const router = express.Router();
const { db } = require('../utils/database');
const { logWithDate } = require('../utils/logger');
const WebSocket = require('ws');

// Status eines Mitarbeiters aktualisieren
router.post('/update', (req, res) => {
    const { status, usernummer, seit } = req.body;
    const wss = req.app.locals.wss; // WebSocket-Server über req.app.locals abrufen

    logWithDate('Request Body für Status-Update: ' + JSON.stringify(req.body));

    if (!status || !usernummer) {
        return res.status(400).send('Status und Usernummer müssen angegeben werden.');
    }

    const query = 'UPDATE arbeiter SET status = ?, seit = ? WHERE usernummer = ?';
    const data = [status, seit, usernummer];

    db.query(query, data, (err, results) => {
        if (err) {
            logWithDate('Fehler beim Aktualisieren des Status: ' + err);
            return res.status(500).send('Fehler beim Aktualisieren des Status');
        }

        logWithDate(`Status erfolgreich aktualisiert: ${status} (Usernummer: ${usernummer})`);
        res.send('Status erfolgreich aktualisiert');

        // Nachricht an WebSocket-Clients senden.
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ message: 'update' }));
                console.log('Status erfolgreich aktualisiert: ' + JSON.stringify(client));
            }
        });
    });
});

module.exports = router;
