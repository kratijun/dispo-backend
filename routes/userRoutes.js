const express = require('express');
const router = express.Router();
const { db } = require('../utils/database'); // Stelle sicher, dass db korrekt konfiguriert ist

// Route für alle Benutzerdaten
router.get('/getUserData', async (req, res) => {
    const query = 'SELECT * FROM users'; // Alle Benutzer abfragen

    try {
        // Verwenden von db.query, um das Ergebnis abzurufen
        db.query(query, (err, rows) => {
            if (err) {
                console.error('Datenbankfehler:', err);
                return res.status(500).json({ message: 'Fehler bei der Datenbankabfrage' });
            }

            // Wenn keine Benutzerdaten gefunden wurden
            if (!rows || rows.length === 0) {
                return res.status(404).json({ message: 'Keine Benutzer gefunden' });
            }

            // Gebe alle Benutzerdaten als JSON zurück
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

    // Sicherstellen, dass der Benutzername vorhanden ist
    if (!username) {
        return res.status(400).json({ message: 'Benutzername fehlt' });
    }

    const query = 'SELECT * FROM users WHERE username = ?'; // Suche nach Benutzer anhand des Benutzernamens

    try {
        // Verwenden von db.query, um das Ergebnis abzurufen
        db.query(query, [username], (err, rows) => {
            if (err) {
                console.error('Datenbankfehler:', err);
                return res.status(500).json({ message: 'Fehler bei der Datenbankabfrage' });
            }

            // Wenn keine Benutzerdaten gefunden wurden
            if (!rows || rows.length === 0) {
                return res.status(404).json({ message: 'Benutzer nicht gefunden' });
            }

            const userData = rows[0]; // Wir gehen davon aus, dass nur ein Benutzer mit diesem Benutzernamen existiert

            // Gebe die Benutzerdaten als JSON zurück
            res.json(userData);
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Benutzerdaten:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});

router.patch('/updateZusatz', async (req, res) => {
    const { ressource, newText } = req.body; // Entnehme 'ressource' und 'text' (Zusatz) aus dem Request-Body
    const wss = req.app.locals.wss; // WebSocket-Server über req.app.locals abrufen

    // Sicherstellen, dass beide Werte vorhanden sind
    if (!ressource || newText === undefined) { // Wenn der Zusatztext nicht angegeben ist
        return res.status(400).json({ message: 'Fehlende Parameter: ressource oder text' });
    }

    // SQL-Query, um das Zusatzfeld zu aktualisieren
    const query = 'UPDATE users SET text = ? WHERE ressource = ?';

    try {
        // Verwenden von db.query, um die Datenbank zu aktualisieren
        db.query(query, [newText, ressource], (err, result) => {
            if (err) {
                console.error('Datenbankfehler:', err);
                return res.status(500).json({ message: 'Fehler beim Aktualisieren der Daten' });
            }

            // Wenn keine Zeile aktualisiert wurde, prüfen, ob die Ressource existiert
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Ressource nicht gefunden' });
            }

            // Erfolgreiches Update
            // Sende WebSocket-Nachricht an alle Clients, um die Änderungen zu synchronisieren
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ message: 'update' }));
                }
            });

            res.json({ message: 'Zusatzfeld erfolgreich aktualisiert' });
        });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Zusatzfelds:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});


module.exports = router;
