const express = require('express');
const crypto = require('crypto');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oidc');

const createError = require('http-errors');

const db = require('../db')
const crypro = require("crypto");


const router = express.Router();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/oauth2/redirect/google',
    scope: ['profile']
}, function verify(issuer, profile, cb) {
    db.get(`SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?`, [issuer, profile.id], function (err, row) {
        if (err) {
            return cb(err)
        }
        if (!row) {
            db.run(`INSERT INTO users (name) VALUES(?)`, [profile.displayName], function (err) {
                if (err) {
                    return cb(err)
                }
                const id = this.lastID

                db.run(
                    `INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)`,
                    [id, issuer, profile.id],
                    function (err) {
                        if (err) {
                            return cb(err)
                        }
                        profile.displayName
                        const user = {
                            id,
                            name: profile.displayName
                        }
                        return cb(null, user)
                    }
                )
            })
        } else {
            db.get(`SELECT * FROM users WHERE id = ?`, [row.user_id], function (err, row) {
                if (err) {
                    return cb(err)
                }
                if (!row) {
                    return cb(null, false)
                }
                return cb(null, row)
            })
        }
    })
}));

passport.use(new LocalStrategy(function verify(username, password, cb) {
    db.get(`SELECT *
            FROM users
            WHERE username = ?`, [username], function (err, row) {
        if (err) {
            return cb(err)
        }
        if (!row) {
            return cb(null, false, {message: "Incorrect username or password."})
        }
        crypto.pbkdf2(password, row.salt, 31000, 32, 'sha256', function (err, hashedPassword) {
            if (err) {
                return cb(err)
            }
            if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
                return cb(null, false, {message: "Incorrect username or password."})
            }
            return cb(null, row)
        })
    })
}));

passport.serializeUser(function (user, cb) {
    return cb(null, {
        id: user.id,
        username: user.username,
        name: user.name
    })
});

passport.deserializeUser(function (user, cb) {
    return cb(null, user)
})

router.get('/login', function (req, res) {
    res.render('login')
});

router.post('/login/password', passport.authenticate('local', {
    successRedirect: '/',
    failRedirect: '/login'
}));

router.get('/login/federated/google', passport.authenticate('google'))

router.get('/oauth2/redirect/google', passport.authenticate('google', {
    successRedirect: '/',
    failRedirect: '/login'
}))

router.post('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err)
        }
        res.redirect('/')
    })
});

router.get('/signup', function (req, res) {
    res.render('signup')
});

router.post('/signup', function (req, res, next) {
    const {username, password, passwordConfirm} = req.body
    if (!username || !password || !passwordConfirm) {
        return next(createError(400, 'Please, fill all required fields'))
    }
    if (password !== passwordConfirm) {
        return next(createError(400, `Passwords doesn't match`))
    }
    db.get(`SELECT *
            FROM users
            WHERE username = ?`, [username], function (err, row) {
        if (err) {
            return next(err)
        }
        if (row) {
            return next(createError(400, 'User with this username is exist'))
        }
    })

    const salt = crypto.randomBytes(16);
    crypro.pbkdf2(password, salt, 31000, 32, 'sha256', function (err, hashedPassword) {
        db.run('INSERT INTO users (username, hashed_password, salt) VALUES (?, ?, ?)',
            [username, hashedPassword, salt
            ], function (err) {

                if (err) {
                    return next(err)
                }
                const user = {id: this.lastID, username}
                req.login(user, function (err) {
                    if (err) {
                        return next(err)
                    }
                    res.redirect('/');
                })
            }
        )
    })
});

module.exports = router
