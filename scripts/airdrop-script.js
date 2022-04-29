const fs = require('fs');
const { parse } = require('csv-parse');

let csvData = [];
let addresses = [];
let amounts = [];
let tokenDonor = "0x983062f86CefE41eB00ab99e3BB56283BC0DeF88";

fs.createReadStream(__dirname + '/../reports/rewardsList.csv')
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
      amounts[i] = BigInt(csvData[i][2]) * BigInt(10**18);
    }
  });

async function main() {
  [owner] = await ethers.getSigners();
  const Carr = await ethers.getContractFactory("CARR");
  const carr = await Carr.attach("0x9b765735C82BB00085e9DBF194F20E3Fa754258E");

  // await carr.approve(tokenDonor, BigInt(140000000000000000000000000));
  await carr.distributeTokens(tokenDonor, addresses, amounts, {
    gasLimit: 3100000,
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
