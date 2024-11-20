const express = require('express');
const router = express.Router();
const { db } = require('../utils/database');
const { logWithDate } = require('../utils/logger');
const WebSocket = require('ws');


// Route zum Aktualisieren des Namens eines Mitarbeiters
router.post('/updateName', (req, res) => {
    const { usernummer, name } = req.body;
    const wss = req.app.locals.wss; // WebSocket-Server über req.app.locals abrufen

    if (!usernummer || !name) {
        return res.status(400).send('Usernummer und Name müssen angegeben werden.');
    }

    const query = 'UPDATE arbeiter SET name = ? WHERE usernummer = ?';
    db.query(query, [name, usernummer], (err) => {
        if (err) {
            logWithDate('Fehler beim Aktualisieren des Namens: ' + err);
            return res.status(500).send('Fehler beim Aktualisieren des Namens');
        }
        logWithDate(`Name erfolgreich aktualisiert: ${name} (Usernummer: ${usernummer})`);
        res.send('Name erfolgreich aktualisiert');

        // Nachricht an WebSocket-Clients senden
        if (wss) {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ message: 'update' }));
                }
            });
        }
    });
});

// Route zum Löschen des Namens eines Mitarbeiters
router.post('/deleteName', (req, res) => {
    const { usernummer } = req.body;
    const wss = req.app.locals.wss; // WebSocket-Server über req.app.locals abrufen

    if (!usernummer) {
        return res.status(400).send('Usernummer muss angegeben werden.');
    }

    const query = 'UPDATE arbeiter SET name = "" WHERE usernummer = ?';
    db.query(query, [usernummer], (err) => {
        if (err) {
            logWithDate('Fehler beim Löschen des Namens: ' + err);
            return res.status(500).send('Fehler beim Löschen des Namens');
        }
        logWithDate(`Name erfolgreich gelöscht für Usernummer: ${usernummer}`);
        res.send('Name erfolgreich gelöscht');

        // Nachricht an WebSocket-Clients senden
        if (wss) {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ message: 'update' }));
                }
            });
        }
    });
});

module.exports = router;
