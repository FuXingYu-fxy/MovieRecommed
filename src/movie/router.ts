import Router from 'koa-router';
import { addUserFavoriteMovie, delUserFavoriteMovie, queryFavoriteMovie, queryFavoriteMovieById, queryMovieRating, queryUserFavoriteMovie, updateMovieRating } from '@/movie/movie';
import createMsg from '@/createMsg';
import { updateUserRating } from '@/recommend/recommendMovie';
import { queryMovieByTag } from '@/movie/movie';

const movieRouter = new Router();

movieRouter
  .get('/queryRating', async (ctx, next) => {
    const { userId, movieId } = ctx.query;
    if (!userId || !movieId) {
      ctx.throw(400, 'bad request userId and movieId is required');
    }
    ctx.type = 'json';
    ctx.body = createMsg({
      data: await queryMovieRating(Number(userId), Number(movieId)),
    });
    await next();
  })
  .post('/updateRating', async (ctx, next) => {
    const { userId, movieId, rating } = ctx.request.body;
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
  })
  .get('/queryMovieByTagId', async (ctx, next) => {
    const { id } = ctx.query;
    ctx.type = 'json';
    ctx.body = createMsg({
      data: await queryMovieByTag(Number(id)),
    });
    await next();
  })
  .get('/queryFavoriteMovieById', async (ctx, next) => {
    const {id} = ctx.query;
    ctx.type = 'json';
    ctx.body = createMsg({
      data: await queryFavoriteMovieById(Number(id)),
    })
    await next();
  })
  .post('/addUserFavoriteMovie', async (ctx, next) => {
    const {userId, movieId} = ctx.request.body;
    ctx.type = 'json';
    ctx.body = createMsg({
      data: await addUserFavoriteMovie(userId, movieId),
    })
    await next();
  })
  .post('/delUserFavoriteMovie', async (ctx, next) => {
    const {userId, movieId} = ctx.request.body;
    ctx.type = 'json';
    ctx.body = createMsg({
      data: await delUserFavoriteMovie(userId, movieId),
    })
    await next();
  })
  .post('/queryFavoriteMovie', async (ctx, next) => {
    const {userId, movieId} = ctx.request.body;
    ctx.type = 'json';
    ctx.body = createMsg({
      data: await queryFavoriteMovie(userId, movieId),
    })
    await next();
  })

export default movieRouter;
