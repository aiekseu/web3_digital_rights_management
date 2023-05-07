const { expect } = require("chai");

describe("MusicRoyalties", function () {
  let MusicRoyalties;
  let musicRoyalties;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    MusicRoyalties = await ethers.getContractFactory("MusicRoyalties");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    musicRoyalties = await MusicRoyalties.deploy();
    await musicRoyalties.deployed();
  });

  it("Register a song and check gas consumption", async function () {
    const songId = 1;
    const title = "Test Song";
    const artist = "Test Artist";
    const stakeholders = [owner.address, addr1.address];
    const shares = [70, 30];

    const registerSongTx = await musicRoyalties.registerSong(songId, title, artist, stakeholders, shares);

    const receipt = await registerSongTx.wait();
    console.log("Gas used for registering a song:", receipt.gasUsed.toString());
    expect(receipt.gasUsed).to.be.lte(200000); // Set an arbitrary limit for gas consumption
  });

  // Add more tests for other functions and gas consumption checks
});
