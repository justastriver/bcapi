'use strict';

const express = require('express');
const router = express.Router();

const users = require('../controllers/users');
const auth = require('../controllers/auth');
const wallets = require('../controllers/wallets');

router.route('/users')
    .post(users.createUser)
    .get(auth.validateUser, users.getUserById);

router.route('/auth/token')
    .post(auth.loginUser);

router.route('/wallets')
    .get(auth.validateUser, wallets.getWalletsByUserId);

router.route('/wallets/:wallet_id/address')
    .post(auth.validateUser, wallets.getAddressForWallet);

router.route('/wallets/:wallet_id/transaction')
    .post(auth.validateUser, wallets.createTransaction)
    .get(auth.validateUser, wallets.getWalletTransactions);

// expose routes through router object
module.exports = router;
