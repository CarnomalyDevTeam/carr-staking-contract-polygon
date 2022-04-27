const hre = require("hardhat");
const fs = require('fs');
const { parse } = require('csv-parse');

let csvData = [];
let addresses = [];
let amounts = [];
let tokenDonor = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC";

fs.createReadStream(__dirname + '/../distList.csv')
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
      amounts[i] = BigInt(csvData[i][1]) * BigInt(10**18);
    }
  });

async function main() {
  [owner] = await ethers.getSigners();
  const Carr = await hre.ethers.getContractFactory("CARR");
  const carr = await Carr.deploy();

  await carr.deployed();

  console.log("Deployed to:", carr.address);

  await carr.approve(owner.address, BigInt(140000000000000000000000000))
  await carr.distributeTokens(owner.address,addresses,amounts, {
    gasLimit: 100000,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
