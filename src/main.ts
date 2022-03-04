import Koa from 'koa';
import Router from 'koa-router';
import recommendByUser from './tools/recommendMovie';
import log from './tools/log';
const port = 3000;

const app = new Koa();

const router = new Router();
let times = 1

router.get('/recommend', async (ctx, next) => {
  const {userId} = ctx.query
  if (!userId) {
    ctx.status = 400
    ctx.body = {
      msg: '参数异常, userId是必须的',
      code: 400
    }
    return;
  }
  const result = await recommendByUser(Number(userId))
  if (!result.length) {
    ctx.status = 500;
    ctx.body = {
      msg: '没有找到推荐列表, userId 是否合法'
    }
    return;
  }
  ctx.body = JSON.stringify(result)
  await next()
})

app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  ctx.set('X-Response-Timeout', `${Date.now() - start}ms`)
})

app.use(async (ctx, next) => {
  ctx.type = 'html';
  ctx.body = '<h1>欢迎使用电影推荐系统</h1>'
  await next()
});


app.use(router.routes())

app.use(async (ctx, next) => {
  log.warn(`[${times++}] 已返回结果`)
  await next()
})

app.listen(port, () => {
  log.info(`this app is running at http:localhost:${port}`);
})
