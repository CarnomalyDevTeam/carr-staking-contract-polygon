// 1. Attach Proper smart contract address
// 2. uncomment/comment approval amount to Smart contract
// 3. Comment/ uncomment^
// 4. Perform airdrop

const fs = require('fs');
const { parse } = require('csv-parse');

let csvData = [];
let addresses = [];
let amounts = [];
let tokenDonor = "0x983062f86CefE41eB00ab99e3BB56283BC0DeF88";

fs.createReadStream(__dirname + '/../reports/calcStake.csv')
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
      amounts[i] = BigInt(csvData[i][2]);
      console.log(amounts[i]);
    }
  });

async function main() {
  [owner] = await ethers.getSigners();
  const Carr = await ethers.getContractFactory("CARR");
  const carr = await Carr.attach("0xDfa3e8710820683ACd3fa2D40c9621f9F32f771B");

  // await carr.approve(tokenDonor, BigInt(200000000000000000000000000));
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
