const express = require('express');
const router = express.Router();
const { db } = require('../utils/database'); // Stelle sicher, dass db korrekt konfiguriert ist
const WebSocket = require('ws');


// Route für das Erstellen einer neuen Ressource
router.post('/createRessource', async (req, res) => {
    const { username, name, ressource, az, dw, secret } = req.body; // Daten aus dem Request-Body entnehmen
    const seit = "00:00:00";
    const wss = req.app.locals.wss; // WebSocket-Server über req.app.locals abrufen

    // Sicherstellen, dass alle erforderlichen Felder vorhanden sind
    if (!username || !name || !ressource || !az || !dw || !secret) {
        return res.status(400).json({ message: 'Fehlende Parameter' });
    }

    // SQL-Query zum Erstellen einer neuen Ressource
    const query = `
        INSERT INTO users (username, name, ressource, az, dw, secret, seit)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    try {
        // Verwenden von db.query, um die Daten in die Datenbank einzufügen
        db.query(query, [username, name, ressource, az, dw, secret, seit], (err, result) => {
            if (err) {
                console.error('Datenbankfehler:', err);
                return res.status(500).json({ message: 'Fehler beim Erstellen der Ressource' });
            }

            // Erfolgreiches Einfügen der Ressource
            res.status(201).json({ message: 'Ressource erfolgreich erstellt' });

            // Sende WebSocket-Nachricht an alle Clients, um die Änderungen zu synchronisieren
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ message: 'update' }));
                }
            });
        });
    } catch (error) {
        console.error('Fehler beim Erstellen der Ressource:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});

// Route für alle Benutzerdaten
router.get('/getUserData', async (req, res) => {
    const query = 'SELECT * FROM users'; // Alle Benutzer abfragen

    try {
        db.query(query, (err, rows) => {
            if (err) {
                console.error('Datenbankfehler:', err);
                return res.status(500).json({ message: 'Fehler bei der Datenbankabfrage' });
            }

            if (!rows || rows.length === 0) {
                return res.status(404).json({ message: 'Keine Benutzer gefunden' });
            }

            res.json(rows);
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Benutzerdaten:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});

// Route für einen bestimmten Benutzer
router.get('/getUserData/:username', async (req, res) => {
    const { username } = req.params; // Holen des Benutzernamens aus den URL-Parametern

    if (!username) {
        return res.status(400).json({ message: 'Benutzername fehlt' });
    }

    const query = 'SELECT * FROM users WHERE username = ?'; // Suche nach Benutzer anhand des Benutzernamens

    try {
        db.query(query, [username], (err, rows) => {
            if (err) {
                console.error('Datenbankfehler:', err);
                return res.status(500).json({ message: 'Fehler bei der Datenbankabfrage' });
            }

            if (!rows || rows.length === 0) {
                return res.status(404).json({ message: 'Benutzer nicht gefunden' });
            }

            const userData = rows[0]; // Wir gehen davon aus, dass nur ein Benutzer mit diesem Benutzernamen existiert
            res.json(userData);
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Benutzerdaten:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});

// Route für das Aktualisieren von Benutzerressourcen
router.patch('/updateResource', async (req, res) => {
    const wss = req.app.locals.wss; // WebSocket-Server über req.app.locals abrufen
    const {
        id, newUserName, newName, newRessource, newAz, newDw, newSecret
    } = req.body;

    if (!id || !newUserName || !newName || !newRessource || !newAz || !newDw || !newSecret) {
        return res.status(400).json({ message: 'Fehlende Parameter' });
    }

    const query = `
        UPDATE users
        SET
            username = ?,
            name = ?,
            ressource = ?,
            az = ?,
            dw = ?,
            secret = ?
        WHERE id = ?;
    `;

    try {
        db.query(query, [newUserName, newName, newRessource, newAz, newDw, newSecret, id], (err, result) => {
            if (err) {
                console.error('Datenbankfehler:', err);
                return res.status(500).json({ message: 'Fehler beim Aktualisieren der Daten' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Benutzer nicht gefunden' });
            }

            res.json({ message: 'Ressource erfolgreich aktualisiert' });

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ message: 'update' }));
                }
            });
        });
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Ressource:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});

// Route für das Löschen einer Ressource
router.delete('/deleteResource/:id', async (req, res) => {
    const { id } = req.params; // Die ID aus den URL-Parametern holen
    const wss = req.app.locals.wss; // WebSocket-Server über req.app.locals abrufen

    if (!id) {
        return res.status(400).json({ message: 'Ressourcen-ID fehlt' });
    }

    const query = 'DELETE FROM users WHERE id = ?'; // SQL-Query zum Löschen der Ressource

    try {
        db.query(query, [id], (err, result) => {
            if (err) {
                console.error('Datenbankfehler:', err);
                return res.status(500).json({ message: 'Fehler beim Löschen der Ressource' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Ressource nicht gefunden' });
            }

            res.json({ message: 'Ressource erfolgreich gelöscht' });

            // Benachrichtige alle WebSocket-Clients über das Update
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ message: 'update' }));
                }
            });
        });
    } catch (error) {
        console.error('Fehler beim Löschen der Ressource:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});

module.exports = router;
