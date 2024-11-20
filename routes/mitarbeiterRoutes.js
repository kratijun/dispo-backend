const express = require('express');
const router = express.Router();
const { db } = require('../utils/database');
const { logWithDate } = require('../utils/logger');

// Route: Mitarbeiterdaten abrufen
router.get('/fetchMitarbeiter', (req, res) => {
    logWithDate('Abrufen der Mitarbeiterdaten gestartet.');

    const query = 'SELECT * FROM arbeiter';

    db.query(query, (err, results) => {
        if (err) {
            logWithDate('Fehler beim Abrufen der Mitarbeiterdaten: ' + err);
            return res.status(500).json({ error: 'Fehler beim Abrufen der Mitarbeiterdaten' });
        }

        logWithDate('Mitarbeiterdaten erfolgreich abgerufen.');
        res.json(results);
    });
});

module.exports = router;
