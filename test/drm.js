const { expect } = require('chai')
const { ethers } = require('hardhat')

const GAS_PRICE = 200 // Gwei
const MATIC_PRICE_IN_USD = 0.9 // USD

const calculateTxCost = (gasUsed) => {
    const priceInMatic = gasUsed.toNumber() * GAS_PRICE / 1000000000
    const priceInUSD = priceInMatic * MATIC_PRICE_IN_USD

    return {
        matic: priceInMatic,
        usd: priceInUSD,
    }
}

describe('Proper work of MusicRoyalties Smart Contract', function () {
    let MusicRoyalties, musicRoyalties, owner, addr1, addr2, addr3
    let TestToken, testMATIC, amount

    beforeEach(async function () {
        TestToken = await ethers.getContractFactory('TestMATIC')
        testMATIC = await TestToken.deploy()
        await testMATIC.deployed()

        MusicRoyalties = await ethers.getContractFactory('MusicRoyalties');
        [owner, addr1, addr2, addr3] = await ethers.getSigners()
        musicRoyalties = await MusicRoyalties.deploy()
        await musicRoyalties.deployed()

        amount = ethers.utils.parseEther('100000')
        await testMATIC.mint(owner.address, amount)
    })

    it('Register a song and check gas consumption', async function () {
        // Song metadata
        const songId = 1
        const title = 'Test Song'
        const artist = 'Test Artist'
        const stakeholders = [owner.address, addr1.address]
        const shares = [70, 30]

        // Tx
        const registerSongTx = await musicRoyalties.registerSong(songId, title, artist, stakeholders, shares)
        const receipt = await registerSongTx.wait()

        // Gas used by tx
        const { gasUsed } = receipt
        const { usd, matic } = calculateTxCost(gasUsed)
        console.log('Gas used for registering a song:', gasUsed.toString())
        console.log(`Tx cost: ${matic.toFixed(4)} MATIC or $${usd.toFixed(2)}`)

        expect(gasUsed).to.be.lte(300000)
    })

    it('Calculates royalties correctly', async function () {
        // Register a song
        await musicRoyalties.connect(owner).registerSong(
            1,
            'Song 1',
            'Artist 1',
            [addr1.address, addr2.address, addr3.address],
            [40, 30, 30],
        )

        // Calculate royalties for the song
        const playCount = 1000
        const royaltyAmounts = await musicRoyalties.calculateRoyaltiesTest(1, playCount)

        // Estimate gas consumption
        const gasEstimate = await musicRoyalties.estimateGas.calculateRoyaltiesTest(1, playCount)
        const { usd, matic } = calculateTxCost(gasEstimate)
        console.log('Gas used for calculating royalties:', gasEstimate.toString())
        console.log(`Tx cost: ${matic.toFixed(4)} MATIC or $${usd.toFixed(2)}`)

        // Verify the royalty amounts
        expect(royaltyAmounts[ 0 ]).to.equal(400) // 40% of 1000 plays
        expect(royaltyAmounts[ 1 ]).to.equal(300) // 30% of 1000 plays
        expect(royaltyAmounts[ 2 ]).to.equal(300) // 30% of 1000 plays
    })

    it('Distributes royalties correctly', async function () {
        // Register a song
        await musicRoyalties.connect(owner).registerSong(
            1,
            'Song 1',
            'Artist 1',
            [addr1.address, addr2.address, addr3.address],
            [40, 30, 30],
        )

        // Approve the MusicRoyalties contract to spend test MATIC tokens
        await testMATIC.connect(owner).approve(musicRoyalties.address, amount)

        // Distribute royalties for 1000 plays
        const playCount = 1000
        const tx = await musicRoyalties.connect(owner).distributeRoyalties(1, playCount, testMATIC.address)
        const receipt = await tx.wait()

        // Measure gas usage
        const { gasUsed } = receipt
        const { usd, matic } = calculateTxCost(gasUsed)
        console.log('Gas used for distributing royalties:', gasUsed.toString())
        console.log(`Tx cost: ${matic.toFixed(4)} MATIC or $${usd.toFixed(2)}`)

        // Check if the royalties were transferred correctly
        const addr1Balance = await testMATIC.balanceOf(addr1.address)
        const addr2Balance = await testMATIC.balanceOf(addr2.address)
        const addr3Balance = await testMATIC.balanceOf(addr3.address)

        // Verify that royalties distributed correctly
        expect(addr1Balance).to.equal('400')
        expect(addr2Balance).to.equal('300')
        expect(addr3Balance).to.equal('300')
    })

  it("Distributes royalties in batch correctly", async function () {
    await musicRoyalties.connect(owner).registerSong(
        1,
        'Song 1',
        'Artist 1',
        [addr1.address, addr2.address],
        [40, 60],
    )

    await musicRoyalties.connect(owner).registerSong(
        2,
        'Song 2',
        'Artist 2',
        [addr1.address, addr2.address, addr3.address],
        [40, 30, 30],
    )

    // Approve the transfer of test MATIC tokens from owner to the contract
    const totalAmount = ethers.utils.parseEther("2000");
    await testMATIC.connect(owner).approve(musicRoyalties.address, totalAmount);

    // Call the distributeRoyaltiesBatch function
    const ids = [1, 2];
    const playCounts = [1000, 1000];
    const tx = await musicRoyalties
        .connect(owner)
        .distributeRoyaltiesBatch(ids, playCounts, testMATIC.address);

    // Check the gas used
    const receipt = await tx.wait();
    const { gasUsed } = receipt
    const { usd, matic } = calculateTxCost(gasUsed)
    console.log("Gas used for distributing royalties in batch:", gasUsed.toString());
    console.log(`Tx cost: ${matic.toFixed(4)} MATIC or $${usd.toFixed(2)}`)

    // Check if royalties were distributed correctly
    const addr1Balance = await testMATIC.balanceOf(addr1.address);
    const addr2Balance = await testMATIC.balanceOf(addr2.address);
    const addr3Balance = await testMATIC.balanceOf(addr3.address);

    console.log(addr1Balance, addr2Balance, addr3Balance)

    expect(addr1Balance).to.equal("800");
    expect(addr2Balance).to.equal("900");
    expect(addr3Balance).to.equal("300");
  });
})


