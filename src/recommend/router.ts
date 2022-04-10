import Router from 'koa-router';
import {recommendByUser, recommendByItem} from '@/recommend/recommendMovie'
import createMsg from '@/createMsg';
const recommendRouter = new Router();

recommendRouter.get('/recommend', async (ctx, next) => {
  const { userId, N } = ctx.query;
  if (!userId) {
    ctx.throw(400, 'userId is required');
  }
  const result = await recommendByUser(userId as string, Number(N));
  if (!result.length) {
    ctx.throw(400, 'userId is not exist');
  }
  ctx.body = createMsg({
    data: result,
  })
  await next();
});

recommendRouter.get('/generateCommonOccuranceMatrix', async (ctx, next) => {
  const {userId} = ctx.query;
  ctx.body = createMsg({
    data: recommendByItem(userId as string)
  })
  await next();
})

export default recommendRouter;
