const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const unlockTime = currentTimestampInSeconds + 60;

  const lockedAmount = hre.ethers.utils.parseEther("0.001");

  const Drm = await hre.ethers.getContractFactory("MusicRoyalties");
  const drm = await Drm.deploy();

  console.log("start deploying")
  await drm.deployed();

  console.log(
    `Lock with ${hre.ethers.utils.formatEther(
      lockedAmount
    )}ETH and unlock timestamp ${unlockTime} deployed to ${drm.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
