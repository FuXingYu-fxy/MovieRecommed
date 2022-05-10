import cheerio from 'cheerio';
import request from '@/request/request';
import Router from 'koa-router';
import { 
  queryMovieRating, 
  updateMovieRating ,
  addUserFavoriteMovie, 
  queryFavoriteMovieById, 
  queryFavoriteMovieByUser, 
  delUserFavoriteMovie, 
  innerSearch,
} from '@/movie/movie';
import createMsg from '@/createMsg';
import { updateUserRating } from '@/recommend/recommendMovie';
import { queryMovieByTag } from '@/movie/movie';

const movieRouter = new Router();

movieRouter
  .get('/queryRating', async (ctx, next) => {
    const { userId, movieId } = ctx.query;
    if (!userId || !movieId) {
      ctx.throw(400, 'bad request userId and movieId is required');
    }
    ctx.type = 'json';
    ctx.body = createMsg({
      data: await queryMovieRating(Number(userId), Number(movieId)),
    });
    await next();
  })
  .post('/updateRating', async (ctx, next) => {
    // 均为 number类型
    const { userId, movieId, rating, implictRating } = ctx.request.body;
    if (userId === undefined || movieId === undefined) {
      ctx.throw(400, 'bad request, userId、movieIdis required');
    }
    ctx.type = 'json';
    try {
      await updateMovieRating({
        userId: userId,
        movieId: movieId,
        rating: rating,
        implictRating: implictRating,
      })
      ctx.body = createMsg();
      // 更新矩阵
      updateUserRating(userId, movieId, rating, implictRating);
    } catch {
      ctx.throw(500, 'update failed');
    }
    await next();
  })
  .get('/queryMovieByTagId', async (ctx, next) => {
    const { id } = ctx.query;
    ctx.type = 'json';
    ctx.body = createMsg({
      data: await queryMovieByTag(Number(id)),
    });
    await next();
  })
  .get('/queryFavoriteMovieById', async (ctx, next) => {
    const {id} = ctx.query;
    ctx.type = 'json';
    ctx.body = createMsg({
      data: await queryFavoriteMovieById(Number(id)),
    })
    await next();
  })
  .post('/addUserFavoriteMovie', async (ctx, next) => {
    const {userId, movieId} = ctx.request.body;
    ctx.type = 'json';
    ctx.body = createMsg({
      data: await addUserFavoriteMovie(userId, movieId),
    })
    await next();
  })
  .post('/delUserFavoriteMovie', async (ctx, next) => {
    const {userId, movieId} = ctx.request.body;
    ctx.type = 'json';
    ctx.body = createMsg({
      data: await delUserFavoriteMovie(userId, movieId),
    })
    await next();
  })
  .post('/queryFavoriteMovie', async (ctx, next) => {
    const {userId, movieId} = ctx.request.body;
    ctx.type = 'json';
    ctx.body = createMsg({
      data: await queryFavoriteMovieByUser(userId, movieId),
    })
    await next();
  })
  .get('/outsiteSearch', async(ctx, next) => {
    // 站外搜索
    const { key } = ctx.request.query;
    const { data } = await request({
      url: `/search?query=${key}`,
      headers: {
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
      }
    });
    const $ = cheerio.load(data);
    const result = $(".result");
    const json = [];
    for (let i = 0; i < 20; i+=2) {
      // 每条数据的第一个 .result 是图片封面, 第二个 .result 是标题
      if (!result[i]) {
        break;
      }
      const node = result[i + 1];
      json.push({
        href: node.attribs.href,
        title: node.children[0].children[0].data,
      });
    }
    ctx.type = "json";
    ctx.body = createMsg({
      data: json
    });
    await next();
  })
  .get('/search', async (ctx, next) => {
    let { key } = ctx.request.query;
    key = decodeURIComponent(key as string);
    let data = [];
    if (key) {
      data = await innerSearch(key);
    }
    ctx.type = 'json';
    ctx.body = createMsg({
      data,
    })
    await next();
  })

export default movieRouter;
