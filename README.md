# Music Royalties Smart Contract

This repository hosts the implementation of a Music Royalties Smart Contract on the Polygon blockchain network. This
project aims to streamline royalty distribution in the music industry using blockchain technology and smart contracts.

# Demo
- [Chainlink VRF Subscription](https://vrf.chain.link/polygon-amoy/27386271310033774427731689780733372915241729820450466377140907977388552390469)
- [Smart Contract on PolygonScan](https://amoy.polygonscan.com/address/0x1c8130Ae4c713b9bAaf4fEE12BF8fFEBB22faFA9)
- [Songs dataset](https://www.kaggle.com/datasets/stefancomanita/top-us-songs-from-1950-to-2019-w-lyrics)

## Features

The smart contract has the following key features:

- Song registration on the blockchain.
- Updating royalty distribution for a song.
- Monitoring song plays using Chainlink oracle.
- Calculating royalties for stakeholders.
- Distributing royalties to stakeholders.
- Managing song licenses.

## Dependencies

- [Chainlink](https://chain.link/) for oracle-based play count monitoring.
- [OpenZeppelin](https://openzeppelin.com/) for ERC20 token support.

## Smart Contract Security

The smart contract includes various checks to ensure the security of the system. These checks include validating the
input parameters and checking for the existence of songs and licenses before executing functions.

## Gas Optimization

To minimize the gas cost of transactions, the smart contract implements a batch distribution functionality. This allows
the distribution of royalties for multiple songs and recipients in a single transaction.

## Setup

Here's how you can setup and run this project:

1. Navigate to the project directory:

```
cd music-royalties-smart-contract
```

2. Install dependencies:

```
npm install
```

3. Compile the smart contract:

```
npx hardhat compile
```

4. Run tests:

```
TEST=1 npx hardhat test
```

## Deploy

Update `s_subscriptionId` to match your Chainlink VRF Subscription ID.

Then run those commands to deploy contract to Polygon Amoy network:

```
npx hardhat run ./scripts/deploy.js  
npx hardhat verify {DEPLOYED_CONTRACT_ADDRESS}
```

## Contributing

I welcome contributions from the community. If you'd like to contribute, please fork the repository and make changes as
you'd like. Pull requests are warmly welcome.

## License

This project is licensed under the terms of the MIT license.

## Questions?

If you have any questions, please feel free
to [open an issue](https://github.com/aiekseu/web3_digital_rights_management/issues/new).
