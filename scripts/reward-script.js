const hre = require("hardhat");
const fs = require('fs');
const { parse } = require('csv-parse');

let csvData = [];
let addresses = [];
let amounts = [];
let elapsed = [];
let depositTime;
const month_in_seconds = 2628000;

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
      elapsed[i] = csvData[i][1];
      amounts[i] = BigInt(csvData[i][2]) * BigInt(10**18);
    }
  });

async function main() {
  [owner] = await ethers.getSigners();
  const Carr = await hre.ethers.getContractFactory("CARR");
  const carr = await Carr.deploy();

  await carr.deployed();

  console.log("Deployed to:", carr.address);

  await carr.connect(owner).transfer(carr.address, "55100000000");
  await carr.approve(owner.address, "55100000000");  // owner stakes qty
  await carr.distributeRewards(addresses,amounts,elapsed, {
    gasLimit: 100000,
  });

  console.log(await carr.rewardsOf("0xA37D0d351a306fbbC40B99Bbf398EbFFa8Ee071f"), "AddrA");
  console.log(await carr.rewardsOf("0xB45C11349Ba876DB93A120418814834c5C115649"), "AddrB");
  console.log(await carr.totalSupply(), "ttlSupply");
  console.log(await carr.totalSupplyStake(), "ttlSupplyStaked");

  await ff(2 * month_in_seconds);

  console.log(await carr.rewardsOf("0xA37D0d351a306fbbC40B99Bbf398EbFFa8Ee071f"), "AddrA after 2 months");
  console.log(await carr.balanceOfStaked("0xB45C11349Ba876DB93A120418814834c5C115649"), "AddrB after 2 months");  
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
