import {query} from "@/db"
import { queryMovieById } from "@/recommend/recommendMovie";
import log from "@/tools/log";

interface MovieRating {
  rating: number;
}
export async function queryMovieRating(userId: number, movieId: number) {
  const sql = `select rating from rating where user_id = ${userId} and movie_id = ${movieId}`
  const [result] = await query<MovieRating>(sql);
  return result;
}
interface UpdateParams {
  userId: number;
  movieId: number;
  rating: number;
  implicitRating: number;
}
export async function updateMovieRating({userId, movieId, rating = 0, implicitRating = 0}: UpdateParams) {
  // 先查询是否已经评过分
  let sql;
  const result = await queryMovieRating(userId, movieId);
  if (result === undefined) {
    // 未评分, 数据库中无记录
    sql = `insert into rating (user_id, movie_id, rating, implicit_rating) values (${userId}, ${movieId}, ${rating}, ${implicitRating})`
  } else {
    // 存在记录, 更新
    if (implicitRating === 0) {
      sql = `update rating set rating = ${rating} where user_id=${userId} and movie_id=${movieId}`;
    } else if (rating === 0) {
      sql = `update rating set implicit_rating = ${implicitRating} where user_id=${userId} and movie_id=${movieId}`;
    } else {
      // 同时存在
      sql = `update rating set rating = ${rating}, implicit_rating = ${implicitRating} where user_id=${userId} and movie_id=${movieId}`;
    }
  }
  const res = await query(sql)
  return res;
}

export async function queryMovieByTag(tagId: number) {
  const sql = `select movie_id from tag where tag_id=${tagId}`
  const res = await query(sql);
  return res;
}

export async function addUserFavoriteMovie(userId: number, movieId: number) {
  const sql = `insert into user_favorite_movie(user_id, movie_id) values(${userId}, ${movieId})`;
  return await query(sql);
}

export async function queryFavoriteMovieById(userId: number) {
  const sql = `select movie_id from user_favorite_movie where user_id=${userId}`;
  const res = await query<{'movie_id': number}>(sql);
  if (res.length) {
    return await queryMovieById(res.map(item => String(item['movie_id'])));
  }
  return [];
}
export async function queryFavoriteMovieByUser(userId: number, movieId:number) {
  const sql = `select movie_id from user_favorite_movie where user_id=${userId} and movie_id=${movieId}`;
  return await query<{'movie_id': number}>(sql);
}

export async function delUserFavoriteMovie(userId: number, movieId: number) {
  const sql = `delete from user_favorite_movie where user_id=${userId} and movie_id=${movieId}`;
  return await query(sql);
}

export async function innerSearch(keyword: string) {
  const sql = `select * from movie where title_zh like '%${keyword}%'`;
  log.info(sql);
  return await query(sql);
}
interface Tags {
  id: number;
  tag_name: string;
}
export async function getAllTags() {
  const sql = 'select * from tag_map';
  const result = await query<Tags>(sql);
  return result;
}

export interface QueryByPageBody {
  current: number;
  pageSize: number;
  tagId: number;
}

export async function queryMovieByPage({current, pageSize, tagId}: QueryByPageBody) {
  let queryMovie: string;
  let queryCount: string;
  if (tagId === -1) {
    queryMovie = `select * from movie limit ${(current - 1) * pageSize}, ${pageSize}`;
    queryCount = 'select count(*) as count from movie';
  } else {
    queryMovie = `select * FROM movie where id in (select movie_id from tag where tag_id = ${tagId}) limit ${(current - 1) * pageSize}, ${pageSize}`;
    queryCount = `select count(*) as count from movie where id in (select movie_id from tag where tag_id = ${tagId})`;
  }
  const movieData = await query(queryMovie);
  const [total] = await query<{count: number}>(queryCount);
  return {
    movieData,
    total: total.count
  }
}


export async function getTagsByMovieId(movieId: number) {
  const sql = `select * from tag_map where id in (select tag_id from tag where movie_id = ${movieId})`;
  return await query<Tags>(sql);
}