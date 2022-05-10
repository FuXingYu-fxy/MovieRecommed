import fs from 'fs';
import log from '@/tools/log';
import { convert } from '@/tools/processFile';
import { readRecordFile } from '@/fetchMovie';
import {
  getSimilarWithOtherUser,
  getCandidateRecommendItemList,
} from '@/tools/math';
import TopN from '@/tools/sortByHeap';
import type { Item } from '@/tools/sortByHeap';
import { query } from '@/db';
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
type Tuple = [number, number] | undefined;
// 现在每个元素是一个元组, 第一个元素是 rating, 第二个元素是 implict_rating
type UserMatrix = Tuple[][];
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
      index,
    };
  });
  let similarDescSorted = TopN(similarTransfer, K);
  return similarDescSorted.map((item) => item.index);
}

/**
 * 获取当前用户`未观看`过的电影
 * @param matrix 用户-评分矩阵
 * @param userIndex 当前用户索引
 * @returns
 */
function getUserUnwatchMovies(matrix: UserMatrix, userIndex: number) {
  return matrix[userIndex]
    .map((item, index) => (item === undefined ? index : -1))
    .filter((item) => item !== -1);
}

/**
 * 获取当前用户`已观看`过的电影
 * @param matrix 用户-评分矩阵
 * @param userIndex 当前用户索引
 * @returns
 */
