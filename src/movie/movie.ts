import {query} from "@/db"

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
  console.log(res)
  return res;
}