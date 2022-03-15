const { resolve } = require('path');
const json = require('./package.json');
const { DefinePlugin } = require('webpack');
const PATH = require('./path.config');
// 告知 webpack 在打包过程中，以下声明的模块不用处理
const nodeModules = {};
// const nodeModules = Object.fromEntries(Object.keys(json).map(item => [item, item]))
module.exports = (env) => {
  return {
    entry: {
      main: './src/main.ts',
      fetchPicture: './src/fetchPicture.ts'
    },
    output: {
      filename: '[name].js',
      path: resolve(__dirname, 'dist'),
      clean: true,
    },
    target: 'node',
    mode: env.PRODUCTION ? 'production' : 'development',
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        data: resolve(__dirname, 'dataset'),
      },
      extensions: ['.js', '.ts', '...'],
      preferRelative: true,
    },
    module: {
      rules: [
        {
          test: /\.ts$/i,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        },
      ],
    },
    plugins: [
      new DefinePlugin({
        PATH: JSON.stringify(PATH),
      }),
    ],
    externals: nodeModules,
  };
};
