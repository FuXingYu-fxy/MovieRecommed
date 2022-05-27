import createMsg from '@/createMsg';
import {
  saveOccuranceMatrix,
  saveUserRatingMatrix,
} from '@/recommend/recommendMovie';
import connection from '@/db';
import Router from 'koa-router';

const directiveRouter = new Router();

directiveRouter.post('/save', async (ctx, next) => {
  // 关闭数据库, 保持数据一致性
  await new Promise((resolve) => {
    connection.end(() => {
      console.log('数据库连接已断开');
      // 保存数据
      saveUserRatingMatrix();
      saveOccuranceMatrix();
      resolve(void 0);
    });
  });
  ctx.type = 'json';
  ctx.body = createMsg({
    message: '数据已保存, 现在可以安全退出',
  });
  await next();
});

export default directiveRouter;
