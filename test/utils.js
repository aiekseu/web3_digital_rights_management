const fs = require('fs')
const { parse } = require('csv-parse')

const GAS_PRICE = 200 // Gwei
const MATIC_PRICE_IN_USD = 0.9 // USD

const calculateTxCost = (gasUsed) => {
    const priceInMatic = gasUsed * GAS_PRICE / 1000000000
    const priceInUSD = priceInMatic * MATIC_PRICE_IN_USD

    return {
        matic: priceInMatic,
        usd: priceInUSD,
    }
}

// Function to parse the CSV
function get700Songs() {
    const filePath = './test/top_songs_1950_2019.csv'

    return new Promise((resolve, reject) => {
        const results = []

        // Create a parser
        const parser = parse({
            columns: true,
            trim: true,
            skip_empty_lines: true,
        })

        // Read the CSV file
        fs.createReadStream(filePath)
            .pipe(parser)
            .on('data', row => {
                results.push({ name: row.song, artist: row.artist, lyrics: row.lyrics })
            })
            .on('end', () => {
                resolve(results)
            })
            .on('error', error => {
                reject(error)
            })
    })
}

module.exports = { calculateTxCost, get700Songs }