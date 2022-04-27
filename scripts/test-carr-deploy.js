const hre = require("hardhat");

async function main() {
  const Carr = await hre.ethers.getContractFactory("CARR");
  const carrtoken = await Carr.deploy();

  await carrtoken.deployed();

  console.log("Carr contract deployed to:", carrtoken.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
