/* eslint-disable @typescript-eslint/no-var-requires */
const testFolder = './lists/'
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')

const BlockList = fs
    .readdirSync(testFolder)
    .map((file) =>
        fs
        .readFileSync(path.join(testFolder, file), { encoding: 'utf8' })
        .split('\r\n')
        .filter((l) => l.length !== 0 && !l.startsWith('#'))
        .map((l) => l.split('#')[0].trim()),
    )
    .flat()

module.exports = {
    target: 'webworker',
    entry: './src/index.ts',
    // devtool: 'source-map',
    mode: 'production',
    optimization: {
        minimize: true,
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        plugins: [],
    },
    plugins: [
        new webpack.EnvironmentPlugin({
            BlockList: JSON.stringify(BlockList),
        })
    ],
    module: {
        rules: [{
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                },
            },
            { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
        ],
    },
}