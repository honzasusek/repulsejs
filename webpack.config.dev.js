var webpack = require('webpack'),
    path = require('path');

module.exports = {
    devtool: "eval",
    devServer: {
      contentBase: './example-app/build/'
    },
    entry: {
        main: [
          './src/index.js',
          './example-app/src/scripts/main.js'
        ]
    },
    output: {
        path: path.join(__dirname, 'example-app/build/scripts/'),
        publicPath: '/scripts/',
        filename: '[name].js'
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: /(node_modules)/,
          loader: 'babel-loader', // 'babel-loader' is also a valid name to reference
          query: {
            presets: ['es2015', 'stage-0']
          }
        }
      ]
    }
};
