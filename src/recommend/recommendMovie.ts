import fs from 'fs';
import log from '@/tools/log';
import { convert } from '@/tools/processFile';
import { readRecordFile } from '@/fetchMovie';
import { getSimilarWithOtherUser, getSimilarWithOtherItem } from '@/tools/math';
import { intersection, compact } from 'lodash';
import heapSort from '@/tools/sortByHeap';
import type {Item} from '@/tools/sortByHeap';
// 计算用户 u 对电影 i 的兴趣度
// 计算步骤:
// 1. 在相似度中取前50个, 作为矩阵v(50 * 1型)
// 2. 计算出对电影打过分的用户和相似度前50 的交集 v
// 3. 相似度uv * 评分 vi
interface MovieRating {
  userId: number;
  movieId: number;
  rating: number;
}
interface MergedMovieRating {
  [index: number]: [
    {
      movieId: number;
      rating: number;
    }
  ];
}

interface IdMap {
  [index: string]: number;
}
type Matrix = number[][];

/**
 * 获取与其最相似的前`K`个集合
 * @param similar 相似度列表
 * @param K 数量
 * @returns 降序排列的前`K`个用户的索引
 */
function getSimilarTopNIndex(similar: number[], K: number) {
  const similarTransfer = similar.map((value, index) => {
    return {
      value,
      index
    }
  })
  let similarDescSorted = heapSort(similarTransfer, K + 1);
  // 去掉最相似的一个, 因为那个就是自己
  similarDescSorted.shift()
  return similarDescSorted.map(item => item.index);
}

/**
 * 获取当前用户观看过的电影
 * @param matrix 用户-评分矩阵
 * @param userIndex 当前用户索引
 * @returns
 */
function getCurUserUnwatchMovies(matrix: Matrix, userIndex: number) {
  return matrix[userIndex]
    .map((item, index) => (item === 0 ? index : -1))
    .filter((item) => item !== -1);
}
/**
 * 获取对电影`i`打过分的用户集合
 * @param matrix 用户-评分矩阵
 * @param i 当前电影索引
 * @param curUserIndex 当前用户
 */
function getUserWithRatedMovie(
  matrix: Matrix,
  i: number,
  curUserIndex: number = -1
) {
  const result: number[] = [];
  for (let userIndex = 0; userIndex < matrix.length; userIndex++) {
    if (userIndex === curUserIndex) continue;
    let userRatedMovies = matrix[userIndex];
    // 打过分的就不可能为0
    if (userRatedMovies[i] !== 0) {
      result.push(userIndex);
    }
  }
  return result;
}

async function generateRateMatrix({
  originFilepath,
  savedFilepath,
  userId2IndexMapFilepath,
  movieId2IndexMapFilepath,
}: Result) {
  const hasRecordFile = fs.existsSync(savedFilepath);
  if (!hasRecordFile) {
    const json = await convert<MovieRating>(originFilepath);
    const userMovieRecord: MergedMovieRating = {};
    const movieIdSet = new Set<number>();
    for (let i = 0; i < json.length; i++) {
      const { userId, movieId, rating } = json[i];
      if (userId in userMovieRecord) {
        userMovieRecord[userId].push({ movieId, rating });
      } else {
        userMovieRecord[userId] = [{ movieId, rating }];
      }

      movieIdSet.add(movieId);
    }
    const userIds = Object.keys(userMovieRecord);
    // 这时 movieIds 还是乱序的
    const movieIds = Array.from(movieIdSet);

    // 构造映射表, 将对应的id 映射为 index
    const userId2IndexMap: IdMap = Object.fromEntries(
      userIds.map((userId, index) => [userId, index])
    );
    // movie 较多, 可能会比较耗时
    const movieId2IndexMap: IdMap = Object.fromEntries(
      movieIds.sort((a, b) => a - b).map((movieId, index) => [movieId, index])
    );

    const userRatingMatrix: Matrix = Array(userIds.length).fill(undefined);
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const userIndex = userId2IndexMap[userId];
      // 为每一个用户填充矩阵, 注意该矩阵是一个稀疏矩阵
      userRatingMatrix[userIndex] = Array(movieIds.length).fill(0);
      const curUserRecord = userMovieRecord[Number(userId)];
      for (let j = 0; j < curUserRecord.length; j++) {
        const { movieId, rating } = curUserRecord[j];
        const movieIndex = movieId2IndexMap[movieId];
        userRatingMatrix[userIndex][movieIndex] = rating;
      }
    }
    // 保存评分矩阵 与 映射表
    fs.writeFile(
      savedFilepath,
      JSON.stringify(userRatingMatrix),
      () => log.success('===评分矩阵保存成功===')
    );
    fs.writeFile(
      movieId2IndexMapFilepath,
      JSON.stringify(movieId2IndexMap),
      () => log.success('===电影id映射表保存成功===')
    );
    fs.writeFile(
      userId2IndexMapFilepath,
      JSON.stringify(userId2IndexMap),
      () => log.success('===用户id映射表保存成功===')
    );
    return {
      userRatingMatrix,
      movieId2IndexMap,
      userId2IndexMap,
      // userMovieRecord,
    };
  } else {
    log.info('===正在读取文件===');
    const matrix = await readRecordFile<Matrix>(savedFilepath);
    log.success('=== matrix 读取成功===');
    const movieId2IndexMap = await readRecordFile<IdMap>(
      movieId2IndexMapFilepath
    );
    log.success('=== movieId map 读取成功===');
    const userId2IndexMap = await readRecordFile<IdMap>(
      userId2IndexMapFilepath
    );
    log.success('=== userId map 读取成功===');
    return {
      userRatingMatrix: matrix,
      movieId2IndexMap,
      userId2IndexMap,
    };
  }
}


