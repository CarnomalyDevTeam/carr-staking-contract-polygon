const { expect } = require("chai");
const { ethers } = require("hardhat");

let mainWallet = "0x13Ba9082B3232253e89356d6906751A7f89d4F75";
let secondaryWallet = "0xA3913b48F7E48BdFe6E7d9F0b27A7EEd52E1De3C";

// Start test block
describe('Carr', function () {
  let owner
  let addr1
  let addr2

  before(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    this.CarrContract = await ethers.getContractFactory("CARR");
  });

  beforeEach(async function () {
    this.carr = await this.CarrContract.deploy();
    await this.carr.deployed();
  });

  // Test case
  describe('Balances', function () {
    it('Checking owner wallet', async function () {
      expect((await this.carr.balanceOf("0x13Ba9082B3232253e89356d6906751A7f89d4F75")).toString());
    });

    it('Checking 2nd wallet', async function () {
      expect((await this.carr.balanceOf("0xa26B07d42a57b25F141A77390718033AB425eE02")).toString());
    });

    it('Checking 3rd address', async function () {
      expect((await this.carr.balanceOf("0xA3913b48F7E48BdFe6E7d9F0b27A7EEd52E1De3C")).toString());
    });

    // it('Approve', async function () {
    //   console.log(await this.carr.approve(addr2.address, "5000"));
    //   expect(await this.carr.approve(addr2.address, "5000")).to.be.true;
    // });

    it('Transferring to 3rd address', async function () {
      await this.carr.transfer(addr2.address, "5000");
      expect(await this.carr.balanceOf(addr2.address)).to.equal("5000");
    });

    it('Checking 3rd address after transfer', async function () {
      console.log(await this.carr.balanceOf("0xA3913b48F7E48BdFe6E7d9F0b27A7EEd52E1De3C"));
      expect((await this.carr.balanceOf("0xA3913b48F7E48BdFe6E7d9F0b27A7EEd52E1De3C")).toString());
    });
  });
});