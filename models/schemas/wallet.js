const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const config = require('../config');

function encrypt(text){
    var cipher = crypto.createCipher(algorithm, config.wallet_password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
}
 
function decrypt(text){
    var decipher = crypto.createDecipher(algorithm, config.wallet_password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
}

var walletSchema = new Schema({
        wallet_id: {type: String, unique: true},
        user_id: String,
        password: String,
        currency: String
    },
    {
        toObject: { getters: true },
        timestamps: {
            createdAt: 'createdDate',
            updatedAt: 'updatedDate'
        },
    }
);

walletSchema.pre('save', function(callback) {
    if (!this.user_id)
        return callback(new Error('Missing user id'));
    if (!this.wallet_id)
        return callback(new Error('Missing wallet Id'));
    if (!this.password)
        return callback(new Error('Missing password'));
    if (!this.currency)
        return callback(new Error('Missing currency'));
    this.password = encrypt(this.password)
    callback();
});

walletSchema.post('init', function(doc, callback) {
    this.password = decrypt(this.password);
    callback();
});

// methods for validating password

var Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
