var webpack = require('webpack'),
    path = require('path');

module.exports = {
    entry: {
        main: [
          './src/index.js',
        ]
    },
    output: {
        libraryTarget: 'var',
        library: 'repulse',
        path: path.join(__dirname, '/dist/'),
        filename: 'repulse.js'
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
