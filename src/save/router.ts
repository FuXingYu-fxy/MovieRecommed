import createMsg from "@/createMsg";
import { saveOccuranceMatrix, saveUserRatingMatrix} from "@/recommend/recommendMovie";
import Router from "koa-router";

const directiveRouter = new Router;

directiveRouter.get('/save', async (ctx, next) => {
  const {directive} = ctx.query;
  if (directive === 'rating') {
    saveUserRatingMatrix();
  } else if (directive === 'occurance') {
    saveOccuranceMatrix();
  } else {
    saveUserRatingMatrix();
    saveOccuranceMatrix();
  }
  ctx.type = 'json';
  ctx.body = createMsg({
    message: '数据已保存'
  })
  await next();
})

export default directiveRouter;