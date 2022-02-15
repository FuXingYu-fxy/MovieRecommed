const path = require('path');
const { mergeResult } = require('./tools/processFile.js');

(() => {
  mergeResult(path.resolve(__dirname, './dataset/result'), 'result.json');
})();
