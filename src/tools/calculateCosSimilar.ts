import { compose, DEBUG } from "./functionStyleProgrammingTools";
/**
 * 示例说明
 * 假设有如下数据
 * 使用包含了用户喜好项的向量（或数组）代表每一个用户
 */
const data = [
  [4, 3, 0, 0, 5, 0],
  [5, 0, 4, 0, 4, 0],
  [4, 0, 5, 3, 4, 0],
  [0, 3, 0, 0, 0, 5],
  [0, 4, 0, 0, 0, 5],
  [0, 0, 2, 4, 0, 5],
];

const userMap = ['用户1', '用户2', '用户3', '用户4', '用户5', '用户6'];

function getVectorModulesLength(vector: number[]): number {
  return Math.sqrt(vector.reduce((prev, cur) => prev + cur ** 2, 0));
}

function getQuantityProduct(vector1: number[], vector2: number[]): number {
  if (vector1.length !== vector2.length) {
    throw new Error(`vector1 and vector2 must have the same length, but the vector1's length ${vector1.length} and vector2 is ${vector2.length}`);
  }
  let sum = 0;
  for (let i = 0; i < vector1.length; i++) {
    sum += vector1[i] * vector2[i];
  }
  return sum;
}

function getCosSimilar(curUserIndex = 0) {
let result = [];
  for (let i = 0; i < data.length; i++) {
    if (i === curUserIndex) {
      result.push(1);
      continue;
    }
    const x = data[curUserIndex];
    const y = data[i];
    result.push(
      getQuantityProduct(x, y) /
        (getVectorModulesLength(x) * getVectorModulesLength(y))
    );
  }
  return result;
}
  

getCosSimilar(0);

compose(DEBUG, getCosSimilar)(0);