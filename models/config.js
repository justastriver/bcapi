module.exports = {
    port: 5000,
    dbUrl: '127.0.0.1:3000',
    apiHost: 'http://127.0.0.1:2750',
    fee: 10000,
    feePerByte: 200,
    
    // secret for creating tokens
    token_secret: process.env.TOKEN_SECRET || 'reughdjsasdkpmasipkmsdfadf',
    // password for encrypting wallets
    wallet_password: process.env.WALLET_PASS || 'btc-wallet-master-key',
    // api code for blockchain.info
    bc_code: process.env.BC_CODE || '440fdb51-7bae-414f-ac6e-aafe5d751b5c'
};
