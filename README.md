# Carnomaly on Polygon


# Scripts
**NOTE**: Operations performed on a blockchain and smart contract are typically irreversable.

To perform the airdrop:
```
npx hardhat run airdrop-script.js --network fuji
```

To perform staking rewards migration:
```
npx hardhat run reward-script.js --network fuji
```

To run the manual calculated staking rewards:
```
npx hardhat run calculated-script.js --network fuji
```

The 'calculated-script' is a process created by the team to service staking users on the past Ethereum network implementation, who staked CARR multiple times on different dates. This created a situation less straight-forward, prompting a general staking reward process and a process for the smaller group of users needing to be manually calculated. The csv reports are generated by the web [scraping tool](https://gitlab.it.ardentcreative.com/clients/carnomaly/carnomaly-avalanche-token-swap/-/tree/main).

# Hardhat Testing
We use Hardhat to write scripts, debug, test, and deploy our smart contracts. In a few ways Hardhat can be compared to Truffle suite, to learn more about Hardhat testing click [here](https://hardhat.org).

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```
