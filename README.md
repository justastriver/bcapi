# btc-wallet-api
Backend for btc-wallet

## Running

1. Clone the repository.
2. Run `npm install`.
3. If running in a dev environment, set up the mongo db.
    1. Create the following directory paths in your home folder:
        - `~/mongodb/btc-wallet-api/data/db`
        - `~/mongodb/btc-wallet-api/logs`
    2. Copy and paste the `/models/mongod.conf` file into the `~/mongodb/btc-wallet-api/` file
    3. Update the mongo conf file in `/models/mongod.conf`. The `path` and `dbpath` variables should point to paths you just created.
4. Run `npm run bc_api` to start the blockchain.info api service.
5. In a new terminal window run `npm run mongo` to start the mongdb database.
    1. In order to later stop the mongo database run `npm run mongo-stop`.
6. In the same window run `npm run start` to start the api.


## Endpoints

### Creating a new user:
```
/users POST
body:
    email
    password
    phone
    first_name
    last_name
returns:
    nothing 
```

### Logging in:
```
/auth/token POST
body:
    email
    password
Returns
    token <string>
```

### Getting wallets:
```
/wallets GET
body:
    token (can also be in the header as 'x-access-token')
returns:
    wallets: [
    {
            'id': 1
            'currency': 'BTC', 
            'balance': 100,
            'unit': 'satoshis'
        }, 
        {
            'id': 313215
            'currency': 'BTC',
            'balance': 213120,
            'unit': 'satoshis'
        }
    ]
```

### Getting a new address:
```
/wallets/<wallet_id>/address POST
body:
    token (can also be in the header as 'x-access-token')
returns:
    {
        'address': <address>
    }
```

### Making a new transaction:
```
/wallet/<wallet_id>/transaction POST
body:
    address <to address>
    amount
    currency ('BTC')
returns:
    {
        'to': <to>,
        'from': <from>,
        'currency': 'BTC',
        'unit': 'satoshis',
        'amount': <amount>,
        'fee': <fee>,
        'tx_hash': <tx_hash>
    }
```

### Getting all outgoing transaction for a wallet:
```
/wallets/<wallet_id>/transaction GET
returns:
    [
        {
            'to': <to>,
            'from': <from>,
            'currency': 'BTC',
            'unit': 'satoshis',
            'amount': <amount>,
            'fee': <fee>,
            'tx_hash': <tx_hash>
        },{
            ...
        }
    ]
```
