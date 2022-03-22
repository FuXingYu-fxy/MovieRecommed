import Koa from 'koa';
import Router from 'koa-router';
import recommendByUser from './recommend/recommendMovie';
import log from './tools/log';
import connection, { query } from '@/db';
import type { User } from '@/db';
import koaBody from 'koa-bodyparser';
import crypto from '@/tools/crypto';
import cors from 'koa2-cors';

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
// 路由
const router = new Router();

router.get('/recommend', async (ctx, next) => {
  const { userId, N } = ctx.query;
  if (!userId) {
    ctx.status = 400;
    ctx.body = {
      msg: '参数异常, userId是必须的',
      code: 400,
    };
    return await next();
  }
  const result = await recommendByUser(userId as string, Number(N));
  if (!result.length) {
    ctx.status = 500;
    ctx.body = {
      msg: '没有找到推荐列表, userId 是否合法',
    };
    return await next();
  }
  ctx.body = JSON.stringify(result);
  await next();
});

router.post('/login', async (ctx, next) => {
  const { id, passwd } = ctx.request.body as {
    id: number;
    passwd: string;
  };
  ctx.type = 'json';
  try {
    const [data] = await query<User>(`select * from user where id = '${id}'`);
    if (data.id === id && data.password === crypto.encrypt(passwd)) {
      ctx.body = {
        message: 'ok',
        data: {
          token: '123456',
        },
      };
    } else {
      ctx.body = {
        message: 'validate faild',
      };
    }
  } catch (err: any) {
    // 向客户端抛出错误
    log.danger(err.message);
    return await next();
  }
  await next();
});

router.post('/test', async (ctx, next) => {
  // 测试路由, koa-body 返回的 ctx.request.body 是一个字符串
  // 需要解析 JSON.parse
  console.log(ctx.request.body);
  ctx.body = {
    name: 'niubi',
  };
  await next();
});

// ================== begin ==================

app.use(koaBody());

app.use(
  cors({
    allowHeaders: ['content-type'],
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
// app.use(async (ctx, next) => {
//   ctx.set('access-control-allow-headers', ['content-type']);
//   ctx.set('access-control-allow-origin', 'http://localhost:3000');
//   await next();
// });

app.use(async (ctx, next) => {
  console.log(ctx.req.headers.origin);
  const start = Date.now();
  const { querystring } = ctx.request;
  log.info(`[*] ${ctx.request.path}${querystring ? '?' + querystring : ''}`);
  await next();
  ctx.set('X-Response-Timeout', `${Date.now() - start}ms`);
});

app.use(router.routes());

// 一定要放在路由后面
app.use(async (ctx, next) => {
  const { body } = ctx;
  ctx.body = body || '<h1>欢迎使用电影推荐系统</h1>';
  await next();
});

app.listen(port, () => {
  log.info(`this app is running at http://localhost:${port}`);
});

// async function parseBody(ctx: Koa.Context, next: Koa.Next) {
//   try {
//     const result: Buffer[] = [];
//     for await (const data of ctx.req) {
//       result.push(data);
//     }
//     ctx.request.body = JSON.parse(result.toString())
//   } catch (err) {
//     log.danger(err)
//     ctx.request.body = {}
//   }
//   await next();
// }
