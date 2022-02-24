const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require('fs');
const { parse } = require('csv-parse');
const testFile = '/../rewardsList.csv';
const fnlFile = '/../transactions.csv';

let csvData = [];
let addresses = [];
let amounts = [];
let elapsed = [];

fs.createReadStream(__dirname + testFile)
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

describe('Carnomaly', function () {
  const month_in_seconds = 2628000;
  let depositTime;

  before(async function () {
    [owner, addr1] = await ethers.getSigners();
    const CalcContract = await ethers.getContractFactory("Calc");
    calc = await CalcContract.deploy();
  });

  describe.only('Alternative Stake', async function () {
      it("Calculates a single stake record", async function () {
        // expect(await calc.placeholderCalc(elapsed[0],amounts[0])).to.equal("141069075150300944280871");
         //141,068
         console.log("Calculated stake", await calc.placeholderCalc(elapsed[0],amounts[0]));
      });
  });

  async function fastForwardTime(t) {
    let block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
    const deltaT = depositTime + t - block.timestamp;
    if (deltaT) {
      await ethers.provider.send('evm_increaseTime', [deltaT]); // one year
      await hre.ethers.provider.send('evm_mine');
    }
  }
});