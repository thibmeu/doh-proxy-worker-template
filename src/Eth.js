export const Eth = (url) => {
    const ethers = require('ethers')
    return new ethers.providers.CloudflareProvider({ name: 'homestead', chainId: 1, ensAddress: '0x314159265dd8dbb310642f98f50c066173c1259b' })
}