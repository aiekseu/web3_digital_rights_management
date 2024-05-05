const network = process.env.TEST ? 'test' : 'amoy'

module.exports = require(`./hardhat.${network}.config.js`)