import Router from 'koa-router';
import {recommendByUser, recommendByItem} from '@/recommend/recommendMovie'
import createMsg from '@/createMsg';
const recommendRouter = new Router();

recommendRouter.get('/recommendByUser', async (ctx, next) => {
  const { userId, N } = ctx.query;
  if (!userId) {
    ctx.throw(400, 'userId is required');
  }
  const result = recommendByUser(userId as string, Number(N || 20));
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
  const result = recommendByItem(userId as string, Number(N || 20));
  if (!result.length) {
    ctx.throw(400, 'userId is not exist');
  }
  ctx.body = createMsg({
    data: result,
  })
  await next();
})

export default recommendRouter;
