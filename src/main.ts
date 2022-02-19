import fs from 'fs';
import log from './tools/log';
// import { getCosSimilarWithOther } from './tools/calculateCosSimilar';
import { convert } from './tools/processFile';
import { readRecordFile } from './tools/spider';

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

async function generateRatingMatri({
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

      movieIdSet.add(userId);
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

    const transformedData: number[][] = Array(userIds.length).fill(undefined);
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const userIndex = userId2IndexMap[userId];
      // 为每一个用户填充矩阵, 注意该矩阵是一个稀疏矩阵
      transformedData[userIndex] = Array(movieIds.length).fill(0);
      const curUserRecord = userMovieRecord[Number(userId)];
      for (let j = 0; j < curUserRecord.length; j++) {
        const { movieId, rating } = curUserRecord[j];
        const movieIndex = movieId2IndexMap[movieId];
        transformedData[userIndex][movieIndex] = rating;
      }
    }
    // 保存评分矩阵 与 映射表
    fs.writeFile(
      savedFilepath,
      JSON.stringify(transformedData),
      errFactory('===评分矩阵保存成功===')
    );
    fs.writeFile(
      userId2IndexMapFilepath,
      JSON.stringify(movieId2IndexMap),
      errFactory('===电影id映射表保存成功===')
    );
    fs.writeFile(
      movieId2IndexMapFilepath,
      JSON.stringify(userId2IndexMap),
      errFactory('===用户id映射表保存成功===')
    );
    return {
      transformedData,
      movieId2IndexMap,
      userId2IndexMap,
    };
  } else {
    // TODO 读出来返回
    log.info('===正在读取文件===');
    const matrix = await readRecordFile<number[][]>(savedFilepath);
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
      transformedData: matrix,
      movieId2IndexMap,
      userId2IndexMap,
    };
  }
}

function errFactory(msg: string) {
  return (err: NodeJS.ErrnoException | null) => {
    if (err) {
      log.danger(err.message);
      return;
    }
    log.success(msg);
  };
}

(async () => {
  const {transformedData, movieId2IndexMap, userId2IndexMap} = await generateRatingMatri(PATH.result);
  // 失败时返回的是空数组
  if (transformedData.length && Object.keys(movieId2IndexMap).length && Object.keys(userId2IndexMap).length) {
    log.success('读取成功')
  } else {
    log.danger('读取失败')
  }
})();