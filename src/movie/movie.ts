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