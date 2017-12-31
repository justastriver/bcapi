const MyWallet = require('blockchain.info/MyWallet');
const BlockExp = require('blockchain.info/blockexplorer');
const Wallet = require('../models/schemas/wallet');
const config = require('../models/config');

function getBtcWallet(req, res, callback) {
    // get the wallet
    Wallet.find({'wallet_id': req.params.wallet_id}).exec((err, resp) => {
        if (err || resp.length == 0)
            return res.json([]);
        wallet = resp[0];

        // make sure the wallet belongs to the logged in user
        if (wallet.user_id != req.id)
            return res.json([]);
        var bc_options = {
            'apiCode': config.bc_code,
            'apiHost': config.apiHost
        };
        if (wallet.currency == "BTC") {
            // get the wallet info from blockchain.info
            var btc_wallet = new MyWallet(wallet.wallet_id, wallet.password, bc_options);
            if (btc_wallet) {
                callback(btc_wallet); 
            } else {
                return res.status(400).send('No wallets found');
            }
        } else {
            return res.status(400).send('No wallets found');
        }
    });
}

function parse_user_transactions(user_adders, txs) {
    var parsed_txs = {
        incoming_txs: [],
        outgoing_txs: []
    };
    txs.txs.forEach((tx) => {
        var parsed_tx = {
            inputs: [],
            outputs: [],
            total: tx.result,
            hash: tx.hash,
            time: tx.time,
            fee: tx.fee
        };
        
        var is_incoming = false;
        tx.out.forEach((tx_out) => {
            parsed_tx.outputs.push(tx_out.addr);
            if (user_adders.includes(tx_out.xpub.m)) {
                is_incoming = true;
            }
        });

        tx.inputs.forEach((tx_in) => {
            parsed_tx.inputs.push(tx_in.prev_out.addr);
            
        });

        if (is_incoming) {
            parsed_txs.incoming_txs.push(parsed_tx);
        } else {
            parsed_txs.outgoing_txs.push(parsed_tx);
        }
    });

    return parsed_txs;
}

// Returns all the wallets associated with the given user
exports.getWalletsByUserId = (req, res, next) => {
    if (!req.id)
        return res.status(403).send('Not logged in!');
    Wallet.find({'user_id': req.id}).exec((err, wallets) => {
        if (err)
            return res.json([]);
        var user_wallets = [];
        var promises = [];
        // For each wallet associated with user, get the balance
        var bc_options = {
            'apiCode': config.bc_code,
            'apiHost': config.apiHost
        };
        wallets.forEach((wallet) => {
            if (wallet.currency == "BTC") {
                // get the current wallet
                var btc_wallet = new MyWallet(wallet.wallet_id, wallet.password, bc_options);
                if (btc_wallet) {
                    var promise = new Promise((resolve, reject) => {
                        // get the balance on the wallet
                        btc_wallet.getBalance().then((resp) => {
                            // add the wallet to the list of wallets to return
                            user_wallets.push({
                                'id': wallet.wallet_id,
                                'currency': wallet.currency,
                                'balance': resp.balance,
                                'unit': 'satoshis'
                            });
                            resolve();
                        });
                    });
                    promises.push(promise);
                }
            }
        });
        Promise.all(promises).then(() => {return res.json({'wallets': user_wallets});});
    });
};

exports.getAddressForWallet = (req, res, next) => {
    if (!req.id)
        return res.status(403).send('Not logged in!');
    getBtcWallet(req, res, (btc_wallet) => {
        btc_wallet.getAccountReceiveAddress(0).then((resp) => {
            return res.json({'address':resp.address});
        });
    });
};


exports.getWalletTransactions = (req, res, next) => {
    if (!req.id)
        return res.status(403).send('Not logged in!');
    getBtcWallet(req, res, (btc_wallet) => {
        // get wallet public adresses
        btc_wallet.listXPubs(0).then((addresses) => {
            // get transactions for addresses
            BlockExp.getMultiAddress(addresses).then((txs) => {
                parsed_txs = parse_user_transactions(addresses, txs);
                return res.json(parsed_txs); 
            });
        });
    });
    
};


exports.createTransaction = (req, res, next) => {
    // validate request
    if (!req.id)
        return res.status(400).send('Not logged in');
    if (!req.params.wallet_id)
        return res.status(400).send('Missing wallet Id');
    if (!req.body.address)
        return res.status(400).send('Missing target address');
    if (!req.body.amount)
        return res.status(400).send('Missing amount');
    if (!req.body.currency)
        return res.status(400).send('Missing currency');

    // get wallet
    if (req.body.currency == 'BTC') {
        getBtcWallet(req, res, (btc_wallet) => {
            btc_wallet.getBalance().then((resp) => {
                // add the wallet to the list of wallets to return
                console.log(resp.balance);
                btc_wallet.send(req.body.address, req.body.amount, {
                    fee: config.fee,
                    feePerBye: config.feePerByte,
                    from: 0
                }).then((resp) => {
                    return res.json(resp);
                }).catch((err) => {
                    console.log(err);
                    return res.status(400).send('Failed to create transaction'); 
                });
            }); 
        });
    } else {
        return res.status(400).send('Invalid currency');
    }
};
