
This hands-on tutorial will guide you through the process of developing a QTum DApp. By following along, you will:

1. Run qtum's blockchain services in a docker container, in test mode.
1. Generate initial coins for development.
1. Deploy a Smart Contract.
1. Interact with Smart Contract with RPC.
1. Interact with Smart Contract in the browser using `qtumjs`.
1. Live-edit a DApp using Neutrino.js.

So let's get started. First, clone the repo:

```
git clone https://github.com/hayeah/neutrino-react-ts-boilerplate.git my-project
```

This repository provides a simple DApp UI to interact with the [Counter.sol](contracts/Counter.sol) contract:

```js
pragma solidity ^0.4.11;

contract Counter {
  uint256 count;

  event CounterChanged(uint256 n);

  function Counter(uint256 startCount) public {
    count = startCount;
  }

  // Increment counter by n
  function increment(uint256 n) public {
    assert(n >= 0);
    count += n;

    // emit CounterChanged event
    CounterChanged(count);
  }

  // Return current count
  function getCount() public constant returns(uint256) {
    return count;
  }
}
```

The DApp looks like this:

![](images/counter-screenshot.jpg)

You may use this project as a boilerplate to jump start your DApp project.

# DApp Development Environment

To simplify setup, we'll run the blockchain RPC service inside a docker container.

```
docker run -it --rm \
  --name myapp \
  -v `pwd`:/dapp \
  -p 9899:9899 \
  -p 9888:9888 \
  hayeah/qtumportal
```

The container will run in the foreground. Hit `Ctrl-C` to terminate the container.

In a separate terminal, verify that the container is running:

```
docker ps

CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                                            NAMES
088a9bc5b9c4        hayeah/qtumportal   "/bin/sh -c 'mkdir..."   22 minutes ago      Up 22 minutes       0.0.0.0:9888->9888/tcp, 0.0.0.0:9899->9899/tcp   myapp
```

There are two exposed service ports:

