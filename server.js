const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const WebSocket = require('ws');
const os = require('os');

const app = express();
const PORT = 5000;

// Funktion, um das aktuelle Datum und die Uhrzeit im Format 'YYYY-MM-DD HH:MM:SS' zu holen
function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Funktion für das Loggen mit Datum und Uhrzeit
function logWithDate(message) {
    console.log(`[${getFormattedDate()}] ${message}`);
}

logWithDate('Server startet...');

// CORS aktivieren
app.use(cors());

// Middleware hinzufügen, um JSON-Daten zu verarbeiten
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Für URL-kodierte Daten

// Verbindung zur MySQL-Datenbank einrichten
const db = mysql.createConnection({
    host: 'alpenreich.eu',
    user: 'alpenreich',
    password: '47012540BadVoeslau@!', // Dein MySQL-Passwort hier
    database: 'pwn' // Dein MySQL-Datenbankname hier
});

db.connect((err) => {
    if (err) {
        logWithDate('Fehler bei der Verbindung zur Datenbank: ' + err);
        return;
    }
    logWithDate('Verbindung zur Datenbank erfolgreich.');
});

// WebSocket-Server einrichten
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
    logWithDate('Neuer WebSocket-Client verbunden.');

    // Bei Verbindungsabbruch
    ws.on('close', () => {
        logWithDate('WebSocket-Client getrennt.');
    });
});

// API-Route, um die Mitarbeiterdaten abzurufen
app.get('/api/fetchMitarbeiter', (req, res) => {
    const query = 'SELECT * FROM arbeiter';
    db.query(query, (err, results) => {
        if (err) {
            logWithDate('Fehler beim Abrufen der Daten: ' + err);
            res.status(500).send('Fehler beim Abrufen der Daten');
            return;
        }
        res.json(results);
    });
});

// API-Endpunkt zum Abrufen der Logging-Daten
app.get('/api/fetchLogs', (req, res) => {
    const query = 'SELECT * FROM logging ORDER BY time DESC';  // Beispielabfrage für Logging-Tabelle

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Daten konnten nicht abgerufen werden' });
        }
        res.json(results);
    });
});

// API-Route, um den Status eines Mitarbeiters zu aktualisieren
app.post('/api/updateStatus', (req, res) => {
    // Logge den empfangenen Body zur Prüfung
    logWithDate('Request Body für Status-Update: ' + JSON.stringify(req.body));

    const { status, usernummer, seit } = req.body;

    if (!status || !usernummer) {
        return res.status(400).send('Status und Usernummer müssen angegeben werden.');
    }

    const query = 'UPDATE arbeiter SET status = ?, seit = ? WHERE usernummer = ?';
    const data = [status, seit, usernummer]; // Werte für das Update

    db.query(query, data, (err, results) => {
        if (err) {
            logWithDate('Fehler beim Aktualisieren der Daten: ' + err);
            res.status(500).send('Fehler beim Aktualisieren der Daten');
            return;
        }

        // Nachricht an WebSocket-Clients senden
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ message: 'update' }));
            }
        });

        logWithDate('Daten erfolgreich aktualisiert für Usernummer: ' + usernummer);
        res.send('Daten erfolgreich aktualisiert');
    });
});

// API-Route, um den Namen eines Mitarbeiters zu aktualisieren (Anmeldung)
app.post('/api/updateName', (req, res) => {
    const { usernummer, name } = req.body;
    logWithDate('Request Body für Namens-Update: ' + JSON.stringify(req.body));

    if (!usernummer || !name) {
        return res.status(400).send('Usernummer und Name müssen angegeben werden.');
    }

    const query = 'UPDATE arbeiter SET name = ? WHERE usernummer = ?';
    const data = [name, usernummer];

    db.query(query, data, (err, results) => {
        if (err) {
            logWithDate('Fehler beim Aktualisieren des Namens: ' + err);
            return res.status(500).send('Fehler beim Aktualisieren des Namens');
        }

        // Nachricht an WebSocket-Clients senden
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ message: 'update' }));
            }
        });

        logWithDate('Name erfolgreich aktualisiert für Usernummer: ' + usernummer);
        res.send('Name erfolgreich aktualisiert');
    });
});

// API-Route, um den Namen eines Mitarbeiters zu löschen (Abmeldung)
app.post('/api/deleteName', (req, res) => {
    const { usernummer } = req.body;
    logWithDate('Request Body für Namens-Löschung: ' + JSON.stringify(req.body));

    if (!usernummer) {
        return res.status(400).send('Usernummer muss angegeben werden.');
    }

    const query = 'UPDATE arbeiter SET name = "" WHERE usernummer = ?';
    const data = [usernummer];

    db.query(query, data, (err, results) => {
        if (err) {
            logWithDate('Fehler beim Löschen des Namens: ' + err);
            return res.status(500).send('Fehler beim Löschen des Namens');
        }

        // Nachricht an WebSocket-Clients senden
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ message: 'update' }));
            }
        });

        logWithDate('Name erfolgreich gelöscht für Usernummer: ' + usernummer);
        res.send('Name erfolgreich gelöscht');
    });
});

app.get('/api/fetchGps/:usernummer', (req, res) => {
    const usernummer = req.params.usernummer;

    const query = 'SELECT lat, lng FROM arbeiter WHERE usernummer = ?';
    db.query(query, [usernummer], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'GPS-Daten konnten nicht abgerufen werden' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Keine GPS-Daten gefunden' });
        }

        res.json(results[0]);  // Gibt die neuesten GPS-Daten für den Benutzer zurück
    });
});


// WebSocket über HTTP-Server unterstützen
app.server = app.listen(PORT, () => {
    const address = os.networkInterfaces().eth0 ? os.networkInterfaces().eth0[0].address : 'localhost';
    logWithDate(`Server läuft auf http://${address}:${PORT}`);
});

// WebSocket-Server mit dem HTTP-Server verbinden
app.server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
