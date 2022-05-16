import Router from 'koa-router';
import { verifyUserByPassword, getToken, verifyToken } from '@/user/verifyUser';
import createMsg from '@/createMsg';


const userRouter = new Router();

// 根据token 获取用户信息
userRouter.get('/user/userinfo', async (ctx, next) => {
  // TODO 检查token
  const token = ctx.headers['auth-token'];
  await next();
})
interface LoginBody {
  account: number;
  password: string;
}

userRouter.post('/user/login', async (ctx, next) => {
  const { account, password } = ctx.request.body as LoginBody;
  // 先检查是否有token
  const token = ctx.headers['auth-token'];
  if (!token) {
    // 没有token, 检测账户密码
    const result = await verifyUserByPassword(account, password);
    if (result.pass) {
      // 如果通过了密码检测, 返回token
      ctx.body = createMsg({
        data: {
          token: getToken(result.data!.id, result.data!.account),
        }
      })
    } else {
      ctx.throw(400, result.msg);
    }
  } else {
    // 验证 token
    const result = verifyToken(token as string);
    if (result.pass) {
      ctx.body = createMsg({
        data: result.data,
      });
    } else {
      ctx.body = createMsg({
        message: result.msg
      })
    }
  }
  await next();
});

export default userRouter;