+ (http://localhost:9888) Offers JSON RPC service to access the blockchain.
+ (http://localhost:9899) Authorization UI for DApp users to grant permission to sensitive RPC calls.

Opening http://localhost:9899 in the browser, you should see the authorization UI:

![](images/auth-ui.jpg)

# Entering Into The Container

We can enter into the container by using the `docker exec` command:

```
docker exec -it myapp bash
```

Once you are inside, try to make a RPC call using the `qcli` command:

```
qcli getinfo

{
  "version": 140700,
  "protocolversion": 70016,
  "walletversion": 130000,
  "balance": 5599997.77299520,
  "stake": 19580001.33190480,
  "blocks": 1269,
  "timeoffset": 0,
  "connections": 0,
  "proxy": "",
  "difficulty": {
    "proof-of-work": 4.656542373906925e-10,
    "proof-of-stake": 4.656542373906925e-10
  },
  "testnet": false,
  "moneysupply": 25380000,
  "keypoololdest": 1510201235,
  "keypoolsize": 100,
  "paytxfee": 0.00000000,
  "relayfee": 0.00400000,
  "errors": ""
}
```

Run `qcli help` to list all the available RPC commands:

```
qcli help

== Blockchain ==
callcontract "address" "data" ( address )
getaccountinfo "address"
getbestblockhash
getblock "blockhash" ( verbose )
getblockchaininfo
getblockcount
getblockhash height

...

sendtocontract "contractaddress" "data" (amount gaslimit gasprice senderaddress broadcast)
setaccount "address" "account"
settxfee amount
signmessage "address" "message"
```

The `qcli` command is actually a convenience wrapper for the `qtum-cli` tool:

```bash
#!/bin/bash

qtum-cli -rpcuser=$QTUM_RPC_USER -rpcpassword=$QTUM_RPC_PASS -regtest "$@"
```

# Generate Coins

Inside the container we can generate coins for development uses:

```
qcli generate 600

[
...
  "1418c993bcd109508d8474f03d974db272e0edda2177be08589d0df04ed5acaa",
  "742fcaca9066119298de55fabde0a0d3b87fcc1a4b98f2e2918e19b6ba9db4da",
  "5dd5193e7c1abf1c36832b1cc1ddf9fe060c5de691afbc905d2de144c698001f",
  "2cb7c10b1759e0275feeff6ae104aaf23f8a93f27859b27a0d9ce102480fcf78",
  "45e38eac7b020f2abf6db2730b272e3eadc17e1e982560c94e69173695964689",
  "214042e47c7998f8643f6b29a0c65feeb79e3b1524532de61e183f81fbc34284",
  "390695dd85c3b796648da20dca21e47970e45176d0f2e3238bdec123bd36bacc",
  "4ebbf505ea2cfb30b59b96ecb615e2f0523282b73290495f4c13ade52771fe6f",
  "557c4bd2869d43348e01b5537767ef7693d616e87ebb7d37466e2bf5275a5ada"
]
```

You should see that the balance is non-zero:

```
qcli getbalance

2000000.00000000
```

# Deploy The Contract

This DApp project is mapped to the `/dapp` directory inside the container. Let's deploy the contract `contracts/Counter.sol` to the blockchain.

Inside the container, run:

```
solar deploy contracts/Counter.sol counter '[1]'

deploy contracts/Counter.sol => counter
🚀  All contracts confirmed
```

The deploy command takes 3 arguments:

1. `contracts/Counter.sol` is the contract's source file.
2. `counter` is the name we give to the contract.
3. `'[1]'` is a JSON array of parameters send to the contract's constructor.

We can check that the contract had been deployed:

```
solar status

✅  counter
        txid: eb3c852f254ecbb6173e2fe653d86214a26142e27af0c28cc1fb0060901f9bb6
     address: 9a2349a6a97e27a67c6887633f79384882cfaf02
   confirmed: true
```

# Interacting With Deployed Contract

Mostly, you'll be using two RPC calls to interact with a contract's methods:

1. `callcontract` to invoke a method in "query" mode, using data from your local blockchain, but not making changes to it. This is free.
2. `senttocontract` to invoke a method in "commit" mode, creating a transaction that changes the blockchain. This costs you gas.

A DApp would be using `qtumjs` to make these RPC calls. Before we get to the JavaScript code, let's make these RPC calls manually.

To make a method call, we'll need to encode the method name and the parameters according to the Solidity ABI specification. We can use `solar encode` to handle this for us.

```
solar encode counter getCount

a87d942c
```

+ `counter` is the name of the contract we've deployed.
+ `getCount` is the name of the method.
+ This method has no parameters.

We'll make the `callcontract` RPC call using `qcli`. Let's print the help information first:

```
qcli help callcontract

callcontract "address" "data" ( address )

Argument:
1. "address"          (string, required) The account address
2. "data"             (string, required) The data hex string
3. address              (string, optional) The sender address hex string
4. gasLimit             (string, optional) The gas limit for executing the contract
```

So it takes two mandatory arguments:

+ `address` of the `Counter` contract deployed earlier.
+ `data` - the ABI encoded method name and parameters.

Let's make the call:

```
qcli callcontract 9a2349a6a97e27a67c6887633f79384882cfaf02 a87d942c

{
  "address": "9a2349a6a97e27a67c6887633f79384882cfaf02",
  "executionResult": {
    "gasUsed": 21667,
    "excepted": "None",
    "newAddress": "9a2349a6a97e27a67c6887633f79384882cfaf02",
    "output": "0000000000000000000000000000000000000000000000000000000000000001",
    "codeDeposit": 0,
    "gasRefunded": 0,
    "depositSize": 0,
    "gasForDeposit": 0
  },
  "transactionReceipt": {
    "stateRoot": "0290be0a95c2d87afe1619cb3bc10abddda63354acb436e2ef340d39e1b3b502",
    "gasUsed": 21667,
    "bloom": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "log": [
    ]
  }
}
```

+ `gasUsed` reports how much gas is used to execute this call. But since `callcontract` executes locally, it doesn't actually cost you that much gas. It's an estimation of how much gas this call might use if it is executed as a transaction by the network.
+ `output` this is the ABI-encoded return value of `getCount`, a hex-encoded number.

Now let's update the counter by creating a transaction. The method to call is `increment`:

```js
function increment(uint256 n) public {
  assert(n >= 0);
  count += n;

  // emit CounterChanged event
  CounterChanged(count);
}
```

It changes the `count` storage variable, as well as emitting a `CounterChanged` event with the latest `count` value.

Again, we'll need to encode the method call:

```
solar encode counter increment '[5]'
```

```
7cf5dab00000000000000000000000000000000000000000000000000000000000000005
```

+ `7cf5dab` is the encoded method name
+ `000....005` is an encoded uint256 number

Before making the RPC call, let's print the help info first:

```
qcli help sendtocontract

sendtocontract "contractaddress" "data" (amount gaslimit gasprice senderaddress broadcast)

... more doc below ...
```

There are two mandatory arguments, and a few optional ones. In this example, we'll only be using the first two:

```
qcli sendtocontract \
  9a2349a6a97e27a67c6887633f79384882cfaf02 \
  7cf5dab00000000000000000000000000000000000000000000000000000000000000005
```

```js
{
  "txid": "cf2fd38a1a8a4414bc11cb2682b9ac9d7ecf2ed09b137f35f424c390afe311dd",
  "sender": "qcZGiHTwEh2wqucRkAkmiP9HLgVj8AwrST",
  "hash160": "d06502c30f258542891419a62fa01359d70a6c24"
}
```

A transaction is created. Wait about 30 seconds and it'd be mined, then look it up:

```
qcli gettransaction \
  cf2fd38a1a8a4414bc11cb2682b9ac9d7ecf2ed09b137f35f424c390afe311dd
```
```js
{
  "amount": 0.00000000,
  "fee": -0.10107200,
  "confirmations": 3,
  "blockhash": "ca630653cbf49203c4409181865f76e133b34a942d5c7cda12ac0a744e7017a6",
  "blockindex": 2,
  "blocktime": 1510281280,
  "txid": "cf2fd38a1a8a4414bc11cb2682b9ac9d7ecf2ed09b137f35f424c390afe311dd",
  "walletconflicts": [
  ],
  "time": 1510281282,
  "timereceived": 1510281282,
  "bip125-replaceable": "no",
  "details": [
    {
      "account": "",
      "category": "send",
      "amount": 0.00000000,
      "vout": 1,
      "fee": -0.10107200,
      "abandoned": false
    }
  ],
  "hex": "0200000001b69b1f906000fbc18cc2f07ae24261a21462d853e62f3e17b6cb4e252f853ceb010000006b483045022100e211675b40fc4a8fc69b4878669de436e937b81a77258b0fa7e3bb1b6394ef110220754308ae23157a497048f784125b7498c755f68f7eb6b31205af33393a2c2840012102a0fa0accd9e616fea7d31e71f99b0efb534c875cd48d4ced35909213b19214c2feffffff02c009ee9cd10100001976a914e9a1506597910382abf9
6c47f24cf6856f1b15a088ac00000000000000004301040390d0030128247cf5dab00000000000000000000000000000000000000000000000000000000000000005149a2349a6a97e27a67c6887633f79384882cfaf02c2dd050000"
}
```

+ `confirmations`: the number of times this transaction had been confirmed by the blockchain.
+ `hex`: this is the raw transaction data. If you squint a bit, you'd see that the ABI encoded method call is in there (i.e. `7cf5dab000...0005`).

So `gettransaction` gives information about whether a transaction had been mined by the network, but not any information about the method call itself. Specifically, we are not getting the log events emitted by the `increment` method.

Some additional information is available via the `gettransactionreceipt` RPC call:

```
qcli gettransactionreceipt \
  cf2fd38a1a8a4414bc11cb2682b9ac9d7ecf2ed09b137f35f424c390afe311dd
```

```js
[
  {
    "blockHash": "ca630653cbf49203c4409181865f76e133b34a942d5c7cda12ac0a744e7017a6",
    "blockNumber": 1502,
    "transactionHash": "cf2fd38a1a8a4414bc11cb2682b9ac9d7ecf2ed09b137f35f424c390afe311dd",
    "transactionIndex": 2,
    "from": "d06502c30f258542891419a62fa01359d70a6c24",
    "to": "9a2349a6a97e27a67c6887633f79384882cfaf02",
    "cumulativeGasUsed": 27898,
    "gasUsed": 27898,
    "contractAddress": "9a2349a6a97e27a67c6887633f79384882cfaf02",
    "log": [
      {
        "address": "9a2349a6a97e27a67c6887633f79384882cfaf02",
        "topics": [
          "f54acf746bc9c7e8bbd50a08d3311c74576035afb12991b2820756ffbf78182c"
        ],
        "data": "0000000000000000000000000000000000000000000000000000000000000006"
      }
    ]
  }
]
```

+ `log` is an array of log items emitted by the contract.
+ `log[0].data` this is the ABI encoded value of the `CounterChanged(uint256 n)` event. It gives us the new value of `count` after incrementing by 5.

Now that the transaction had been confirmed, let's verify whether `getCount` returns the new counter value. Instead of using `qcli callcontract`, let's make a raw HTTP JSON request, just to see what `qcli` is doing under the hood.

Within the container, the `QTUM_RPC` environment variable is already set to be the URL of the `qtumd` JSON HTTP service:

```
echo $QTUM_RPC

http://qtum:test@localhost:13889
```

Now make the raw HTTP call with curl:

```sh
curl $QTUM_RPC -X POST -H "Content-Type: application/json" -d '
{
  "jsonrpc": "1.0",
  "id": 1,
  "method": "callcontract",
  "params": [
    "9a2349a6a97e27a67c6887633f79384882cfaf02",
    "a87d942c"
  ]
}
'
```

```js
{
  "result": {
    "address": "9a2349a6a97e27a67c6887633f79384882cfaf02",
    "executionResult": {
      "gasUsed": 21667,
      "excepted": "None",
      "newAddress": "9a2349a6a97e27a67c6887633f79384882cfaf02",
      "output": "0000000000000000000000000000000000000000000000000000000000000006",
      "codeDeposit": 0,
      "gasRefunded": 0,
      "depositSize": 0,
      "gasForDeposit": 0
    },
    "transactionReceipt": {
      "stateRoot": "d56a5fc4fcd6f6283e838e87ce9ddb99a8a4d3003f1fa24d5d7ee0cf072da02a",
      "gasUsed": 21667,
      "bloom": "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      "log": []
    }
  },
  "error": null,
  "id": 1
}
```

We can see that `output` is the latest coutner value `0x6`.


# DApp RPC Security

For building DApp, `qtumjs` provides a light-weight wrapper around `qtumd`'s RPC methods. However, we can't allow DApps to have unfettered access to the RPC directly. For sensitive RPC calls that may involve money, we need give the DApp user an opportunity to review the transaction made.

Using the authorization UI, a DApp user can see what transactions are made, and choose to deny or accept transactions.

The container exposes two service ports for the outside world:

```
docker ps --format 'table {{.Names}} {{.Image}} {{.Ports}}'

NAMES IMAGE PORTS
myapp hayeah/qtumportal 0.0.0.0:9888->9888/tcp, 0.0.0.0:9899->9899/tcp
```

+ `9899` is the authorization UI.
+ `9888` provides RPC service to DApps, proxying authorized RPC calls to the underlying `qtumd` RPC.

A DApp must not have direct access to the underlying `qtumd` RPC service. For this reason, the container does not expose qtumd's RPC port.

Let's verify that we have access to the RPC from outside the container. The `callcontract` is read-only, so should work without user authorization:

```
curl http://localhost:9888 -X POST -H "Content-Type: application/json" -d '
{
  "jsonrpc": "1.0",
  "id": 1,
  "method": "callcontract",
  "params": [
    "9a2349a6a97e27a67c6887633f79384882cfaf02",
    "a87d942c"
  ]
}
'

// should succeed, as before
```

A `sendtocontract` should require user authorizatoin:

```
curl -i http://localhost:9888 -X POST -H "Content-Type: application/json" -d '
{
  "jsonrpc": "1.0",
  "id": 1,
  "method": "sendtocontract",
  "params": [
    "9a2349a6a97e27a67c6887633f79384882cfaf02",
    "a87d942c"
  ]
}
'
```

Now it fails with `402 Payment Required` error:

```
HTTP/1.1 402 Payment Required
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=UTF-8
Vary: Origin
Date: Fri, 10 Nov 2017 03:46:28 GMT
Content-Length: 278

{
  "id": "yA3vGXW8b7Ct-rEEEqpK0Tln_G66n8p7jydu-kw3rns",
  "state": "pending",
  "request": {
    "method": "sendtocontract",
    "id": 1,
    "params": [
      "9a2349a6a97e27a67c6887633f79384882cfaf02",
      "a87d942c"
    ],
    "auth": "yA3vGXW8b7Ct-rEEEqpK0Tln_G66n8p7jydu-kw3rns"
  },
  "createdAt": "2017-11-10T03:46:28.616583838Z"
}
```

And opening the authorization UI at http://localhost:9888, you should see an RPC call pending authorization:

![](images/tx-pending-authorization.jpg)

If the user click `Approve`, the client would then be able to make the same `sendtocontract` call again, and succeed.

> For details of how RPC authorization works, see [QTUM Portal Authorization Design](https://github.com/hayeah/qtum-portal/blob/master/DESIGN.md). `qtumjs` handles authorization transparently, so you don't need to think about this in practice.

# Developing The DApp UI

A DApp is essentially a UI wrapper for accessing a set of smart contracts' methods.

In [solar.development.json](https://github.com/hayeah/qtum-dapp-counter/blob/master/solar.development.json.example) there is information about the deployed contracts, which qtumjs can use to `call` or `send` to a contract.

We can access a contract by initializing a `Contract` object:

```js
// QTUM_RPC is the RPC URL
const rpc = new QtumRPC(QTUM_RPC)

// CONTRACTS is the JSON object in solar.development.json
const counter = new Contract(rpc, CONTRACTS.counter)
```

These two constants are defined in [config/development.js](https://github.com/hayeah/qtum-dapp-counter/blob/master/config/development.js).

A `Contract` instance provides the `call` and `send` methods. The first argument is the method name, and the second argument an array of parameter values for the method call:

```js
const r = await counter.call("getCount", [])
// r.outputs is the methods's returned values

const r = await counter.send("increment", [n])
// r.logs is the method's emitted log events
```

See [api.ts](https://github.com/hayeah/qtum-dapp-counter/blob/master/src/api.ts) for an example of building a simple API wrapper.


# The DApp Dev Server

Let's get the DApp running. First, install [npm](https://www.npmjs.com/) dependencies:

```
# https://yarnpkg.com/en/
yarn install
```

Start Neutrino dev server on port 3000:

```
PORT=3000 yarn start
```

Open http://localhost:3000, and edit `src/index.tsx` for live-reload.

See: [YouTube Demo Video](https://youtu.be/zLUE5m6ccqk)

For styling, edit `src/index.css`.

Edit the [html](https://github.com/hayeah/neutrino-react-ts-boilerplate/blob/727d23b260935edd7a3b2c56d8e05ef616cec31c/.neutrinorc.js#L10) options to customize the HTML template. See [html-webpack-template](https://github.com/jaketrent/html-webpack-template/tree/624dd3931cc2ffaeed03962b25c61af81c2997e2#basic-usage).

# Other Tips

Generating sourcemap may slow down project rebuilding. Webpack provide other sourcemap types that can speed up project building.

In particular, the `eval` sourcemap is quite faster.

```
SOURCEMAP=eval PORT=3000 yarn start
```

See [devtool](https://webpack.js.org/configuration/devtool/#devtool`) for a list of sourcemap types.