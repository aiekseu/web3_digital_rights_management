const { expect } = require('chai')
const { ethers } = require('hardhat')

const { calculateTxCost } = require('./utils');

describe('Proper work of MusicRoyalties Smart Contract', function () {
    let MusicRoyalties, musicRoyalties, owner, addr1, addr2, addr3
    let TestToken, testMATIC, amount

    beforeEach(async function () {
        TestToken = await ethers.getContractFactory('TestMATIC')
        testMATIC = await TestToken.deploy()
        await testMATIC.deployed()

        MusicRoyalties = await ethers.getContractFactory('MusicRoyaltiesTest');
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

        // Mock the play count
        const playCount = 1000
        await musicRoyalties.connect(owner).setSongPlayCountTest(1, playCount)

        // Calculate royalties
        const playPrice = 1 // 1 token for 1 play
        const royaltyAmounts = await musicRoyalties.calculateRoyaltiesTest(1, playPrice)

        // Estimate gas consumption
        const gasEstimate = await musicRoyalties.estimateGas.calculateRoyaltiesTest(1, playPrice)
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

        // Mock the play count
        const playCount = 1000
        await musicRoyalties.connect(owner).setSongPlayCountTest(1, playCount)

        // Distribute royalties for 1000 plays
        const playPrice = 1 // 1 token for 1 play
        const tx = await musicRoyalties.connect(owner).distributeRoyalties(1, playPrice, testMATIC.address)
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

    it('Distributes royalties in batch correctly', async function () {
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
        const totalAmount = ethers.utils.parseEther('2000')
        await testMATIC.connect(owner).approve(musicRoyalties.address, totalAmount)

        // Mock the play count
        const playCount = 1000
        await musicRoyalties.connect(owner).setSongPlayCountTest(1, playCount)
        await musicRoyalties.connect(owner).setSongPlayCountTest(2, playCount)

        // Call the distributeRoyaltiesBatch function
        const ids = [1, 2]
        const playPrices = [1, 1] // 1 token for 1 play
        const tx = await musicRoyalties
            .connect(owner)
            .distributeRoyaltiesBatch(ids, playPrices, testMATIC.address)

        // Check the gas used
        const receipt = await tx.wait()
        const { gasUsed } = receipt
        const { usd, matic } = calculateTxCost(gasUsed)
        console.log('Gas used for distributing royalties in batch:', gasUsed.toString())
        console.log(`Tx cost: ${matic.toFixed(4)} MATIC or $${usd.toFixed(2)}`)

        // Check if royalties were distributed correctly
        const addr1Balance = await testMATIC.balanceOf(addr1.address)
        const addr2Balance = await testMATIC.balanceOf(addr2.address)
        const addr3Balance = await testMATIC.balanceOf(addr3.address)

        expect(addr1Balance).to.equal('800')
        expect(addr2Balance).to.equal('900')
        expect(addr3Balance).to.equal('300')
    })

    it('Creates a license correctly', async function () {
        // Register a song
        await musicRoyalties.connect(owner).registerSong(
            1,
            'Song 1',
            'Artist 1',
            [addr1.address, addr2.address, addr3.address],
            [40, 30, 30],
        )

        // Create a license
        const licenseId = 1
        const songId = 1
        const price = ethers.utils.parseEther('1000')
        const duration = 3600 // 1 hour
        const createLicenseTx = await musicRoyalties.connect(owner).createLicense(licenseId, songId, price, duration)
        const receipt = await createLicenseTx.wait()

        // Measure gas usage
        const { gasUsed } = receipt
        const { usd, matic } = calculateTxCost(gasUsed)
        console.log('Gas used for creating a license:', gasUsed.toString())
        console.log(`Tx cost: ${matic.toFixed(4)} MATIC or $${usd.toFixed(2)}`)

        // Check if the license was created correctly
        const license = await musicRoyalties.licenses(licenseId)
        expect(license.id).to.equal(licenseId)
        expect(license.songId).to.equal(songId)
        expect(license.price).to.equal(price)
        expect(license.duration).to.equal(duration)
    })

    it('Purchases a license correctly', async function () {
        // Register a song
        await musicRoyalties.connect(owner).registerSong(
            1,
            'Song 1',
            'Artist 1',
            [addr1.address, addr2.address, addr3.address],
            [40, 30, 30],
        )

        // Create a license
        const licenseId = 1
        const songId = 1
        const price = ethers.utils.parseEther('1000')
        const duration = 3600 // 1 hour
        await musicRoyalties.connect(owner).createLicense(licenseId, songId, price, duration)

        // Mint some tokens for addr1
        await testMATIC.connect(owner).mint(addr1.address, price)

        // Approve the transfer of test MATIC tokens from addr1 to the contract
        await testMATIC.connect(addr1).approve(musicRoyalties.address, price)

        // Purchase the license
        const purchaseLicenseTx = await musicRoyalties.connect(addr1).purchaseLicense(licenseId, testMATIC.address)
        const receipt = await purchaseLicenseTx.wait()

        // Measure gas usage
        const { gasUsed } = receipt
        const { usd, matic } = calculateTxCost(gasUsed)
        console.log('Gas used for purchasing a license:', gasUsed.toString())
        console.log(`Tx cost: ${matic.toFixed(4)} MATIC or $${usd.toFixed(2)}`)

        // Check if the license revenue was distributed correctly
        const addr1Balance = await testMATIC.balanceOf(addr1.address)
        const addr2Balance = await testMATIC.balanceOf(addr2.address)
        const addr3Balance = await testMATIC.balanceOf(addr3.address)

        expect(addr1Balance).to.equal(ethers.utils.parseEther('400'))
        expect(addr2Balance).to.equal(ethers.utils.parseEther('300'))
        expect(addr3Balance).to.equal(ethers.utils.parseEther('300'))
    })
})