const path = require('path');
const webpack = require('webpack');

const config = {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: path.resolve('./replace-loader.js'),
          }
        ]
      }
    ]
  },
  plugins: [],
  entry: {
    index: './front_end/root.js'
  },
  output: {
    filename: 'webpack_root.js',
    chunkFilename: '[name].bundle.js',
    path: path.resolve(__dirname, 'bundle'),
  }
};

if (process.env.CODE_SPLITTING === 'no') {
  config.plugins.push(
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    })
  );
  config.output.filename = 'webpack_nosplit.js'
}

module.exports = config;
