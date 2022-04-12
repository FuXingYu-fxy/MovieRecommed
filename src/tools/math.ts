type Matrix = number[][];
type Vector = number[];
/**
 * 获取向量模长
 * @param vector 向量
 * @returns
 */
export function getVectorModulesLength(vector: Vector): number {
  return Math.sqrt(vector.reduce((prev, cur) => prev + cur ** 2, 0));
}

/**
 * 获取向量数量积
 * @param vector1 向量1
 * @param vector2 向量2
 * @returns
 */
export function getQuantityProduct(
  vector1: Vector,
  vector2: Vector
): number {
  if (vector1.length !== vector2.length) {
    throw new Error(
      `vector1 and vector2 must have the same length, but the vector1's length ${vector1.length} and vector2 is ${vector2.length}`
    );
  }
  let sum = 0;
  for (let i = 0; i < vector1.length; i++) {
    sum += vector1[i] * vector2[i]; // TODO 改进的协同过滤算法
  }
  return sum;
}

/**
 * 计算相似度
 * @param curUserIndex 当前用户索引,如果只有`userId`,可通过映射表获取索引
 * @param userRatingMatrix 用户-评价矩阵, 行是用户, 列是电影评分
 * @returns 返回相似度列表
 */
export function getSimilarWithOtherUser(curUserIndex = 0, userRatingMatrix: Matrix) {
  let result = [];
  for (let i = 0; i < userRatingMatrix.length; i++) {
    if (i === curUserIndex) {
      result.push(0);
      continue;
    }
    const x = userRatingMatrix[curUserIndex];
    const y = userRatingMatrix[i];
    result.push(
      getQuantityProduct(x, y) /
        (getVectorModulesLength(x) * getVectorModulesLength(y))
    );
  }
  return result;
}

interface SimilarWithOtherItemOptions {
  curMovieIndex: number;
  userWatchedMovieSet: Set<number>;
  userRatingMatrix: Matrix;
  matrix: Matrix;
  similarList?: Vector
}
/**
 * @param {SimilarWithOtherItemOptions} options
 * @property curMovieIndex 当前电影索引
 * @property userWatchedMovieSet 当前用户
 * @property userRatingMatrix 用户-评分矩阵
 * @property matrix 物品同现矩阵
 * @property similarList 相似度数组, 传入该数组用于更新 
 */
export function getSimilarWithOtherItem(options: SimilarWithOtherItemOptions): Vector {
  const {curMovieIndex, userWatchedMovieSet, userRatingMatrix, matrix, similarList } = options;
  let curItemUserCount = 0;
  // 计算喜欢当前电影的有多少个用户
  for (const user of userRatingMatrix) {
    if (user[curMovieIndex] !== 0) {
      curItemUserCount++;
    }
  }
  const result: Vector = [];
  // 计算相似度有两种方案
  // TODO 1.针对每部电影, 每次都要计算, 单次计算的时间说得过去, 计算多部电影时耗时
  // TODO 2.系统启动时构建一个同现矩阵, 针对每部电影直接从矩阵里获取数量, 时间快, 但是耗费空间, 矩阵有180M
  // const rowLen = userRatingMatrix.length;
  // const columnLen = userRatingMatrix[0].length;
  // // 计算同时喜欢物品 v 和 u 的用户数量
  // for (let i = 0; i < columnLen; i++) {
  //   let count = 0;
  //   if (i === curMovieIndex) {
  //     result.push(0);
  //     continue;
  //   }
  //   for (let j = 0; j < rowLen; j++) {
  //     const user = userRatingMatrix[j];
  //     if (user[curMovieIndex] !== 0 && user[i] !== 0) {
  //       count++;
  //     }
  //   }
  //   result.push(count / curItemUserCount);
  // }
  // return result;

  // 方案2 不用计算, 直接从矩阵里获取
  for (let i = 0; i < matrix.length; i++) {
    if (userWatchedMovieSet.has(i)) {
      result.push(0);
      continue;
    }
    const score: number =  matrix[curMovieIndex][i] / curItemUserCount
    // 合并相似度数组, 每次取最大值
    if (similarList) {
      result.push( similarList[i] > score ? similarList[i] : score);
    } else {
      result.push(score)
    }
  }
  return result;
}
