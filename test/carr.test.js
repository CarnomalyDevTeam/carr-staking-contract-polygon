const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('Carr', function () {
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CARR");
    carrToken = await Token.deploy();
  });

  describe("Deployment", async function () {
    describe("Ownership", async function () {
      it("Is owned by the deployer", async function () {
        expect(await carrToken.isOwner()).to.equal(owner.address);
      });
      it("Allows successful ownership transfer to another wallet", async function () {
        await carrToken.transferOwnership(addr2.address);
        expect(await carrToken.isOwner()).to.equal(addr2.address);
      });
    });
  });

  describe('Balances', function () {
    it('Checking owner wallet', async function () {
      expect((await carrToken.balanceOf(owner.address)).toString());
    });
    it('Checking 2nd wallet', async function () {
      expect((await carrToken.balanceOf(addr2.address)).toString());
    });
    it('Checking 3rd address', async function () {
      expect((await carrToken.balanceOf(addr1.address)).toString());
    });
    // it('Approve', async function () {
    //   console.log(await this.carr.approve(addr2.address, "5000"));
    //   expect(await this.carr.approve(addr2.address, "5000")).to.be.true;
    // });
    it('Transferring to 3rd address', async function () {
      await carrToken.transfer(addr2.address, "5000");
      expect(await carrToken.balanceOf(addr2.address)).to.equal("5000");
    });
    it('Checking 3rd address after transfer', async function () {
      console.log(await carrToken.balanceOf("0xA3913b48F7E48BdFe6E7d9F0b27A7EEd52E1De3C"));
      expect((await carrToken.balanceOf("0xA3913b48F7E48BdFe6E7d9F0b27A7EEd52E1De3C")).toString());
    });
  });
});