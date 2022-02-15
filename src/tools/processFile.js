const fs = require('fs');
const path = require('path');
const csv = require('csvtojson');
const log = require('./log');
const convert = (pathname) =>
  csv()
    .fromFile(pathname)
    .then((json) => {
      // fs.writeFile(pathname.replace(/csv/g, 'json'), JSON.stringify(json), err => {
      //   if (err) {
      //     console.warn('转换失败')
      //   }
      // })
      return json;
    });

const mergeResult = (dirname, processedFilename) => {
  const result = [];
  fs.readdir(dirname, (err, files) => {
    if (err) {
      log.danger(err.message);
      log.info('读取文件夹时出现了错误');
      return;
    }
    if (files.includes(processedFilename)) {
      log.danger(
        '该目录下存在与第二个参数相同的文件, 似乎合并已完成. 如果想继续, 请重新制定文件名'
      );
      return;
    }
    log.info('合并中...')
    let counter = 0;
    for (let i = 0; i < files.length; i++) {
      fs.readFile(path.join(dirname, files[i]), (err, data) => {
        if (err) {
          log.danger(err);
          log.info(`打开文件${files[i]}时出现了错误`);
          return;
        }
        const arr = JSON.parse(data).filter((v) => !!v);
        result.push(...arr);
        counter++;
        if (counter === files.length) {
          // 只有当全部处理完成时才合并
          fs.writeFile(path.join(dirname, processedFilename), JSON.stringify(result), (err) => {
            if (err) {
              log.danger(err.message);
              log.info('合并文件时出现错误');
              return;
            }
            log.success('合并完成');
          });
        }
      });
    }
  });
};

module.exports = {
  convert,
  mergeResult
};