export async function recommendByUser(userId: string, N: number = 20) {
  if (!userId) {
    return [];
  }
  const K = 50;
  try {
    const curUserIndex = userId2IndexMap[userId];
    const cosSimilar = getSimilarWithOtherUser(curUserIndex, userRatingMatrix);
    // 计算出当前用户未观看过哪些电影, 索引
    const curUserWatchedMovieList = getCurUserUnwatchMovies(
      userRatingMatrix,
      curUserIndex
    );
    // 前 K 个最相似的用户索引
    const TopNUserList = getSimilarTopNIndex(cosSimilar, K);
    // 计算兴趣度
    const interestScoreList: Item[] = curUserWatchedMovieList.map((curMovieIndex) => {
      const ratedUserList = getUserWithRatedMovie(
        userRatingMatrix,
        curMovieIndex,
        curUserIndex
      );
      // 获得交集 V
      const userIntersection = intersection(TopNUserList, ratedUserList);
      // 计算用户u对交集V中用户所看过的电影的兴趣度
      const score = compact(userIntersection).reduce((prev, cur) => {
        // TODO 如果评分为0, 乘上1会不会好点？
        return prev + cosSimilar[cur] * userRatingMatrix[cur][curMovieIndex];
      }, 0);
      return {
        value: score,
        index: curMovieIndex
      }
    });
    return heapSort(interestScoreList, N).map(item => movieIndex2IdMap[item.index]);
  } catch (err) {
    log.danger(err);
    return [];
  }
}

export function recommendByItem(movieId: string, N: number = 20) {
  if (!movieId) {
    return [];
  }
  const K = 50;
  const movieIndex = movieId2IndexMap[movieId]
  if (movieIndex === undefined) {
    // 没有该电影id
    return []
  }
  const similarList = getSimilarWithOtherItem(movieId2IndexMap[movieId], userRatingMatrix, occuranceMatrix)
  // 获取前50部电影索引
  const TopNSimilarList = getSimilarTopNIndex(similarList, K)
  
  return TopNSimilarList
}

/**
 * 构建同现矩阵, 非常耗时 15s, 第一次使用后，保存成文件，后面使用时再读取
 */
export async function generateCoOccuranceMatrix(filePath: string, matrix: Matrix): Promise<Matrix> {
  log.info('正在构建同现矩阵...')
  if (fs.existsSync(filePath)) {
    // 如果存在直接读取返回
    const result = await readRecordFile<Matrix>(filePath)
    log.success('===同现矩阵构建完毕===');
    return result;
  }
  const start = Date.now();
  log.info('未找到同现矩阵, 构建中...');
  const result: Matrix = [];
  const rowLen = matrix.length;
  const columnLen = matrix[0].length;
  // 遍历每个用户
  for (let i = 0; i < rowLen; i++) {
    for (let j = 0; j < columnLen; j++) {
      if (i === 0) {
        // 填充矩阵, 第一个用户遍历完后就能填满
        result.push(Array(columnLen).fill(0));
      }
      if (matrix[i][j] === 0) {
        continue;
      }

      for (let k = 0; k < columnLen; k++) {
        if (j === k) {
          continue;
        }
        if (matrix[i][k] === 0) {
          continue;
        }
        result[j][k] += 1;
      }
    }
  }
  log.success(`同现矩阵构建完毕, 耗时${Date.now() - start} ms`);
  fs.writeFile(filePath, JSON.stringify(result), () => {
    log.success('===同现矩阵保存成功===')
  })
  return result;
}


let userRatingMatrix: Matrix, userId2IndexMap: IdMap, movieId2IndexMap: IdMap;
let movieIndex2IdMap: string[];
let occuranceMatrix: Matrix;
generateRateMatrix(PATH.result).then(async (v) => {
  userRatingMatrix = v.userRatingMatrix;
  userId2IndexMap = v.userId2IndexMap;
  movieId2IndexMap = v.movieId2IndexMap;
  movieIndex2IdMap = Object.keys(movieId2IndexMap);
  occuranceMatrix = await generateCoOccuranceMatrix(PATH.result.coOccuranceMatrix, userRatingMatrix)
});