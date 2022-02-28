const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require('fs');
const { parse } = require('csv-parse');
const testFile = '/../rewardsList.csv';
const fnlFile = '/../transactions.csv';

describe.only('Carnomaly', function () {
  const month_in_seconds = 2628000;
  const r = {
    m1: "2520",
    m2: "5084",
    m12m1: "33210",
    m12: "33210",
  };
  
  let depositTime;
  let unfreezeDate = 1656441635; // 6-28-2022, date to test mintAndFreeze
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
    // console.log(csvData);
    for(i = 0 ;i < csvData.length; i++) {
      addresses[i] = csvData[i][0];
      elapsed[i] = csvData[i][1].slice(0,-3);
      amounts[i] = BigInt(csvData[i][2]) * BigInt(10**18);
    }
  });

  before(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
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
      it('Gives approval', async function () {
        await carrToken.approve(addr2.address, "5000000000000000000000");
        expect(await carrToken.allowance(owner.address, addr2.address)).to.equal("5000000000000000000000");
      });
      it('A spender (consumer wallet) can be approved to spend 5000 on behalf of owner', async function () {
        await carrToken.connect(addr2).transferFrom(owner.address,addr2.address, "5000000000000000000000");
        expect(await carrToken.balanceOf(addr2.address)).to.equal("5000000000000000000000");
      });
      it('Transfers 5000 to consumer wallet', async function () {
        await carrToken.transfer(addr2.address, "5000000000000000000000");
        expect(await carrToken.balanceOf(addr2.address)).to.equal("10000000000000000000000");
      });
    });
    describe("Pausable", async function () {
      it('Can be paused on emergency', async function () {
        await carrToken.pause();
        await expect(carrToken.transfer(addr2.address, "500000000000000000000")).to.be.revertedWith("Transaction reverted without a reason string");
      });
      it('Can be resumed (unpaused)', async function () {
        await carrToken.unpause();
        await carrToken.transfer(addr2.address, "500000000000000000000");
        expect(await carrToken.balanceOf(addr2.address)).to.equal("10500000000000000000000");
      });
    });
    describe("Burnable", async function () { 
      it('Is called to burn 1000 tokens from sender address', async function () {
        await carrToken.connect(addr2).burn("1000000000000000000000");
        expect(await carrToken.balanceOf(addr2.address)).to.equal("9500000000000000000000");
      });
    });
    describe("Mint&Freeze", async function () { 
      it('Can mint 5000 tokens usable in future', async function () { 
        await carrToken.mintAndFreeze(addr2.address, "5000000000000000000000", unfreezeDate);
        expect(await carrToken.actualBalanceOf(addr2.address)).to.equal("9500000000000000000000");
      });
      // it('Can query amount of funds frozen', async function () { 
      //   expect(await carrToken.getFreezing(addr2.address)).to.equal("5000000000000000000000");
      // });
      it('Frozen tokens cannot be transferred', async function () {
        await expect(carrToken.connect(addr2).transfer(addr1.address, "10000000000000000000000")).to.be.reverted;
      });
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
        await carrToken.transfer(carrToken.address, "551000");
        expect(await carrToken.balanceOf(carrToken.address)).to.equal("551000");
      });
      it("Can recover CARR to owner address", async function () {
        await expect(carrToken.recoverERC20("1000")).to.emit(carrToken, "Recovered").withArgs(carrToken.address, "1000")
        expect(await carrToken.balanceOf(carrToken.address)).to.equal("550000");
      });
      it("Accepts staking deposits", async function () {
        // await carrToken.approve(carrToken.address, "150000");  // owner stakes qty
        depositTime = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
        await carrToken.stake("150000");
        expect(await carrToken.balanceOfStaked(owner.address)).to.equal("150000");
      });
      it("Set the finishTime to 1 year after deposit", async function () {
        await expect(carrToken.setFinish(depositTime + 31536000))
          .to.emit(carrToken, "StakingEnds").withArgs(depositTime + 31536000); // finish 1 year after deposit
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
        expect(await carrToken.totalSupplyStaked()).to.equal("150000");
      });
      it("Has a query for rewards amounting to 33210", async function () {
        expect(await carrToken.rewardsOf(owner.address)).to.equal("33210");
      });
      it("Has ability to withdraw partial stake of 33210 (reward amount)", async function () {
        await carrToken.withdraw("33210");
        expect(await carrToken.rewardsOf(owner.address)).to.equal(0);
      });
      it("Has ability to withdraw all, the remainder", async function () { 
        await carrToken.withdrawAll();
        expect(await carrToken.balanceOfStaked(owner.address)).to.equal(0);
      });
      it("33210 in rewards are reflected in overall wallet balance", async function () {
        expect(await carrToken.balanceOf(owner.address)).to.equal("4989499999999999999483210");
      });
      it("Set the finishTime to 1 year after deposit", async function () {
         // finish 1 year after deposit
        await expect(carrToken.setFinish(depositTime + 31536000)).to.emit(carrToken, "StakingEnds").withArgs(depositTime + 31536000);
      });
    })
    describe("Finished", async function () { 
      it("Stops accepting deposits", async function () {
        // await ERC20Token.approve(Staking.address, qty);  // owner stakes qty
        await expect(carrToken.stake("2000")).to.be.revertedWith("Staking period has ended");
      });
      it("Stops increasing rewards", async function () {
        // await ff(month_in_seconds * 12 + 1);
        // expect(await carrToken.rewardsOf(owner.address)).to.equal(r.m12);
        // await ff(month_in_seconds * 13);
        // expect(await carrToken.rewardsOf(owner.address)).to.equal(r.m12);
      });
      it("Allows withdrawals", async function () {
        // emit Withdrawn(to, amount);

        // await expect(carrToken.withdraw(qty))
        //   .to.emit(carrToken, "Withdrawn").withArgs(owner.address, qty)
        //   .to.emit(carrToken, 'Staked').withArgs(owner.address, r.m12);
        // expect(await Staking.balanceOf(owner.address)).to.equal(r.m12);
        // expect(await ERC20Token.balanceOf(owner.address)).to.equal("4900000000000000000000000");
      });
    
    });
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