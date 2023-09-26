const sqlite3 = require('sqlite3')
const mkdirp = require('mkdirp')
const crypro = require('crypto')

mkdirp.sync('./var/db')

const db = new sqlite3.Database('./var/db/exer.db')

db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS users ( \
        id INTEGER PRIMARY KEY, \
        username TEXT UNIQUE, \
        hashed_password BLOB, \
        salt BLOB, \
        name TEXT, \
        email TEXT UNIQUE, \
        email_verified INTEGER \
    )")

    db.run("CREATE TABLE IF NOT EXISTS federated_credentials ( \
        id INTEGER PRIMARY KEY, \
        user_id INTEGER NUT NULL, \
        provider TEXT NOT NULL, \
        subject TEXT NOT NULL, \
        UNIQUE(provider, subject) \
    )")

    db.run("CREATE TABLE IF NOT EXISTS exer ( \
        id INTEGER PRIMARY KEY, \
        owner_id INTEGER NUT NULL, \
        title TEXT NOT NULL, \
        completed INTEGER \
    )")

    const salt = crypro.randomBytes(16)

    db.run(
        'INSERT OR IGNORE INTO users (username, hashed_password, salt) VALUES (?, ?, ?)',
        [
            'admin',
            crypro.pbkdf2Sync('admin', salt, 31000, 32, 'sha256'),
            salt
        ]
    )
})

module.exports = db;