function getUserWatchMovies(matrix: UserMatrix, userIndex: number) {
  return matrix[userIndex]
    .map((item, index) => (item === undefined ? -1 : index))
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
  return matrix.filter(
    (item, userIndex) => item[i] && curUserIndex !== userIndex
  );
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
        // 隐性评分和显性评分占比为 3 : 7
        userMovieRecord[userId].push({ movieId, rating: rating * 0.7 });
      } else {
        userMovieRecord[userId] = [{ movieId, rating: rating * 0.7 }];
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

    const userRatingMatrix: UserMatrix = Array(userIds.length).fill(undefined);
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const userIndex = userId2IndexMap[userId];
      // 为每一个用户填充矩阵, 注意该矩阵是一个稀疏矩阵
      userRatingMatrix[userIndex] = Array(movieIds.length).fill(undefined);
      const curUserRecord = userMovieRecord[Number(userId)];
      for (let j = 0; j < curUserRecord.length; j++) {
        const { movieId, rating } = curUserRecord[j];
        const movieIndex = movieId2IndexMap[movieId];
        if (rating !== 0) {
          userRatingMatrix[userIndex][movieIndex] = [rating, 0];
        }
      }
    }
    // 保存评分矩阵 与 映射表
    fs.writeFile(savedFilepath, JSON.stringify(userRatingMatrix), () =>
      log.success('===评分矩阵保存成功===')
    );
    fs.writeFile(
      movieId2IndexMapFilepath,
      JSON.stringify(movieId2IndexMap),
      () => log.success('===电影id映射表保存成功===')
    );
    fs.writeFile(userId2IndexMapFilepath, JSON.stringify(userId2IndexMap), () =>
      log.success('===用户id映射表保存成功===')
    );
    return {
      userRatingMatrix,
      movieId2IndexMap,
      userId2IndexMap,
      // userMovieRecord,
    };
  } else {
    log.info('===正在读取文件===');
    const matrix = await readRecordFile<UserMatrix>(savedFilepath);
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

export async function recommendByUser(userId: string, N: number) {
  // TODO 优化, 先构造倒排列表, 然后建立用户相似度矩阵
  const K = 50;
  try {
    const userIndex = userId2IndexMap[userId];
    if (typeof userIndex === 'undefined') {
      throw new Error(`can't find map when userId=${userId}`);
    }
    const cosSimilar = getSimilarWithOtherUser(userIndex, userRatingMatrix);
    // 计算出当前用户未观看过哪些电影, 索引
    const curUserUnWatchedMovieIndexList = getUserUnwatchMovies(
      userRatingMatrix,
      userIndex
    );
    // 前 K 个最相似的用户索引
    const TopNUserList = getSimilarTopNIndex(cosSimilar, K);
    // 计算兴趣度
    const interestScoreList: Item[] = curUserUnWatchedMovieIndexList.map(
      (curMovieIndex) => {
        // 计算用户u对v中用户所看过的电影的兴趣度, 不用再计算交集, 如果没有评分
        // 所在项自然为0, 不影响计算结果
        const score = TopNUserList.reduce((prev, cur) => {
          // 考虑到隐式评分
          const tuple = userRatingMatrix[cur][curMovieIndex];
          if (typeof tuple === 'undefined') {
            return prev;
          } else {
            return prev + cosSimilar[cur] * (tuple[0] * 0.7 + tuple[1] * 0.3);
          }
        }, 0);
        return {
          value: score,
          index: curMovieIndex,
        };
      }
    );
    const ids = TopN(interestScoreList, N).map(
      (item) => movieIndex2IdMap[item.index]
    );
    return await queryMovieById(ids);
  } catch (err) {
    log.danger(err);
    return [];
  }
}

export async function recommendByItem(userId: string, N: number) {
  const K = 50;
  const userIndex = userId2IndexMap[userId];
  try {
    if (typeof userIndex === 'undefined') {
      throw new Error(`can't find map when userId=${userId}`);
    }
    // 当前用户观看过的电影, 索引列表
    const userWatchedMovies = getUserWatchMovies(userRatingMatrix, userIndex);
    const existMovie = new Set(userWatchedMovies);
    const candidateRecommend = getCandidateRecommendItemList(
      itemSimilarMatrix,
      userWatchedMovies,
      existMovie
    );

    // TODO 考虑使用多线程
    const interestScoreList: Item[] = candidateRecommend.map((movieIndex) => {
      // 对候选推荐列表中的每个物品再次计算相似度, 取前K个
      let similarItem: Item[] = itemSimilarMatrix[movieIndex].map((item, i) => {
        return {
          value: item,
          index: i,
        };
      });
      // similarItem = TopN(similarItem, K);
      // 计算兴趣度
      const score = userWatchedMovies.reduce((prev, cur) => {
        // 兴趣度计算时要混合隐性评分
        const tuple = userRatingMatrix[userIndex][cur];
        if (typeof tuple === 'undefined') {
          // 视为0
          return prev;
        } else {
          return (
            prev + (tuple[0] * 0.7 + tuple[1] * 0.3) * similarItem[cur].value
          );
        }
      }, 0);
      return {
        value: score,
        index: movieIndex,
      };
    });
    // TopN推荐
    const ids = TopN(interestScoreList, N).map(
      (item) => movieIndex2IdMap[item.index]
    );
    return await queryMovieById(ids);
  } catch (err) {
    log.danger(err);
    return [];
  }
}

export async function queryMovieById(ids: string[]) {
  interface MovieInfo {
    id: number;
    poster: string;
    cover: string;
    title_zh: string;
    title_cn: string;
    description: string;
  }
  const condition = ids.map((item) => `id=${item}`).join(' or ');
  const sql = `select id, poster, cover, title_zh, title_cn, description from movie where ${condition}`;
  return await query<MovieInfo>(sql);
}

/**
 * 构建同现矩阵, 非常耗时 15s, 第一次使用后，保存成文件，后面使用时再读取
 */
async function generateCoOccuranceMatrix(
  filePath: string,
  matrix: UserMatrix
): Promise<Matrix> {
  log.info('正在构建同现矩阵...');
  if (fs.existsSync(filePath)) {
    // 如果存在直接读取返回
    const result = await readRecordFile<Matrix>(filePath);
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
      if (matrix[i][j] === undefined) {
        continue;
      }

      for (let k = 0; k < columnLen; k++) {
        if (j === k) {
          continue;
        }
        if (matrix[i][k] === undefined) {
          continue;
        }
        // TODO 优化, 矩阵是个对称矩阵, 只需要两个for循环
        result[j][k] += 1;
      }
    }
  }
  log.success(`同现矩阵构建完毕, 耗时${Date.now() - start} ms`);
  fs.writeFile(filePath, JSON.stringify(result), () => {
    log.success('===同现矩阵保存成功===');
  });
  return result;
}

/**
 * 构建物品相似度矩阵, 非常耗时 13s，但是不能保存成文件, 要根据同现矩阵的更新进行更形
 */
