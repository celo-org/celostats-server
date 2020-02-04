Celo Network Stats
===============================================

This is a visual interface for tracking proof-of-work ("mainnet") and proof-of-authority ("testnet") network status. It uses WebSockets to receive stats from running nodes and output them through an angular interface. It is the front-end implementation for [celostats-frontend](https://github.com/celo-org/celostats-frontend).

## Proof-of-Stake
![Screenshot](https://user-images.githubusercontent.com/6178597/69904869-cba34900-13ac-11ea-9136-13fc51cf246e.gif "Screenshot POS")

* Demo: https://baklavastaging-ethstats.celo-testnet.org/

#### Prerequisite
* node
* yarn

#### Installation
Make sure you have node.js (10 or above) and yarn installed.

Clone the repository and install the dependencies:

```bash
git clone https://github.com/celo-org/celostats-server
cd celostats-server
yarn
```

#### Build
In order to build the static files you have to run compile which will generate dist directories containing the runnable version.

```bash
yarn compile
```

#### Run
Start a node process and pass a comma-separated list of trusted addresses to it or edit the list of trusted addresses in [the server config](/lib/utils/config.js).

```bash
TRUSTED_ADDRESSES="0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95,0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B" yarn start
```
Find the interface at http://localhost:3000
