const fs = require('fs');
const { parse } = require('csv-parse');
const hre = require("hardhat");

let csvData = [];
let addresses = [];
let amounts = [];
let elapsed = [];
let depositTime;

const fnlFile = '/../calcStake.csv';

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
    for(i = 0 ;i < csvData.length; i++) {
      addresses[i] = csvData[i][0];
      amounts[i] = BigInt(csvData[i][2]) + BigInt(csvData[i][3]);
      console.log(amounts[i]);
    }
  });

async function main() {
  //Deploy Smart Contract
  const Carr = await hre.ethers.getContractFactory("CARR");
  const carr = await Carr.attach("0x9b765735C82BB00085e9DBF194F20E3Fa754258E");
  
  //transfer CARR to wallets
  // let tx = await carr.transfer(carr.address, "20350000000000000000000000");
  // await tx.wait();

  // Call migrationStake
  for(i = 0 ;i < csvData.length; i++) {
    console.log(addresses[i]);
    const migrateStaking = await carr.migrationStake(addresses[i], amounts[i], {
      gasLimit: 200000,
    });
    await migrateStaking.wait();
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
