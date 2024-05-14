const { ethers } = require('hardhat')
const { expect } = require('chai')

const { calculateTxCost, get700Songs } = require('./utils');

describe('Comparison of gas consumptions', function () {
    let MusicRoyalties, musicRoyalties, owner, addr1, addr2, addr3
    let TestToken, testMATIC, amount, songList, gasSum


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

        songList = await get700Songs();
        gasSum = 0;
    })

    describe('Registering 700 songs', () => {
        it('With song and artist name', async () => {
            for (let i = 0; i < songList.length; i++) {
                const { name, artist } = songList[i]

                const songTx = await musicRoyalties.connect(owner).registerSong(
                    i + 1,
                    name,
                    artist,
                    [addr1.address],
                    [100],
                )

                const songReceipt = await songTx.wait()
                const { gasUsed } = songReceipt

                gasSum += gasUsed.toNumber();
            }

            const { usd, matic } = calculateTxCost(gasSum)
            console.log('Gas used for registering 700 songs with song and artist name:', gasSum.toString())
            console.log(`Tx cost: ${matic.toFixed(4)} MATIC or $${usd.toFixed(2)}`)

            expect(true).to.equal(true)
        }).timeout(60000)

        it('With song and artist name and lyrics', async () => {
            for (let i = 0; i < songList.length; i++) {
                const { name, artist, lyrics } = songList[i]

                const songTx = await musicRoyalties.connect(owner).registerSong(
                    i + 1,
                    name,
                    `${artist}${lyrics}`,
                    [addr1.address],
                    [100],
                )

                const songReceipt = await songTx.wait()
                const { gasUsed } = songReceipt

                gasSum += gasUsed.toNumber();
            }

            const { usd, matic } = calculateTxCost(gasSum)
            console.log('Gas used for registering 700 songs with song and artist name and lyrics:', gasSum.toString())
            console.log(`Tx cost: ${matic.toFixed(4)} MATIC or $${usd.toFixed(2)}`)

            expect(true).to.equal(true)
        }).timeout(60000)

        it('With sha256 hash', async () => {
            for (let i = 0; i < songList.length; i++) {
                const { name, artist, lyrics } = songList[i];
                const data = `${name}${artist}${lyrics}`;
                const hash = ethers.utils.sha256(ethers.utils.toUtf8Bytes(data));

                const songTx = await musicRoyalties.connect(owner).registerSong(
                    i + 1,
                    hash,
                    '',
                    [addr1.address],
                    [100],
                );

                const songReceipt = await songTx.wait()
                const { gasUsed } = songReceipt

                gasSum += gasUsed.toNumber();
            }

            const { usd, matic } = calculateTxCost(gasSum)
            console.log('Gas used for registering 700 songs with sha256 hash:', gasSum.toString())
            console.log(`Tx cost: ${matic.toFixed(4)} MATIC or $${usd.toFixed(2)}`)

            expect(true).to.equal(true)
        }).timeout(60000)

        it('With 1/2 of sha256 hash', async () => {
            for (let i = 0; i < songList.length; i++) {
                const { name, artist, lyrics } = songList[i];
                const data = `${name}${artist}${lyrics}`;
                const hash = ethers.utils.sha256(ethers.utils.toUtf8Bytes(data));
                const half_hash = hash.slice(0, hash.length / 2)

                const songTx = await musicRoyalties.connect(owner).registerSong(
                    i + 1,
                    half_hash,
                    '',
                    [addr1.address],
                    [100],
                );

                const songReceipt = await songTx.wait()
                const { gasUsed } = songReceipt

                gasSum += gasUsed.toNumber();
            }

            const { usd, matic } = calculateTxCost(gasSum)
            console.log('Gas used for registering 700 songs with sha256 hash:', gasSum.toString())
            console.log(`Tx cost: ${matic.toFixed(4)} MATIC or $${usd.toFixed(2)}`)

            expect(true).to.equal(true)
        }).timeout(60000)

        it('With 1/4 of sha256 hash', async () => {
            for (let i = 0; i < songList.length; i++) {
                const { name, artist, lyrics } = songList[i];
                const data = `${name}${artist}${lyrics}`;
                const hash = ethers.utils.sha256(ethers.utils.toUtf8Bytes(data));
                const quarter_hash = hash.slice(0, hash.length / 4)

                const songTx = await musicRoyalties.connect(owner).registerSong(
                    i + 1,
                    quarter_hash,
                    '',
                    [addr1.address],
                    [100],
                );

                const songReceipt = await songTx.wait()
                const { gasUsed } = songReceipt

                gasSum += gasUsed.toNumber();
            }

            const { usd, matic } = calculateTxCost(gasSum)
            console.log('Gas used for registering 700 songs with sha256 hash:', gasSum.toString())
            console.log(`Tx cost: ${matic.toFixed(4)} MATIC or $${usd.toFixed(2)}`)

            expect(true).to.equal(true)
        }).timeout(60000)
    })
})