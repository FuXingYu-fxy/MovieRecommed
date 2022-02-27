import log from './tools/log';
import { getCosSimilarWithOther } from './tools/math';
import { intersection, compact } from 'lodash';
import {
  getSimilarTopNIndex,
  getUserWithRatedMovie,
  generateRateMatrix,
  getCurUserWatchedMovies
} from '@/tools/recommendMovie';

(async () => {
  try {
    const { transformedData } = await generateRateMatrix(PATH.result);
    const curUserIndex = 0;

    const cosSimilar = getCosSimilarWithOther(curUserIndex, transformedData);
    // 计算出当前用户观看过哪些电影
    const curUserWatchedMovieList = getCurUserWatchedMovies(transformedData, curUserIndex)

    const TopNUserList = getSimilarTopNIndex(cosSimilar, 50);
    // 计算兴趣度
    const interestScoreList = curUserWatchedMovieList.map((curMovieIndex) => {
      const ratedUserList = getUserWithRatedMovie(
        transformedData,
        curMovieIndex,
        curUserIndex,
      );
      // 获得交集 V
      const userIntersection = intersection(TopNUserList, ratedUserList);
      // 计算用户u对交集V中用户所看过的电影的兴趣度
      const score = compact(userIntersection).reduce((prev, cur) => {
        return prev + cosSimilar[cur] * transformedData[cur][curMovieIndex];
      }, 0);
      return score
    });
    // 然后就可以对 interestScoreList 排序，推荐给用户
    log.info(JSON.stringify(interestScoreList))
  } catch (err) {
    log.danger(err);
  }
})();
