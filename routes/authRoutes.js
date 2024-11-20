const express = require('express');
const jwt = require('jsonwebtoken'); // JWT für Token-Erstellung
const { db } = require('../utils/database'); // Verbindung zur Datenbank
const { logWithDate } = require('../utils/logger'); // Logging
const speakeasy = require('speakeasy'); // Für 2FA

const router = express.Router();

// Route: Benutzerlogin
router.post('/login', async (req, res) => {
    const { username } = req.body;  // Benutzer gibt den Benutzernamen ein

    // Sicherstellen, dass der Benutzername übermittelt wurde
    if (!username) {
        return res.status(400).json({ message: 'Benutzername fehlt' });
    }

    // Benutzer in der Datenbank suchen (hier wird angenommen, dass der Benutzername eindeutig ist)
    const query = 'SELECT * FROM users WHERE username = ?'; // Suche nach Benutzer anhand des Benutzernamens
    try {
        // Verwenden von db.query, um ein korrektes Array von Ergebnissen zu erhalten
        db.query(query, [username], (err, rows) => {
            if (err) {
                console.error('Datenbankfehler:', err);
                return res.status(500).json({ message: 'Fehler bei der Datenbankabfrage' });
            }

            // Protokolliere das Ergebnis der DB-Abfrage
            console.log('Datenbankergebnis:', rows);

            if (!rows || rows.length === 0) {
                return res.status(400).json({ message: 'Benutzer nicht gefunden' });
            }

            const user = rows[0]; // Angenommen, nur ein Benutzer wird mit dem Benutzernamen gefunden

            res.json("Login erfolgreich"); // Token im Response
        });
    } catch (error) {
        console.error('Fehler beim Login:', error); // Fehlerprotokollierung
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});

// Route: OTP verifizieren
router.post('/verify-otp', (req, res) => {
    const { otpCode } = req.body;

    logWithDate('OTP-Überprüfung gestartet.');

    // In einer echten Anwendung würde die Benutzer-ID aus einer Session/JWT kommen
    const query = 'SELECT secret FROM users WHERE id = ? LIMIT 1';

    const userId = 1; // Simulierte Benutzer-ID, ersetze das durch die echte Benutzer-ID

    db.query(query, [userId], (err, results) => {
        if (err) {
            logWithDate('Fehler bei der Datenbankabfrage: ' + err);
            return res.status(500).json({ error: 'Fehler bei der OTP-Überprüfung' });
        }

        if (results.length === 0) {
            logWithDate('Benutzer nicht gefunden.');
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }

        const userSecret = results[0].secret;

        // OTP überprüfen
        const isVerified = speakeasy.totp.verify({
            secret: userSecret,
            encoding: 'base32',
            token: otpCode,
            window: 2, // Toleranz für 2 Zeitintervalle
        });

        if (!isVerified) {
            logWithDate('Ungültiger OTP-Code.');
            return res.status(401).json({ error: 'Ungültiger OTP-Code' });
        }

        logWithDate('OTP erfolgreich verifiziert.');
        res.json({ message: '2FA erfolgreich.' });
    });
});


// Route: Secret-Schlüssel generieren
router.get('/generate-secret', (req, res) => {
    const secret = speakeasy.generateSecret({ length: 20 });

    res.json({
        base32: secret.base32,           // Der geheimnisvolle Schlüssel im Base32-Format
        otpauth_url: secret.otpauth_url // URL für den QR-Code
    });
});

module.exports = router;
