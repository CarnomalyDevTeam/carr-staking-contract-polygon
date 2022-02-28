const fs = require('fs');
const { parse } = require('csv-parse');
const hre = require("hardhat");
const ObjectsToCsv = require('objects-to-csv');

const walletA = "0xA37D0d351a306fbbC40B99Bbf398EbFFa8Ee071f";

let data = [];

async function thirtyDaysLater() {
  let thirtyDays = new Date().getTime() + 2592000;
  await hre.network.provider.send("evm_setNextBlockTimestamp", [thirtyDays]);
  await hre.network.provider.send("evm_mine");
}

async function main() {
  // Get wallets
  [owner, addr1, addr2] = await ethers.getSigners();

  // Deploy Smart Contract
  const Carr = await hre.ethers.getContractFactory("CARR");
  const carr = await Carr.deploy();
  await carr.deployed();
  console.log("Deployed to:", carr.address);

  // Check total supply of CARR
  let totalSupply = await carr.totalSupply();
  console.log("total supply: ", totalSupply);

  //transfer CARR to wallets
  await carr.transfer(carr.address, "350000000000000000000000");
  await carr.transfer(walletA, "140000000000000000000000");

  let totalSupplyStaked = await carr.totalSupplyStaked();
  console.log('Total supply staked: ', totalSupplyStaked);

  await carr.stake('556648000000000000000000');

  totalSupplyStaked = await carr.totalSupplyStaked();
  console.log('Total supply staked: ', totalSupplyStaked);

  let ownerStakedBalance = await carr.balanceOfStaked(owner.address);
  console.log('Owner account staked balance: ', ownerStakedBalance);

  let rewardsOfOwner = await carr.rewardsOf(owner.address);
  console.log('Rewards of owner: ', rewardsOfOwner);

  let arr = new Array(12);
  for (const [i, v] of arr.entries()) {
    let thirtyDaysTimestamp = 60*60*24*30;
    await ethers.provider.send('evm_increaseTime', [thirtyDaysTimestamp]);
    await hre.network.provider.send("evm_mine");

    reward = await carr.rewardsOf(owner.address);

    data.push({
      timestamp: thirtyDaysTimestamp*(i+1),
      reward: (reward)/(10**18)
    });
  }

  // Save data
  const csv = new ObjectsToCsv(data);
  await csv.toDisk('./data.csv');

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
