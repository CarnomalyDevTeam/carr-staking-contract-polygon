const { expect } = require("chai");
const { ethers } = require("hardhat");

// Start test block
describe('Carr', function () {
  before(async function () {
    this.CarrContract = await ethers.getContractFactory("CARR");
  });

  beforeEach(async function () {
    this.carr = await this.CarrContract.deploy();
    await this.carr.deployed();
  });

  // Test case
  it('Check balance of wallet', async function () {
    console.log(await this.carr.balanceOf("0xA3913b48F7E48BdFe6E7d9F0b27A7EEd52E1De3C"));
    expect((await this.carr.balanceOf("0xa26B07d42a57b25F141A77390718033AB425eE02")).toString());
  });
});