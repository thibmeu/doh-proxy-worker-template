module.exports = {
    target: 'webworker',
    entry: './src/index.js',
    mode: 'production',
    optimization: {
        minimize: false,
    }
}