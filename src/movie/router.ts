import Router from 'koa-router';
import { queryMovieRating, updateMovieRating } from '@/movie/movie';
import createMsg from '@/createMsg';
import { updateUserRating } from '@/recommend/recommendMovie';

const movieRouter = new Router();

movieRouter.get('/queryRating', async (ctx, next) => {
  const { userId, movieId } = ctx.query;
  if (!userId || !movieId) {
    ctx.throw(400, 'bad request userId and movieId is required');
  }
  ctx.type = 'json';
  ctx.body = createMsg({
    data: await queryMovieRating(Number(userId), Number(movieId)),
  });
  await next();
});

movieRouter.get('/updateRating', async (ctx, next) => {
  const { userId, movieId, rating } = ctx.query;
  if (!userId || !movieId || !rating) {
    ctx.throw(400, 'bad request userId、movieId、rating is required');
  }
  ctx.type = 'json';
  try {
    await updateMovieRating(Number(userId), Number(movieId), Number(rating));
    ctx.body = createMsg();
    // 更新矩阵
    updateUserRating(Number(userId), Number(movieId), Number(rating));
  } catch {
    ctx.throw(500, 'update failed');
  }
  await next();
});

export default movieRouter;
