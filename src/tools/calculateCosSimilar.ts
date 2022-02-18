import { compose, DEBUG } from "./functionStyleProgrammingTools";

export function getVectorModulesLength(vector: number[]): number {
  return Math.sqrt(vector.reduce((prev, cur) => prev + cur ** 2, 0));
}

export function getQuantityProduct(vector1: number[], vector2: number[]): number {
  if (vector1.length !== vector2.length) {
    throw new Error(`vector1 and vector2 must have the same length, but the vector1's length ${vector1.length} and vector2 is ${vector2.length}`);
  }
  let sum = 0;
  for (let i = 0; i < vector1.length; i++) {
    sum += vector1[i] * vector2[i];
  }
  return sum;
}

export function getCosSimilarWithOther(curUserIndex = 0, data: number[][]) {
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