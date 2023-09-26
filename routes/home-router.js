const express = require('express');

const db = require('../db');


const router = express.Router();

router.get(
    '/',
    function (req, res, next) {
        if (!req.user) {
            return res.render('home')
        }
        next()
    },
    function (req, res, next) {
        res.locals.filtres = null
        res.render('index', {user: req.user});
    }
);


router.get('/', function (req, res, next) {
    res.render('home');
});


module.exports = router;
