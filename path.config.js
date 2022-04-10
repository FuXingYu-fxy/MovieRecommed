/**
 * ========== 注意 =============
 * 在此配置项目中读取、保存文件的路径
 * 不要更改对象中的字段
 * ============================
 */
const { join } = require('path');

/**
 * @type {function(): string}
 */
const joinPartial = join.bind(null, __dirname);

const spider = {
  // 爬虫依赖的文件
  datasourcePath: joinPartial('dataset/movies.csv'),
  // 如果爬虫中断后, 中断前的 index 和 segment 将会记录在该文件中
  recordFilename: joinPartial('dataset/record.json'),
  // 爬虫返回 404 时，将当时参数以及错误信息保存到该文件中
  errorPath: joinPartial('dataset/error/exception.json'),
  // 文件夹
  saveFilename: joinPartial('dataset/result/result'),
  // 文件夹
  picture: joinPartial('dataset/picture')
};

const result = {
  userId2IndexMapFilepath: joinPartial('dataset/result/userId2IndexMap.json'),
  movieId2IndexMapFilepath: joinPartial('dataset/result/movieId2IndexMap.json'),
  savedFilepath: joinPartial('dataset/result/matrix.json'),
  originFilepath: joinPartial('dataset/ratings.csv'),
  waitMergeDirPath: joinPartial('dataset/result'),
  coOccuranceMatrix: joinPartial('dataset/result/coOccuranceMatrix.json'),
};

module.exports = {
  spider,
  result,
};
