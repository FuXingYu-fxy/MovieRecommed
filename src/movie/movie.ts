import {query} from "@/db"
import { queryMovieById } from "@/recommend/recommendMovie";

interface MovieRating {
  rating: number;
}
export async function queryMovieRating(userId: number, movieId: number) {
  const sql = `select rating from rating where user_id = ${userId} and movie_id = ${movieId}`
  const [result] = await query<MovieRating>(sql);
  return result || 0;
}

export async function updateMovieRating(userId: number, movieId: number, rating: number) {
  const sql = `update rating set rating = ${rating} where user_id=${userId} and movie_id=${movieId}`;
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
export async function queryFavoriteMovie(userId: number, movieId:number) {
  const sql = `select movie_id from user_favorite_movie where user_id=${userId} and movie_id=${movieId}`;
  return await query<{'movie_id': number}>(sql);
}

export async function delUserFavoriteMovie(userId: number, movieId: number) {
  const sql = `delete from user_favorite_movie where user_id=${userId} and movie_id=${movieId}`;
  return await query(sql);
}
