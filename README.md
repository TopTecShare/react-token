# Personal Identification Token
A fully on-chain KYC and AML solution made for existing dapps and protocol to be compliant with upcoming regulations in DeFi.

## NFT
The core smart contracts deployed to Kovan testnet.
Using
* Chainlink - to pass data from the user to ComplyCube and mint a NFT
* Sushiswap - for swapping ETH to LINK to pay for the oracle call

## Backend
The middleman between ComplyCube KYC provider and the blockchain.
Using
* ComplyCube - KYC provider
* IPFS/web3 storage - to store the *clientID*

## Frontend
A ReactJS app to showcase the demo
Needs MetaMask installed and some testETH.
