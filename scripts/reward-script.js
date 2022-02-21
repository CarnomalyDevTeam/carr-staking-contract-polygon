const fs = require('fs');
const { parse } = require('csv-parse');
const hre = require("hardhat");

let csvData = [];
let addresses = [];
let amounts = [];
let elapsed = [];
let depositTime;
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
  [owner, addr1, addr2] = await ethers.getSigners();
  const Carr = await hre.ethers.getContractFactory("CARR");
  const carr = await Carr.deploy();
  await carr.deployed();
  console.log("Deployed to:", carr.address);

  await carr.transfer(carr.address, "350000000000000000000000");
  await carr.transfer("0xA37D0d351a306fbbC40B99Bbf398EbFFa8Ee071f", "140000000000000000000000");
  const transferTx = await carr.transfer("0xB45C11349Ba876DB93A120418814834c5C115649", "43000000000000000000000");
  await transferTx.wait();
  
  console.log(await carr.balanceOf(carr.address), "Contract balance");
  console.log(await carr.balanceOf("0xA37D0d351a306fbbC40B99Bbf398EbFFa8Ee071f"), "walletA balance");
  console.log(await carr.balanceOf("0xB45C11349Ba876DB93A120418814834c5C115649"), "walletB balance");
  console.log(await carr.totalSupplyStake(), "ttlSupplyStaked");

  const x = await carr.stake(qty);
  await x.wait();

  // await ff(month_in_seconds);
  console.log(await carr.rewardsOf(owner.address));
 
  const distRewards = await carr.distributeRewards(addresses,amounts,elapsed);
  await distRewards.wait();

  console.log(await carr.balanceOfStaked("0xA37D0d351a306fbbC40B99Bbf398EbFFa8Ee071f"), "AddrA");
  console.log(await carr.balanceOfStaked("0xB45C11349Ba876DB93A120418814834c5C115649"), "AddrB");
  console.log(await carr.balanceOfStaked(owner.address), "Owner");

  // console.log(await carr.totalSupply(), "ttlSupply");
  console.log(await carr.totalSupplyStake(), "ttlSupplyStaked");

  // await ff(2 * month_in_seconds);

  // console.log(await carr.rewardsOf("0xA37D0d351a306fbbC40B99Bbf398EbFFa8Ee071f"), "AddrA after 2 months");
  // console.log(await carr.balanceOfStaked("0xB45C11349Ba876DB93A120418814834c5C115649"), "AddrB after 2 months");  
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
