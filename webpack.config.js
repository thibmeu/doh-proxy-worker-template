module.exports = {
  target: 'webworker',
  entry: './src/index.ts',
  devtool: 'source-map',
  mode: 'production',
  optimization: {
    minimize: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    plugins: [],
  },
  module: {
    rules: [
      {
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
