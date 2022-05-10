type Matrix = number[][];
type Vector = number[];
type Tuple = [number, number] | null;
type UserMatrix = Tuple[][];
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
export function getSimilarWithOtherUser(
  curUserIndex = 0,
  userRatingMatrix: UserMatrix
) {
  let result = [];
  for (let i = 0; i < userRatingMatrix.length; i++) {
    if (i === curUserIndex) {
      result.push(0);
      continue;
    }
    const x = userRatingMatrix[curUserIndex].map((item) => {
      if (item instanceof Array) {
        return item[0] * 0.7 + item[1] * 0.3;
      } else {
        return 0;
      }
    });
    const y = userRatingMatrix[i].map((item) => {
      if (item instanceof Array) {
        return item[0] * 0.7 + item[1] * 0.3;
      } else {
        return 0;
      }
    });
    result.push(
      getQuantityProduct(x, y) /
        (getVectorModulesLength(x) * getVectorModulesLength(y))
    );
  }
  return result;
}

/**
 * 生成候选推荐列表
 * @param itemSimilarMatrix 物品相似度矩阵
 * @param watchedMovieList 用户已观看过的电影
 * @param existMovie 用户已观看过的电影, 集合
 * @returns
 */
export function getCandidateRecommendItemList(
  itemSimilarMatrix: Matrix,
  watchedMovieList: number[],
  existMovie: Set<number>
) {
  const result = new Set<number>();
  // 排除用户已看过的电影
  for (let i = 0; i < watchedMovieList.length; i++) {
    const movie = watchedMovieList[i];
    for (let j = 0; j < itemSimilarMatrix[movie].length; j++) {
      if (existMovie.has(j)) {
        continue;
      }
      if (itemSimilarMatrix[movie][j] > 0) {
        result.add(j);
      }
    }
  }
  return Array.from(result);
}
