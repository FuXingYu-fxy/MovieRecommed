import mysql from "mysql";
export interface User {
  id: number;
  password: string;
}

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'sudo',
  database: 'movie_recommend',
})


export function query<T = any>(sql: string) {
return new Promise<T[]>((resolve, reject) => {
    connection.query(sql, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data)
    })
  })
  
}

export default connection;