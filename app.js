require('dotenv').config();
const path = require('path');

const express = require('express');
const createError = require('http-errors')
const session = require('express-session');
const cookieParser = require('cookie-parser');

const logger = require('morgan');
const passport = require('passport');

const SQLiteStore = require('connect-sqlite3')(session);

const routes = require('./routes/index')



const app = express();

app.locals.pluralize = require('pluralize');

// views engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({db: 'sessions.db', dir: './var/db'})
}));
app.use(passport.authenticate('session'));
app.use(function (req, res, next) {
    const msgs = req.session.messages || [];
    res.locals.messages = msgs;
    res.locals.hasMessages = !!msgs.length;
    req.session.messages = [];
    next()
});

// routes
app.use('/', routes)

// catch 404 error
app.use(function (req, res, next) {
    next(createError(404));
});

// error handle
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('dev') === 'development' ? err : {};

    // render error page
    res.status(err.status || 500);
    res.render('error');
});



module.exports = app;
