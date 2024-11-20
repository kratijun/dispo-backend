const express = require('express');
const router = express.Router();
const { db } = require('../utils/database');
const { logWithDate } = require('../utils/logger');

router.get('/:usernummer', (req, res) => {
    const usernummer = req.params.usernummer;

    const query = 'SELECT lat, lng FROM arbeiter WHERE usernummer = ?';
    db.query(query, [usernummer], (err, results) => {
        if (err) {
            logWithDate('Fehler beim Abrufen der GPS-Daten: ' + err);
            return res.status(500).json({ error: 'GPS-Daten konnten nicht abgerufen werden' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Keine GPS-Daten gefunden' });
        }

        res.json(results[0]);
    });
});

module.exports = router;
