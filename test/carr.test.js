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
  let unfreezeDate = 1645040974; // 2-16-2022

  before(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CARR");
    carrToken = await Token.deploy();
  });

  describe('ERC20 Tests:', async function () {
    describe("Deployment", async function () {
      it("Smart Contract is deployed and tokens minted", async function () {});
      describe("Metadata", async function () { 
        it("Has a callable name method", async function () {
          expect(await carrToken.name()).to.equal("Carnomaly");
        });
        it("Has a callable symbol method", async function () { 
          expect(await carrToken.symbol()).to.equal("CARR");
        });
        it("Describes the decimal precision", async function () { 
          expect(await carrToken.decimals()).to.equal(18);
        });
      });
      describe("Ownership", async function () {
        it("Is owned by the deployer", async function () {
          expect(await carrToken.isOwner()).to.equal(owner.address);
        });
        it("Can transfer ownership to co-owner", async function () {
          await carrToken.transferOwnership(addr1.address);
          expect(await carrToken.isOwner()).to.equal(addr1.address);
          //transfer back to owner wallet
          await carrToken.connect(addr1).transferOwnership(owner.address);
        });
      });
    });
    describe('Balances', async function () {
      it('Has a total supply', async function () { 
        expect(await carrToken.totalSupply()).to.equal("10000000000000000000000000");
      });
      it('Has a funded owner wallet', async function () {
        expect(await carrToken.balanceOf(owner.address)).to.equal("5000000000000000000000000");
      });
      it('Has a funded secondary owner wallet', async function () {
        expect(await carrToken.balanceOf(addr1.address)).to.equal("5000000000000000000000000");
      });
      it('Has an empty consumer wallet', async function () {
        expect(await carrToken.balanceOf(addr2.address)).to.equal(0);
      });
      // it('Approves', async function () {
      //   console.log(await this.carr.approve(addr2.address, "5000"));
      //   expect(await this.carr.approve(addr2.address, "5000")).to.be.true;
      // });
      it('Transfers 5000 to consumer wallet', async function () {
        await carrToken.transfer(addr2.address, "5000");
        expect(await carrToken.balanceOf(addr2.address)).to.equal("5000");
      });
      it('A spender (consumer wallet) can be approved to spend 5000 on behalf of owner', async function () {
        await carrToken.approve(addr2.address, "5000");
        expect(await carrToken.allowance(owner.address, addr2.address)).to.equal("5000");
      });
    });
    describe('Mintable', async function () { 

    });
    describe("Pausable", async function () {
      it('Can be paused on emergency', async function () {
        await carrToken.pause();
        await expect(carrToken.transfer(addr2.address, "500")).to.be.revertedWith("Transaction reverted without a reason string");
      });
      it('Can be resumed (unpaused)', async function () {
        await carrToken.unpause();
        await carrToken.transfer(addr2.address, "500");
        expect(await carrToken.balanceOf(addr2.address)).to.equal(5500);
      });
    });
    describe("Burnable", async function () { 
      it('Is called to burn 1000 tokens from sender address', async function () { 
        await carrToken.connect(addr2).burn("1000");
        expect(await carrToken.balanceOf(addr2.address)).to.equal(4500);
      });
    });
    describe("Mint&Freeze", async function () { 
      it('Can mint 500 tokens usable in future', async function () { 
        await carrToken.mintAndFreeze(addr2.address, "500", unfreezeDate);
        // console.log(await carrToken.actualBalanceOf(addr2.address));
        // console.log(await carrToken.getFreezing(addr2.address));
        expect(await carrToken.actualBalanceOf(addr2.address)).to.equal("4500");
      });
      // it('Frozen tokens cannot be transferred', async function () {
      //   await expect(carrToken.transfer(addr1.address, "6000"));
      //   expect(await carrToken.balanceOf(addr2.address)).to.equal("6000");
      // });
      // it('Can unfreeze tokens on date specified', async function () {
      //   await carrToken.releaseAll();
      //   advancement = 86400 * 60; // 10 Days
      //   await ethers.provider.send("evm_increaseTime", [advancement]);
      //   expect(await carrToken.freezingCount(addr2.address)).to.equal("6000");
      // });
    });
  });
  describe('Staking Tests:', async function () {
    describe('Staking', async function () {
      it("Has no rewards initially", async function () {
        expect(await carrToken.rewardsOf(owner.address)).to.equal("0");
      });
      it('Receives liquidity tokens for Staking', async function () {
        await carrToken.transfer(carrToken.address, "550000");
        expect(await carrToken.balanceOf(carrToken.address)).to.equal("550000");
      });
      it("Accepts staking deposits", async function () {
        // await carrToken.approve(carrToken.address, "150000");  // owner stakes qty
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
      it("Has a staked amount of 33210", async function () {
        expect(await carrToken.rewardsOf(owner.address)).to.equal("33210");
      });
      it("Has ability to withdraw all stake of 33210", async function () {
        await carrToken.withdrawAll();
        expect(await carrToken.rewardsOf(owner.address)).to.equal(0);
      });
      it("33210 in rewards are reflected in wallet", async function () {
        expect(await carrToken.balanceOf(owner.address)).to.equal("4999999999999999999627710");
      });
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