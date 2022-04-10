/**
 * 获取向量模长
 * @param vector 向量
 * @returns
 */
export function getVectorModulesLength(vector: number[]): number {
  return Math.sqrt(vector.reduce((prev, cur) => prev + cur ** 2, 0));
}

/**
 * 获取向量数量积
 * @param vector1 向量1
 * @param vector2 向量2
 * @returns
 */
export function getQuantityProduct(
  vector1: number[],
  vector2: number[]
): number {
  if (vector1.length !== vector2.length) {
    throw new Error(
      `vector1 and vector2 must have the same length, but the vector1's length ${vector1.length} and vector2 is ${vector2.length}`
    );
  }
  let sum = 0;
  for (let i = 0; i < vector1.length; i++) {
    sum += vector1[i] * vector2[i]; // TODO 改进协同过滤算法
  }
  return sum;
}

/**
 * 计算相似度
 * @param curUserIndex 当前用户索引,如果只有`userId`,可通过映射表获取索引
 * @param data 用户-评价矩阵, 行是用户, 列是电影评分
 * @returns 返回相似度列表
 */
export function getSimilarWithOtherUser(curUserIndex = 0, data: number[][]) {
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

/**
 * 计算物品i与其他物品的相似度
 */
export function getSimilarWithOtherItem(curMovieIndex: number, data: number[][], matrix: number[][]) {
  let curItemUserCount = 0;
  // 计算喜欢当前电影的有多少个用户
  for (const user of data) {
    if (user[curMovieIndex] !== 0) {
      curItemUserCount++;
    }
  }
  const result: number[] = [];
  // 计算相似度有两种方案
  // TODO 1.针对每部电影, 每次都要计算, 单次计算的时间说得过去, 计算多部电影时耗时
  // TODO 2.系统启动时构建一个同现矩阵, 针对每部电影直接从矩阵里获取数量, 时间快, 但是耗费空间, 矩阵有180M
  // const rowLen = data.length;
  // const columnLen = data[0].length;
  // // 计算同时喜欢物品 v 和 u 的用户数量
  // for (let i = 0; i < columnLen; i++) {
  //   let count = 0;
  //   if (i === curMovieIndex) {
  //     result.push(1);
  //     continue;
  //   }
  //   for (let j = 0; j < rowLen; j++) {
  //     const user = data[j];
  //     if (user[curMovieIndex] !== 0 && user[i] !== 0) {
  //       count++;
  //     }
  //   }
  //   result.push(count / curItemUserCount);
  // }
  // return result;

  // 方案2 不用计算, 直接从矩阵里获取
  for (let i = 0; i < matrix.length; i++) {
    result.push( i === curMovieIndex ? 1 : matrix[curMovieIndex][i] / curItemUserCount)
  }
  return result;
}