function generateItemSimilarMatrix(
  occuranceMatrix: Matrix,
  userRatingMatrix: UserMatrix
) {
  log.info('正在构建相似度矩阵...');
  const start = Date.now();
  const favoriteList: number[] = [];
  for (let i = 0; i < userRatingMatrix[0].length; i++) {
    let count = 0;
    for (let j = 0; j < userRatingMatrix.length; j++) {
      userRatingMatrix[j][j] !== undefined && count++;
    }
    favoriteList.push(count);
  }
  const result = [];
  // TODO 对称矩阵优化
  for (let i = 0; i < occuranceMatrix.length; i++) {
    for (let j = 0; j < occuranceMatrix[i].length; j++) {
      if (i === 0) {
        result.push(Array(occuranceMatrix[i].length).fill(0));
      }
      result[i][j] =
        occuranceMatrix[i][j] / Math.sqrt(favoriteList[i] * favoriteList[j]);
    }
  }
  log.success(`物品相似度矩阵构建完毕, 耗时${Date.now() - start} ms`);
  return result;
}

/**
 * 最热门电影推荐
 */
export async function hottestMovieRecommend() {
  const result: Item[] = [];
  for (let i = 0; i < userRatingMatrix[0].length; i++) {
    let count = 0;
    for (let j = 0; j < userRatingMatrix.length; j++) {
      userRatingMatrix[j][i] && count++;
    }
    result.push({ value: count, index: i });
  }
  const top = TopN(result, 30);
  const hottestMovieIds = top.map((item) => movieIndex2IdMap[item.index]);
  return await queryMovieById(hottestMovieIds);
}

const start = Date.now();
let userRatingMatrix: UserMatrix,
  userId2IndexMap: IdMap,
  movieId2IndexMap: IdMap;
let movieIndex2IdMap: string[];
let occuranceMatrix: Matrix;
let itemSimilarMatrix: Matrix;
generateRateMatrix(PATH.result).then(async (v) => {
  userRatingMatrix = v.userRatingMatrix;
  userId2IndexMap = v.userId2IndexMap;
  movieId2IndexMap = v.movieId2IndexMap;
  movieIndex2IdMap = Object.keys(movieId2IndexMap);
  occuranceMatrix = await generateCoOccuranceMatrix(
    PATH.result.coOccuranceMatrix,
    userRatingMatrix
  );
  itemSimilarMatrix = generateItemSimilarMatrix(
    occuranceMatrix,
    userRatingMatrix
  );
  log.success(`系统启动完毕, 耗时${Date.now() - start} ms`);
});

/**
 * 更新矩阵的方法
 */

export function updateUserRating(
  userId: number,
  movieId: number,
  rating: number,
  implictRating: number
) {
  const row = userId2IndexMap[userId];
  const column = movieId2IndexMap[movieId];
  // Tuple 是 undefined | [number, number]
  const tuple = userRatingMatrix[row][column];
  if (typeof tuple !== 'undefined') {
    if (implictRating !== undefined) {
      tuple[0] = rating * 0.7;
    } else if (rating !== undefined) {
      tuple[1] = implictRating * 0.3;
    } else {
      // 同时存在
      tuple[0] = rating * 0.7;
      tuple[1] = implictRating * 0.3;
    }
  } else {
    // 是用户新增的, 要更新同现矩阵
    userRatingMatrix[row][column] = [rating * 0.7, implictRating * 0.3];
    updateOccuranceMatrix(row, column);
  }
  log.success('===评分矩阵更新成功===');
}

function updateOccuranceMatrix(row: number, column: number) {
  // 找出需要更新的矩阵索引
  const watchedMovieIndexList = userRatingMatrix[row]
    .map((item, index) => {
      // 不为0的就是需要更新的索引, 排除了当前的电影
      return item !== undefined && column !== index ? index : -1;
    })
    .filter((v) => v !== -1);
  for (const i of watchedMovieIndexList) {
    occuranceMatrix[column][i] += 1;
    // 因为是对称矩阵, 同时更新对称处的位置
    occuranceMatrix[i][column] += 1;
  }
}

export function saveUserRatingMatrix() {
  fs.writeFile(
    PATH.result.savedFilepath,
    JSON.stringify(userRatingMatrix),
    () => {
      log.success('===评分矩阵保存成功===');
    }
  );
}

export function saveOccuranceMatrix() {
  fs.writeFile(
    PATH.result.coOccuranceMatrix,
    JSON.stringify(occuranceMatrix),
    () => {
      log.success('===同现矩阵保存成功===');
    }
  );
}
