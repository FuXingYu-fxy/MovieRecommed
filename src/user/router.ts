import Router from 'koa-router';
import {
  verifyUserByPassword,
  getToken,
  verifyToken,
  registryAccount,
  queryUserByToken,
} from '@/user/verifyUser';
import createMsg from '@/createMsg';

interface LoginResponse {
  pass: boolean;
  token?: string;
  msg?: string;
}

// TODO 用一种方法让先前的token 过期

const userRouter = new Router();
interface LoginBody {
  account: string;
  password: string;
}

// 根据token 获取用户信息
userRouter
  .post('/user/info', async (ctx, next) => {
    const { token } = ctx.request.body;
    const result = queryUserByToken(token);
    ctx.body = createMsg({
      data: {
        userId: result.id,
        account: result.account,
        pass: result.pass,
      },
    });
    await next();
  })
  .post('/user/login', async (ctx, next) => {
    // 如果有密码, 代表是第一次登陆或者重新登陆
    const { account, password } = ctx.request.body as LoginBody;
    if (account && password) {
      const { pass, data } = await verifyUserByPassword(account, password);
      if (pass) {
        // 校验通过, 返回token 流程结束,
        // 如果pass 通过， 一定存在 id 与 number
        const token = getToken(data!.id, data!.account);
        ctx.body = createMsg<LoginResponse>({
          data: {
            pass,
            token,
          },
        });
        return await next();
      }
      // 校验未通过
      ctx.body = createMsg<LoginResponse>({
        data: {
          pass: false,
          msg: '账户或密码错误',
        },
      });
      return await next();
    }
    // 不存在账号密码, 验证是否有token
    const token = ctx.headers['auth-token'];
    if (!token) {
      ctx.body = createMsg<LoginResponse>({
        data: {
          pass: false,
          msg: '请重新登录',
        },
      });
      return await next();
    }
    // 验证token是否有效
    const { pass, msg } = verifyToken(token as string);
    ctx.body = createMsg<LoginResponse>({
      data: {
        pass,
        msg,
      },
    });
    await next();
  })
  .post('/user/registry', async (ctx, next) => {
    const { account, password } = ctx.request.body;
    if (account && password) {
      const result = await registryAccount(account, password);
      ctx.body = createMsg({
        data: result,
      });
      return await next();
    }
    await next();
  });

export default userRouter;
