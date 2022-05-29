import Router from 'koa-router';
import {
  verifyUserByPassword,
  getToken,
  verifyToken,
  registryAccount,
  queryUserByToken,
  getUserPreferenceByUserId,
  updateUserPreferenceByUserId,
  updateUserInfo,
  checkPassword,
  getWatchedMovieTags,
  getWatchedMovieCount,
} from '@/user/user';
import type { ChangeUserInfo } from '@/user/user';
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
    const result = await queryUserByToken(token);
    ctx.body = createMsg({
      data: result,
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
    ctx.throw(400, "请输入账号密码");
    // // 不存在账号密码, 验证是否有token
    // const token = ctx.headers['auth-token'];
    // if (!token) {
    //   ctx.body = createMsg<LoginResponse>({
    //     data: {
    //       pass: false,
    //       msg: '请重新登录',
    //     },
    //   });
    //   return await next();
    // }
    // // 验证token是否有效
    // const { pass, msg } = verifyToken(token as string);
    // ctx.body = createMsg<LoginResponse>({
    //   data: {
    //     pass,
    //     msg,
    //   },
    // });
    // await next();
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
  })
  .post('/user/preference', async (ctx, next) => {
    const { userId } = ctx.request.body;
    if (!userId) {
      ctx.throw(400, 'userId is required');
    }
    const result = await getUserPreferenceByUserId(userId);
    ctx.body = createMsg({
      data: result,
    });
    await next();
  })
  .post('/user/updatePreference', async (ctx, next) => {
    const { userId, preference } = ctx.request.body;
    if (preference && preference.length === 0) {
      return await next();
    }
    await updateUserPreferenceByUserId(userId, preference);
    ctx.body = createMsg({});
    await next();
  })
  .post('/user/updateUserInfo', async (ctx, next) => {
    const { userId, userInfo } = ctx.request.body as {
      userId: number;
      userInfo: ChangeUserInfo;
    };
    if (!userId) {
      ctx.throw(400, 'userId is required');
    }
    await updateUserInfo(userId, userInfo);
    ctx.body = createMsg({});
    await next();
  })
  .post('/user/checkPassword', async (ctx, next) => {
    const { userId, password } = ctx.request.body;
    if (!userId) {
      ctx.throw(400, 'userId is required');
    }
    const pass = await checkPassword(userId, password);
    ctx.body = createMsg({
      data: {
        pass,
      },
    });
    await next();
  })
  .post('/user/watchedMovieTags', async (ctx, next) => {
    const {userId} = ctx.request.body;
    if (!userId) {
      ctx.throw(400, 'userId is required');
    }
    const result = await getWatchedMovieTags(Number(userId));
    ctx.body = createMsg({
      data: result,
    })
    await next();
  })
  .post('/user/watchedMovieCount', async (ctx, next) => {
    const {userId} = ctx.request.body;
    if (!userId) {
      ctx.throw(400, 'userId is required');
    }
    const result = await getWatchedMovieCount(userId);
    ctx.body = createMsg({
      data: result,
    })
    await next();
  })

export default userRouter;
