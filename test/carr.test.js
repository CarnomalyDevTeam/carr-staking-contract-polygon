const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('Carnomaly', function () {
  let owner;
  let addr1;
  let addr2;

  before(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CARR");
    carrToken = await Token.deploy();
    console.log(await carrToken.balanceOf(owner.address))
    console.log(carrToken.address);
  });

  describe('ERC20 Tests:', function () {
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
      it('Has an owner wallet', async function () {
        expect((await carrToken.balanceOf(owner.address)).toString());
      });
      it('Has a secondary owner wallet', async function () {
        expect((await carrToken.balanceOf(addr2.address)).toString());
      });
      it('Has a consumer wallet', async function () {
        expect((await carrToken.balanceOf(addr1.address)).toString());
      });
      // it('Approves', async function () {
      //   console.log(await this.carr.approve(addr2.address, "5000"));
      //   expect(await this.carr.approve(addr2.address, "5000")).to.be.true;
      // });
      it('Transfers 5000 to consumer wallet', async function () {
        await carrToken.transfer(addr2.address, "5000");
        expect(await carrToken.balanceOf(addr2.address)).to.equal("5000");
      });
    });
  });

  describe('Staking Tests:', function () {
    describe('Staking', function () {
      it('Receives liquidity tokens for Staking', async function () {
        await carrToken.transfer(carrToken.address, "150000");
        expect(await carrToken.balanceOf(carrToken.address)).to.equal("150000");
      });
      it("Accepts staking deposits", async function () {
        await carrToken.approve(carrToken.address, "500");  // owner stakes qty
        await carrToken.stake("500");
        expect(await carrToken.balanceOfStaked(owner.address)).to.equal("500");
      });
      it("Has expected staked totalSupply", async function () {
        expect(await carrToken.totalSupplyStake()).to.equal("500");
      });      
    })
  });
});