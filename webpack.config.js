const {resolve} = require('path');
const { DefinePlugin } = require('webpack');
const PATH = require('./path.config');
// 告知 webpack 在打包过程中，以下声明的模块不用处理
const nodeModules = {
  // axios: 'axios',
  // cheerio: 'cheerio',
  // csvtojson: 'csvtojson',
  // chalk: 'chalk'
};
module.exports = {
  entry: './src/main.ts',
  output: {
    filename: '[name].js',
    path: resolve(__dirname, 'dist'),
    clean: true,
  },
  target: 'node',
  mode: process.env.PRODUCTION ? 'production' : 'development',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'data': resolve(__dirname, 'dataset')
    },
    extensions: ['.js', '.ts', '...'],
    preferRelative: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/i,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          },
        }
      }
    ]
  },
  plugins: [
    new DefinePlugin({
      PATH: JSON.stringify(PATH)
    })
  ],
  externals: nodeModules
}