import Router from 'koa-router';
import {recommendByUser, recommendByItem, queryMovieById} from '@/recommend/recommendMovie'
import createMsg from '@/createMsg';
const recommendRouter = new Router();

recommendRouter.get('/recommendByUser', async (ctx, next) => {
  const { userId, N } = ctx.query;
  if (!userId) {
    ctx.throw(400, 'userId is required');
  }
  const result = await recommendByUser(userId as string, Number(N || 20));
  if (!result.length) {
    ctx.throw(400, 'userId is not exist');
  }
  ctx.body = createMsg({
    data: result,
  })
  await next();
});

recommendRouter.get('/recommendByItem', async (ctx, next) => {
  const { userId, N } = ctx.query;
  if (!userId) {
    ctx.throw(400, 'userId is required');
  }
  const result = await recommendByItem(userId as string, Number(N || 20));
  if (!result.length) {
    ctx.throw(400, 'userId is not exist');
  }
  ctx.body = createMsg({
    data: result,
  })
  await next();
})

recommendRouter.get('/queryById', async (ctx, next) => {
  const { ids } = ctx.query;
  if (!ids) {
    ctx.throw(400, 'ids is required');
  }
  ctx.type = 'json';
  
  ctx.body = createMsg({
    data: await queryMovieById(ids as string[])
  });
  await next();
})

export default recommendRouter;
