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
  let addresses = ["0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65","0x90F79bf6EB2c4f870365E785982E1f101E93b906"];
  let amounts = [140000000000000000000000n,43000000000000000000000n];
  let elapsed = [1644535431,1633036252];
  let manualStake = [
    ["0xBcd4042DE499D14e55001CcbB24a551F3b954096", "100000000000000000000000"],
    ["0x71bE63f3384f5fb98995898A86B02Fb2426c5788", "44000000000000000000000"],
    ["0xFABB0ac9d68B0B445fB7357272Ff202C5651694a", "23000000000000000000000"],
    ["0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec", "440000000000000000000000"],
    ["0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097", "840000000000000000000000"]
  ]

  before(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("CARR");
    carrToken = await Token.deploy();

    // fs.createReadStream(__dirname + testFile)
    // .pipe(
    //   parse({
    //     delimiter: ','
    //   })
    // )
    // .on('data', function (dataRow) {
    //   csvData.push(dataRow);
    // })
    // .on('end', function () {
    //   // console.log(csvData);
    //   for(i = 0 ;i < csvData.length; i++) {
    //     addresses[i] = csvData[i][0];
    //     elapsed[i] = csvData[i][1].slice(0,-3);
    //     amounts[i] = BigInt(csvData[i][2]) * BigInt(10**18);
    //   }
    // });
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
      it('Distribute tokens for AVAX migration', async function () {
        await carrToken.approve(owner.address, BigInt(140000000000000000000000000));
        await carrToken.distributeTokens(owner.address, addresses, amounts);
        expect(await carrToken.balanceOf(addr4.address)).to.equal("140000000000000000000000");
        expect(await carrToken.balanceOf(addr3.address)).to.equal("43000000000000000000000");
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
      it('Can freeze a wallets tokens', async function () {
        await carrToken.connect(addr1).freezeTo(addr5.address, "5000000000000000000000000", unfreezeDate);
        await expect(carrToken.connect(addr1).transfer(owner.address, "1000000000000000000000")).to.be.reverted;
      });      
      it('Can mint 5000 tokens usable in future', async function () { 
        await carrToken.mintAndFreeze(addr2.address, "5000000000000000000000", unfreezeDate);
        expect(await carrToken.actualBalanceOf(addr2.address)).to.equal("9500000000000000000000");
      });
      it('Can query amount of funds frozen', async function () { 
        expect(await carrToken.freezingBalanceOf(addr2.address)).to.equal("5000000000000000000000");
      });
      it('Frozen tokens cannot be transferred', async function () {
        await expect(carrToken.connect(addr2).transfer(addr1.address, "10000000000000000000000")).to.be.reverted;
      });
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
        await expect(carrToken.recoverERC20("1000")).to.emit(carrToken, "Recovered").withArgs(carrToken.address, "1000");
        expect(await carrToken.balanceOf(carrToken.address)).to.equal("550000");
      });
      it("Accepts staking deposits", async function () {
        depositTime = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
        await carrToken.stake("150000");
        expect(await carrToken.balanceOfStaked(owner.address)).to.equal("150000");
      });
      it("Set the finishTime to 1 year after deposit", async function () {
        await expect(carrToken.setFinish(depositTime + 31536000))
          .to.emit(carrToken, "StakingEnds").withArgs(depositTime + 31536000); // finish 1 year after deposit
      });
      it("Distributes staking rewards for AVAX", async function () {
        await carrToken.distributeRewards(addresses,amounts,elapsed);
        expect(await carrToken.balanceOfStaked(addr3.address)).to.equal("43000000000000000000000");
        expect(await carrToken.balanceOfStaked(addr4.address)).to.equal("140000000000000000000000");
      });
      it("Accepts a pre-calculated stake amount transaction from Owner", async function () {
        //fund test wallets so they can stake
        await carrToken.transfer("0xBcd4042DE499D14e55001CcbB24a551F3b954096", "10000000000000000000000");
        await console.log(await carrToken.balanceOf("0xBcd4042DE499D14e55001CcbB24a551F3b954096"));

        await carrToken.transfer("0x71bE63f3384f5fb98995898A86B02Fb2426c5788", "44000000000000000000000");
        await console.log(await carrToken.balanceOf("0x71bE63f3384f5fb98995898A86B02Fb2426c5788"));

        await carrToken.transfer("0xFABB0ac9d68B0B445fB7357272Ff202C5651694a", "23000000000000000000000");
        await console.log(await carrToken.balanceOf("0xFABB0ac9d68B0B445fB7357272Ff202C5651694a"));

        await carrToken.transfer("0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec", "440000000000000000000000");
        await console.log(await carrToken.balanceOf("0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec"));

        await carrToken.transfer("0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097", "840000000000000000000000");
        await console.log(await carrToken.balanceOf("0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097"));

        await carrToken.migrationStake("0xBcd4042DE499D14e55001CcbB24a551F3b954096", "10000000000000000000000");

        // await carrToken.migrationStake(manualStake[0][0], manualStake[0][1]);
        // await carrToken.migrationStake(manualStake[1][0], manualStake[1][1]);
        // await carrToken.migrationStake(manualStake[2][0], manualStake[2][1]);
        // await carrToken.migrationStake(manualStake[3][0], manualStake[3][1]);
        // await carrToken.migrationStake(manualStake[4][0], manualStake[4][1]);

        expect(await carrToken.balanceOfStaked("0xBcd4042DE499D14e55001CcbB24a551F3b954096")).to.equal("10000000000000000000000");
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
        expect(await carrToken.totalSupplyStaked()).to.equal("193000000000000000150000");
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
        expect(await carrToken.balanceOf(owner.address)).to.equal("3449499999999999999483210");
      });
      it("Set the finishTime to 1 year after deposit", async function () {
         // finish 1 year after deposit
        await expect(carrToken.setFinish(depositTime + 31536000)).to.emit(carrToken, "StakingEnds").withArgs(depositTime + 31536000);
      });
    });
  });

  describe("Finished", async function () {
    it('Can unfreeze tokens on date specified', async function () {
      await carrToken.releaseAll();
      advancement = 86400 * 60; // 10 Days
      await ethers.provider.send("evm_increaseTime", [advancement]);
      expect(await carrToken.freezingCount(addr2.address)).to.equal("1");
    });
    it("Stops accepting deposits", async function () {
      await expect(carrToken.stake("2000")).to.be.revertedWith("Staking period has ended");
    });
    // it("Stops increasing rewards", async function () {
    //   // await ff(month_in_seconds * 12 + 1);
    //   expect(await carrToken.rewardsOf(owner.address)).to.equal(r.m12);
    //   // await ff(month_in_seconds * 13);
    //   // expect(await carrToken.rewardsOf(owner.address)).to.equal(r.m12);
    // });
    it("Allows withdrawals", async function () {
      // emit Withdrawn(to, amount);

      // await expect(carrToken.withdraw(qty))
      //   .to.emit(carrToken, "Withdrawn").withArgs(owner.address, qty)
      //   .to.emit(carrToken, 'Staked').withArgs(owner.address, r.m12);
      // expect(await Staking.balanceOf(owner.address)).to.equal(r.m12);
      // expect(await ERC20Token.balanceOf(owner.address)).to.equal("4900000000000000000000000");
    });
    // it("Has expected totalSupply", async function () {
    //   expect(await Staking.totalSupply()).to.equal("122140275739388350171449");
    // });
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