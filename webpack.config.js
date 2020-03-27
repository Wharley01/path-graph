const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  mode:"development",
  entry: './src/test.js',
  devtool: 'inline-source-map',
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      title: 'Development'
    })
  ],
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
   resolve: {
       extensions: ['*', '.js', '.jsx'],
       alias: {
           "PathRoot": path.resolve(__dirname, './path/')
       }
    }
};
