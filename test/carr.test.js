const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('Carnomaly', function () {
  const month_in_seconds = 2628000;
  const r = {
    m1: "2520",
    m2: "5084",
    m12m1: "33210",
    m12: "33210",
  };
  let depositTime;

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
        // it("Allows successful ownership transfer to another wallet", async function () {
        //   await carrToken.transferOwnership(addr2.address);
        //   expect(await carrToken.isOwner()).to.equal(addr2.address);
        // });
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
      it("Has no rewards initially", async function () {
        expect(await carrToken.rewardsOf(owner.address)).to.equal("0");
      });
      it('Receives liquidity tokens for Staking', async function () {
        await carrToken.transfer(carrToken.address, "150000");
        expect(await carrToken.balanceOf(carrToken.address)).to.equal("150000");
      });
      it("Accepts staking deposits", async function () {
        await carrToken.approve(carrToken.address, "150000");  // owner stakes qty
        depositTime = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
        await carrToken.stake("150000");
        expect(await carrToken.balanceOfStaked(owner.address)).to.equal("150000");
      });
      it("Verifies interest after 1 month", async function () {
        await ff(month_in_seconds);
        expect(await carrToken.rewardsOf(owner.address)).to.equal(r.m1);
      });
      it("Verifies interest after 2 months", async function () {
        await ff(2 * month_in_seconds);
        expect(await carrToken.rewardsOf(owner.address)).to.equal(r.m2);
      });
      it("Verifies interest after 1 year (- 1 second)", async function () {
        await ff(12 * month_in_seconds - 1);
        expect(await carrToken.rewardsOf(owner.address)).to.equal(r.m12m1);
      });
      it("Verifies interest after 1 year", async function () {
        await ff(12 * month_in_seconds);
        expect(await carrToken.rewardsOf(owner.address)).to.equal(r.m12);
      });
      it("Has expected staked totalSupply", async function () {
        expect(await carrToken.totalSupplyStake()).to.equal("150000");
      });
      // it("Has ability to withdraw stake", async function () {
        
      // });
      it("Set the finishTime to 1 year after deposit", async function () {
         // finish 1 year after deposit
        await expect(carrToken.setFinish(depositTime + 31536000)).to.emit(carrToken, "StakingEnds").withArgs(depositTime + 31536000);
      });
  
    })
  });
  async function ff(t) {
    let block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
    const deltaT = depositTime + t - block.timestamp;
    if (deltaT) {
      await ethers.provider.send('evm_increaseTime', [deltaT]); // one year
      await hre.ethers.provider.send('evm_mine');
    }
  }
});