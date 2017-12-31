const crypto = require('crypto');
const MyWallet = require('blockchain.info/MyWallet');
const User = require('../models/schemas/user');
const Wallet = require('../models/schemas/wallet');
const config = require('../models/config');

function deleteUser(user_id) {
    User.findByIdAndRemove(user_id, (err, user) => {
        return;
    });
}

exports.getUserById = (req, res, next) => {
    if (req.user)
        var payload = {
            "email": req.user.email,
            "id": req.user.id
        };
    if (!req.id)
        return res.status(403).send('missing user ID');
    User.findById(req.id, (err, user) => {
        if (err) return next(err);
        if (!user) return res.status(403).send('Invalid user ID');
        var payload = {
            "email": user.email,
            "phone": user.phone,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "id": user.id
        };
        return res.json(payload);
    });

};

exports.createUser = (req, res, next) => {
    var userData = {};
    
    // validate email
    // http://emailregex.com
    if (req.body.email) {
        if (!(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(req.body.email)))
            return res.status(400).send('Invalid email');
        else
            userData.email = req.body.email;
    }
    
    // check if password was provided
    if (req.body.password)
        userData.hash = req.body.password;
    if (req.body.hash)
        userData.hash = req.body.hash;

    userData.phone = req.body.phone;
    userData.first_name = req.body.first_name;
    userData.last_name = req.body.last_name;

    var user_id = undefined;

    // create new user
    var newUser = new User(userData);
    newUser.save((err, user) => {
        if (err) {
            if (err.code === 11000)
                return res.status(400).send('Email already registered');    
            return res.status(400).send(err.message);
        }
        user_id = user.id;

        // generate random password for wallet
        var pswd = crypto.randomBytes(64).toString('hex');

        // Generate new BTC wallet
        var options = {
            'apiHost': config.apiHost,
            'email': req.body.email,
            'hd': true
        };
        
        MyWallet.create(pswd, config.bc_code, options).then((wallet) => {
            if (!wallet.guid) {
                deleteUser(user_id);
                return res.status(400).send('Failed to create wallet'); 
            }
            var walletData = {
                user_id: user_id,
                wallet_id: wallet.guid,
                password: pswd,
                currency: 'BTC'
            };
            
            // save wallet
            var newWallet = new Wallet(walletData);
            newWallet.save((err, wallet) => {
                if (err) {
                    deleteUser(user_id);
                    return next(err);
                }
                return res.sendStatus(200);
            });
        }).catch((err) => {
            deleteUser(user_id);
            return res.status(400).send('Failed to create wallet');
        });
    });
};

exports.updateUser = (req, res, next) => {
    User.findOneAndUpdate(req.params.id, req.body, (err, user) => {
        if (err) return next(err);
        if (!user) return res.status(404).send('No user with that ID');
        return res.sendStatus(200);
    });
};
