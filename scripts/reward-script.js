// 1. Attach Proper smart contract address
// 2. uncomment/comment transfer amount to Smart contract
// 3. Comment/ uncomment^
// 4. Split the csv inputs for cost tracking
// 5. Perform DistRewards

const fs = require('fs');
const { parse } = require('csv-parse');
const hre = require("hardhat");

let csvData = [];
let addresses = [];
let amounts = [];
let elapsed = [];
let depositTime;

const fnlFile = '/../reports/transactions.csv';

fs.createReadStream(__dirname + fnlFile)
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
  //Attach to Smart Contract on Mainnet
  const Carr = await hre.ethers.getContractFactory("CARR");
  const carr = await Carr.attach("0xDfa3e8710820683ACd3fa2D40c9621f9F32f771B");

  // transfer CARR to contract
  // let tx = await carr.transfer(carr.address, "");
  // await tx.wait();

  //Call distribute Rewards function after airdrop operation
  const distRewards = await carr.distributeRewards(addresses, amounts, elapsed, {
    gasLimit: 3100000,
  });
  await distRewards.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
