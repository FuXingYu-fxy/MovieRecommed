import Router from 'koa-router';
import log from '@/tools/log';
import createMsg from '@/createMsg';
import { query } from '@/db';
import type { User } from '@/db';
import crypto from '@/tools/crypto';

const userRouter = new Router();

// 接收一个token
userRouter.get('/user/userinfo', async (ctx, next) => {
  // TODO 检查token
  const { token } = ctx.query;
  await next();
})

userRouter.post('/user/login', async (ctx, next) => {
  const { id, passwd } = ctx.request.body as {
    id: number;
    passwd: string;
  };
  ctx.type = 'json';
  try {
    const [data] = await query<User>(`select * from user where id = '${id}'`);
    if (data.id === id && data.password === crypto.encrypt(passwd)) {
      // TODO change token
      ctx.body = createMsg({
        data: [{
          token: crypto.encrypt(String(data.id)),
        }]
      })
    } else {
      ctx.body = createMsg({
        message: '用户名或密码错误',
        code: -1,
      })
    }
  } catch (err: any) {
    log.danger(err.message);
    ctx.throw(500, err.message);
  }
  await next();
});

userRouter.get('/test', async (ctx, next) => {
  ctx.set('ETag', '123');
  if (ctx.fresh) {
    ctx.status = 304;
    return;
  }
  const {name, age} = ctx.request.query
  const [data] = await query<{name: string; age: number}>(`select * from test where name = '${name}'`)
  try {
    ctx.body = createMsg({
      data: [data]
    });
  } catch (err: any) {
    log.danger(err.message);
    ctx.throw(500, err.message);
  }
  await next();
});

export default userRouter;