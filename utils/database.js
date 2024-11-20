const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'alpenreich.eu',
    user: 'alpenreich',
    password: '47012540BadVoeslau@!',
    database: 'pwn',
});

module.exports = { db };