describe('Comparison of gas consumptions', function () {
    let MusicRoyalties, musicRoyalties, owner, addr1, addr2, addr3
    let TestToken, testMATIC, amount

    beforeEach(async function () {
        TestToken = await ethers.getContractFactory('TestMATIC')
        testMATIC = await TestToken.deploy()
        await testMATIC.deployed()

        MusicRoyalties = await ethers.getContractFactory('MusicRoyalties');
        [owner, addr1, addr2, addr3] = await ethers.getSigners()
        musicRoyalties = await MusicRoyalties.deploy()
        await musicRoyalties.deployed()

        amount = ethers.utils.parseEther('100000')
        await testMATIC.mint(owner.address, amount)
    })

    it('Register a song with big and small metadata', async function () {
        const song1Tx = await musicRoyalties.connect(owner).registerSong(
            1,
            'Song name with 25 symbols',
            'Artist name with 25 symbo',
            [addr1.address, addr2.address],
            [40, 60],
        )
        const song1Receipt = await song1Tx.wait()


        const song2Tx = await musicRoyalties.connect(owner).registerSong(
            2,
            'Song name with 200 symbolSong name with 100 symbolSong name with 100 symbolSong name with 100 symbolSong name with 200 symbolSong name with 100 symbolSong name with 100 symbolSong name with 100 symbol',
            'Artist name with 200 symbArtist name with 200 symbArtist name with 200 symbArtist name with 200 symbArtist name with 200 symbArtist name with 200 symbArtist name with 200 symbArtist name with 200 symb',
            [addr1.address, addr2.address],
            [40,60],
        )
        const song2Receipt = await song2Tx.wait()

        const song3Tx = await musicRoyalties.connect(owner).registerSong(
            3,
            'Song name with 25 symbols',
            'Artist name with 25 symbo',
            [addr1.address, addr2.address, addr1.address, addr2.address, addr1.address, addr2.address, addr1.address, addr2.address, addr1.address, addr2.address],
            [10,10,10,10,10,10,10,10,10,10],
        )
        const song3Receipt = await song3Tx.wait()

        const song4Tx = await musicRoyalties.connect(owner).registerSong(
            4,
            'Song name with 200 symbolSong name with 100 symbolSong name with 100 symbolSong name with 100 symbolSong name with 200 symbolSong name with 100 symbolSong name with 100 symbolSong name with 100 symbol',
            'Artist name with 200 symbArtist name with 200 symbArtist name with 200 symbArtist name with 200 symbArtist name with 200 symbArtist name with 200 symbArtist name with 200 symbArtist name with 200 symb',
            [addr1.address, addr2.address, addr1.address, addr2.address, addr1.address, addr2.address, addr1.address, addr2.address, addr1.address, addr2.address],
            [10,10,10,10,10,10,10,10,10,10],
        )
        const song4Receipt = await song4Tx.wait()

        const song5Tx = await musicRoyalties.connect(owner).registerSong(
            5,
            'Never gonna give you up',
            `
            [Intro]
Desert you
Ooh-ooh-ooh-ooh
Hurt you

[Verse 1]
We're no strangers to love
You know the rules and so do I
A full commitment's what I'm thinking of
You wouldn't get this from any other guy

[Pre-Chorus]
I just wanna tell you how I'm feeling
Gotta make you understand

[Chorus]
Never gonna give you up
Never gonna let you down
Never gonna run around and desert you
Never gonna make you cry
Never gonna say goodbye
Never gonna tell a lie and hurt you

[Verse 2]
We've known each other for so long
Your heart's been aching, but you're too shy to say it
Inside, we both know what's been going on
We know the game, and we're gonna play it
You might also like
The Pi Song (100 Digits of π)
AsapSCIENCE
A&W
Lana Del Rey
Cupid (Twin Version)
FIFTY FIFTY (피프티피프티)
[Pre-Chorus]
And if you ask me how I'm feeling
Don't tell me you're too blind to see

[Chorus]
Never gonna give you up
Never gonna let you down
Never gonna run around and desert you
Never gonna make you cry
Never gonna say goodbye
Never gonna tell a lie and hurt you
Never gonna give you up
Never gonna let you down
Never gonna run around and desert you
Never gonna make you cry
Never gonna say goodbye
Never gonna tell a lie and hurt you

[Post-Chorus]
Ooh (Give you up)
Ooh-ooh (Give you up)
Ooh-ooh
Never gonna give, never gonna give (Give you up)
Ooh-ooh
Never gonna give, never gonna give (Give you up)
[Bridge]
We've known each other for so long
Your heart's been aching, but you're too shy to say it
Inside, we both know what's been going on
We know the game, and we're gonna play it

[Pre-Chorus]
I just wanna tell you how I'm feeling
Gotta make you understand

[Chorus]
Never gonna give you up
Never gonna let you down
Never gonna run around and desert you
Never gonna make you cry
Never gonna say goodbye
Never gonna tell a lie and hurt you
Never gonna give you up
Never gonna let you down
Never gonna run around and desert you
Never gonna make you cry
Never gonna say goodbye
Never gonna tell a lie and hurt you
Never gonna give you up
Never gonna let you down
Never gonna run around and desert you
Never gonna make you cry
Never gonna say goodbye
Never gonna tell a lie and hurt you
            `,
            [addr1.address, addr2.address, addr3.address],
            [10,20,70],
        )
        const song5Receipt = await song5Tx.wait()

        // Gas used by 1 tx
        const { gasUsed: song1Gas } = song1Receipt
        const { usd: song1Usd, matic: song1Matic } = calculateTxCost(song1Gas)
        console.log('Gas used for song with 25 symbols metadata and 2 stakeholders:', song1Gas.toString())
        console.log(`Tx cost: ${song1Matic.toFixed(4)} MATIC or $${song1Usd.toFixed(2)}`)

        // Gas used by 2 tx
        const { gasUsed: song2Gas } = song2Receipt
        const { usd: song2Usd, matic: song2Matic } = calculateTxCost(song2Gas)
        console.log('Gas used for song with 200 symbols metadata and 2 stakeholders:', song2Gas.toString())
        console.log(`Tx cost: ${song2Matic.toFixed(4)} MATIC or $${song2Usd.toFixed(2)}`)

        // Gas used by 3 tx
        const { gasUsed: song3Gas } = song3Receipt
        const { usd: song3Usd, matic: song3Matic } = calculateTxCost(song3Gas)
        console.log('Gas used for song with 25 symbols metadata and 10 stakeholders:', song3Gas.toString())
        console.log(`Tx cost: ${song3Matic.toFixed(4)} MATIC or $${song3Usd.toFixed(2)}`)

        // Gas used by 4 tx
        const { gasUsed: song4Gas } = song4Receipt
        const { usd: song4Usd, matic: song4Matic } = calculateTxCost(song4Gas)
        console.log('Gas used for song with 200 symbols metadata and 10 stakeholders:', song4Gas.toString())
        console.log(`Tx cost: ${song4Matic.toFixed(4)} MATIC or $${song4Usd.toFixed(2)}`)

        // Gas used by 5 tx
        const { gasUsed: song5Gas } = song5Receipt
        const { usd: song5Usd, matic: song5Matic } = calculateTxCost(song5Gas)
        console.log('Gas used for song with lyrics in metadata and 3 stakeholders:', song5Gas.toString())
        console.log(`Tx cost: ${song5Matic.toFixed(4)} MATIC or $${song5Usd.toFixed(2)}`)

        expect(song1Gas).to.be.lte(song2Gas)
        expect(song1Gas).to.be.lte(song3Gas)
        expect(song1Gas).to.be.lte(song4Gas)
        expect(song4Gas).to.be.gte(song3Gas)
        expect(song4Gas).to.be.gte(song2Gas)
    })


})