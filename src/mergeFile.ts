import path from 'path';
import { mergeResult } from './tools/processFile';

(() => {
  mergeResult(path.resolve(__dirname, './dataset/result'), 'result.json');
})();
