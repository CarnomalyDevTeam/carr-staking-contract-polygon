const fs = require('fs');
const { parse } = require('csv-parse');
const hre = require("hardhat");

let csvData = [];
let addresses = [];
let amounts = [];
let elapsed = [];
let depositTime;

const walletA = "0xA37D0d351a306fbbC40B99Bbf398EbFFa8Ee071f";
const walletB = "0xB45C11349Ba876DB93A120418814834c5C115649";
const qty = "100000000000000000000000";

const month_in_seconds = 2628000;
const r = {
  m1: "1680633033310046341168",
  m2: "3389511340546621956208",
  m12m1: "22140274964779807753125",
  m12: "22140275739388350171449",
};

fs.createReadStream(__dirname + '/../rewardsList.csv')
  .pipe(
    parse({
      delimiter: ','
    })
  )
  .on('data', function (dataRow) {
    csvData.push(dataRow);
  })
  .on('end', function () {
    console.log(csvData);
    for(i = 0 ;i < csvData.length; i++) {
      addresses[i] = csvData[i][0];
      elapsed[i] = csvData[i][1].slice(0,-3);
      amounts[i] = BigInt(csvData[i][2]) * BigInt(10**18);
    }
  });

async function main() {
  //Get wallets
  [owner, addr1, addr2] = await ethers.getSigners();

  //Deploy Smart Contract
  const Carr = await hre.ethers.getContractFactory("CARR");
  const carr = await Carr.deploy();
  await carr.deployed();
  console.log("Deployed to:", carr.address);

  //Check total supply of CARR
  console.log(await carr.totalSupply(), "ttlSupply");

  //transfer CARR to wallets
  await carr.transfer(carr.address, "350000000000000000000000");
  await carr.transfer(walletA, "140000000000000000000000");
  const transferTx = await carr.transfer(walletB, "43000000000000000000000");
  await transferTx.wait();
  
  //Check balances in CARR
  console.log(await carr.balanceOf(carr.address), "Contract balance");
  console.log(await carr.balanceOf(walletA), "walletA balance");
  console.log(await carr.balanceOf(walletB), "walletB balance");

  //Check total stake, Empty
  console.log(await carr.totalSupplyStaked(), "ttlSupplyStaked, empty");

  // await ff(month_in_seconds);
  
  //Call distribute Rewards function after airdrop operation
  const distRewards = await carr.distributeRewards(addresses,amounts,elapsed);
  await distRewards.wait();

  //Check balances of CARR staked
  console.log(await carr.balanceOfStaked(walletA), "walletA staked");
  console.log(await carr.balanceOfStaked(walletB), "walletB staked");

  //Check total stake, again
  console.log(await carr.totalSupplyStaked(), "ttlSupplyStaked, initialized");

  //Check rewards
  console.log(await carr.rewardsOf(walletA), "walletA initial rewards from migration");
  console.log(await carr.rewardsOf(walletB), "walletB initial rewards from migration");

  // depositTime = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
  // await ff(2 * month_in_seconds);
  // ethers.provider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0});

  console.log(await carr.rewardsOf(walletA), "walletA after 2 months");
  console.log(await carr.rewardsOf(walletB), "walletB after 2 months");
}

async function ff(t) {
  let block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
  const deltaT = depositTime + t - block.timestamp;
  if (deltaT) {
    await ethers.provider.send('evm_increaseTime', [deltaT]); // one year
    await hre.ethers.provider.send('evm_mine');
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
