const path = require('path');

module.exports = {
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
  entry: {
    index: './front_end/root.js'
  },
  output: {
    filename: 'webpack_root.js',
    chunkFilename: '[name].bundle.js',
    path: path.resolve(__dirname, 'bundle'),
  }
};
