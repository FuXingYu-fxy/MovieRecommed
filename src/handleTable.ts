import { readRecordFile } from '@/tools/spider';
import fs from 'fs';
import { join } from 'path';
const partialJoin = join.bind(null, __dirname, '../dataset');
const csv = require('csvtojson');
interface Ratings {
  userId: number;
  movieId: number;
  rating: number;
  timestamp: Date;
}
interface Movies {
  movieId: number;
  title: string;
  // tmdbId 是处理过的
  tmdbId: number;
}
interface OriginMovies {
  // 下载下来的原始文件结构
  movieId: number;
  title: string;
  genres: string;
}
interface ResultJson {
  movieId: number;
  cover: string;
  poster: string;
  description: string;
  title: string;
}

interface Tag {
  id: number;
  tag_name: string;
}

function* generateSequence(start: number, end: number) {
  for (let i = start; i <= end; i++) {
    yield String.fromCharCode(i);
  }
}

function generatePassword(bit = 32) {
  const it = (function* () {
    yield* generateSequence(48, 57);
    yield* generateSequence(65, 80);
    yield* generateSequence(97, 122);
  })();
  let str = '';
  for (const char of it) {
    str += char;
  }
  let result = '';
  for (let i = 0; i < bit; i++) {
    result += str[~~(Math.random() * 32)];
  }
  return result;
}

function jsontocsv<T>(arr: Array<T>, delimiter = ',') {
  const head = Object.keys(arr[0]).join(delimiter) + '\n';
  const content = arr
    .map((item) => Object.values(item).join(delimiter))
    .join('\n');
  return head + content;
}

// 生成用户表
async function f1() {
  const json1: Ratings[] = await csv().fromFile(partialJoin('ratings.csv'));
  let j = 0;
  for (let i = 1; i < json1.length; i++) {
    if (json1[j].userId !== json1[i].userId) {
      json1[++j] = json1[i];
    }
  }
  const userArr = json1.slice(0, j + 1).map((item) => {
    return {
      id: item.userId,
      password: generatePassword(),
    };
  });
  fs.writeFile(partialJoin('_user.csv'), jsontocsv(userArr), () => {
    console.log('successful!');
  });
}
f1();

function wrapString(str: string) {
  return `"${str}"`;
}

// 生成电影表
async function f2() {
  /**
   * id, poster, cover, description, title_zh, title_cn
   * json1: id, title_cn
   * json2: poster, cover, description, title_zh
   */
  const json1: Movies[] = await csv().fromFile(partialJoin('movies.csv'));
  const json2: ResultJson[] = await readRecordFile(
    partialJoin('result/result.json')
  );
  // console.log(`json1.length: ${json1.length}, json2.length: ${json2.length}`);
  const json2Map = Object.fromEntries(
    json2.map((item, i) => [item.movieId, i])
  );
  const set = new Set();
  const result = json1.map((item) => {
    // undefined 会被 JSON.stringify 忽略
    const id = item.movieId;
    let index = json2Map[id];
    let missing = index === undefined;
    set.add(id);
    return {
      id,
      poster: missing
        ? null
        : (json2[index].poster && `${id}_poster.jpg`) || null,
      cover: missing ? null : (json2[index].cover && `${id}_cover.jpg`) || null,
      title_zh: missing ? null : json2[index].title ? json2[index].title : null,
      title_cn: item.title,
      description: missing
        ? null
        : json2[index].description
        ? json2[index].description
        : null,
    };
  });
  fs.writeFile(partialJoin('_movie.csv'), jsontocsv(result, '|'), () => {
    console.log('done');
  });
}
f2();

// 生成评分表
async function f3() {
  const json1: Ratings[] = await csv().fromFile(partialJoin('ratings.csv'));
  const result = json1.map((item, i) => {
    return {
      id: i + 1,
      user_id: item.userId,
      movie_id: item.movieId,
      rating: item.rating,
    };
  });
  fs.writeFile(partialJoin('_rating.csv'), jsontocsv(result), () => {
    console.log('done');
  });
}
f3();

// 生成所有电影标签类型
async function f4() {
  const json1: OriginMovies[] = await csv().fromFile(
    partialJoin('origin_movies.csv')
  );
  const set = new Set();
  json1.forEach((item) => {
    const { genres } = item;
    genres.split('|').forEach((item) => set.add(item));
  });
  const result = Array.from(set).map((item, i) => {
    return {
      id: i + 1,
      tag_name: item,
    };
  });
  fs.writeFile(partialJoin('_tag_map.csv'), jsontocsv(result), () => {
    console.log('done');
  });
}

f4();

// 生成标签表
async function f5() {
  const json1: OriginMovies[] = await csv().fromFile(
    partialJoin('origin_movies.csv')
  );
  const tag: Tag[] = await csv().fromFile(partialJoin('_tag_map.csv'));
  const tagMap = Object.fromEntries(tag.map((item, i) => [item.tag_name, i]));

  const result = [];
  let i = 1;
  for (let j = 0; j < json1.length; j++) {
    const { movieId, genres } = json1[j];
    const temp = genres.split('|').map((item) => {
      return {
        id: i++,
        movie_id: movieId,
        tag_id: tagMap[item],
      };
    });
    result.push(...temp);
  }
  fs.writeFile(partialJoin('_movie_tag.csv'), jsontocsv(result), () => {
    console.log('done');
  });
}

f5();
