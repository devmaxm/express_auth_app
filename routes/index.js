const express = require('express');

const homeRouter = require('./home-router')
const authRouter = require('./auth-router')

const router = express.Router();

router.use('/', homeRouter)
router.use('/', authRouter)

module.exports = router;
