import Koa from 'koa';
import log from '@/tools/log';
import connection from '@/db';
import cors from 'koa2-cors';
import userRouter from '@/user/router';
import recommendRouter from '@/recommend/router';
import logger from 'koa-logger';
import koaStatic from 'koa-static';

// 数据库连接
connection.connect((err) => {
  if (err) {
    log.danger(`数据库连接失败: ${err.message}`);
    return;
  }
  log.success('=== 数据库连接成功 ===');
});

const port = 5500;
// koa
const app = new Koa();
app.keys = ['some secret hurr'];

// ================== begin ==================

// X-Response-Time
async function responseTime(ctx: Koa.Context, next: Koa.Next) {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
}

async function pageNotFound(ctx: Koa.Context, next: Koa.Next) {
  switch (ctx.accepts('html', 'json')) {
    case 'html':
      ctx.type = 'html';
      ctx.body = '<p>Page Not Found</p>';
      break;
    case 'json':
      ctx.type = 'json';
      ctx.body = {
        message: 'Page Not Found',
      };
      break;
    default:
      ctx.type = 'text';
      ctx.body = 'Page Not Found';
  }
  await next();
}

app
  .use(responseTime)
  .use(parseBody)
  .use(logger())
  .use(koaStatic(PATH.spider.picture))
  .use(
    cors({
      allowHeaders: ['content-type'],
      origin: 'http://localhost:3000',
      credentials: true,
    })
  )
  .use(pageNotFound)
  .use(userRouter.routes())
  .use(recommendRouter.routes())
  .on('error', (err) => {
    log.danger(err);
  })
  .listen(port, () => {
    log.info(`this app is running at http://localhost:${port}`);
  });

async function parseBody(ctx: Koa.Context, next: Koa.Next) {
  try {
    const result: Buffer[] = [];
    for await (const data of ctx.req) {
      result.push(data);
    }
    ctx.request.body = result.length && JSON.parse(result.toString());
  } catch (err) {
    log.danger(err);
  }
  await next();
}
