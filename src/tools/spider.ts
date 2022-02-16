import axios from 'axios';
import cheerio from 'cheerio';
import { convert } from './processFile';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';
import log from './log';
import { Movie, MovieInfo } from './processFile';

// 分段保存的文件结构
interface IndexRecord {
  index: number;
  segment: number;
}

// 错误记录信息
interface SpiderNetWorkErrorRecord {
  movieId: number;
  tmdbId: number;
  title: string;
  date: string;
  err: string;
}

const request = axios.create({
  baseURL: 'https://www.themoviedb.org',
  headers: {
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    Connection: 'keep-alive',
  },
});

function configFilepath(segment: number) {
  const datasourcePath = path.resolve(__dirname, '../dataset/movies.csv');
  const saveFilename = path.resolve(
    __dirname,
    `../dataset/result/result-${segment}.json`
  );

  const recordFilename = path.resolve(__dirname, '../dataset/record.json');

  const errorPath = path.resolve(__dirname, '../dataset/error/exception.json');
  return {
    datasourcePath,
    saveFilename,
    recordFilename,
    errorPath,
  };
}

/**
 * 为了避免重定向, 需要处理标题, 请求格式为
 * tmdbid-firstname(小写)-secondname(小写)
 * 例如 玩具总动员: tmdbid: 862, title: Toy Story
 * url: 862-toy-story
 */
function processTitle(title: string) {
  const arr = title
    .replace(/\(.*\)|[,'’!:&\.\?\/\-]/g, ' ')
    .split(' ')
    .filter((v) => !!v)
    .map((v) => v.toLowerCase());
  if (arr[arr.length - 1] === 'the') {
    arr.unshift(arr.pop()!);
  }
  return arr.join('-');
}

async function spider(
  { movieId, title, tmdbId }: Movie,
  type: 'movie' | 'tv' = 'movie'
): Promise<MovieInfo | undefined> {
  // 处理标题
  if (type === 'movie') {
    title = processTitle(title);
    if (!tmdbId || !title) {
      log.warn('存在空数据');
      log.warn(`${movieId}, ${title}, ${tmdbId}`);
      return {
        movieId,
        poster: 'emptyPoster',
        cover: 'emptyCover',
        title: 'emptyTitle',
        description: 'emptyDescription',
      };
    }
  }
  let url = `/${type}/${tmdbId}-${title}`;
  try {
    log.info(`[===]正在爬取${url}`);
    const { data } = await request(url);
    const $ = cheerio.load(data);
    // 取出背景图
    const poster = $('img.backdrop').attr('src') || '';
    const obj = $('img.poster');
    // 取出封面
    const cover = obj.attr('data-src') || '';
    // 中文标题
    const title = obj.attr('alt') || '暂无标题';
    // 电影简介
    const description = $('.overview p').text();
    return { movieId, poster, cover, title, description };
  } catch (error: any) {
    if (error.response) {
      // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
      if (error.response.data.length <= 100) {
        console.log(error.response.data);
      }
      if (error.response.status === 404) {
        if (type === 'movie') {
          log.warn(`服务端返回404, 尝试重定向类型为 tv...`);
          return await spider({ movieId, title, tmdbId }, 'tv');
        } else {
          throw new Error('服务端返回404, 请检查后重启程序');
        }
      }
    } else if (error.request) {
      // 请求已经成功发起，但没有收到响应
      throw new Error('服务器未响应...');
    } else {
      // 发送请求时出了点问题
      throw error;
    }
  }
}

function readRecordFile<T = IndexRecord>(filepath: string): Promise<T> {
  return new Promise((r) => {
    fs.readFile(filepath, 'utf-8', (err, data) => {
      if (err) {
        log.danger(err.message);
        return;
      }
      r(JSON.parse(data));
    });
  });
}

(async function main() {
  let result: MovieInfo[] = [];
  // 该文件记录着上一次爬虫中断后的信息
  const { index, segment } = await readRecordFile(
    resolve(__dirname, '../dataset/record.json')
  );
  // 文件路径
  const { datasourcePath, errorPath, saveFilename, recordFilename } = configFilepath(segment);
  const json = await convert(datasourcePath);

  for (let i = index; i < json.length; i++) {
    const { movieId, title, tmdbId } = json[i];
    try {
      const data = await spider({ movieId, title, tmdbId });
      result.push(data!);
    } catch (error: any) {
      log.danger(error.message);
      log.info(
        `程序中断于${new Date().toLocaleString()}, 请检查以下信息: tmdbId: ${tmdbId}, title: ${title}`
      );
      // 更新索引
      updateRecord(i, segment + Number(result.length !== 0), recordFilename);
      break;

      // 现在网络错误不再中断程序, 而是记录下出错的信息
      recordException(
        {
          movieId,
          tmdbId,
          title,
          date: new Date().toLocaleString(),
          err: error.message,
        },
        errorPath
      );
    }
  }
  saveData(result, saveFilename);
})();

async function recordException(
  exceptionMsg: SpiderNetWorkErrorRecord,
  errorPath: string
) {
  const data = await readRecordFile<SpiderNetWorkErrorRecord[]>(errorPath)
  data.push(exceptionMsg);
  fs.writeFile(errorPath, JSON.stringify(data), (err) => {
    if (err) {
      log.danger(err.message);
      return;
    }
    log.success('错误信息已记录');
  });
}

/**
 * 分段保存文件 
 */
function saveData(data: MovieInfo[], saveFilename: string) {
  if (data.length === 0) {
    return;
  }
  fs.writeFile(saveFilename, JSON.stringify(data), (err) => {
    if (err) {
      log.danger('保存data时出现了错误');
      console.log(err);
      return;
    }
    log.success('分段数据已保存');
  });
}

function updateRecord(index: number, segment: number, recordFilename: string) {
  fs.writeFile(
    recordFilename,
    JSON.stringify({
      index,
      segment,
    }),
    (err) => {
      if (err) {
        console.log(err);
        return;
      }
      log.success(`已记录当前索引${index}`);
    }
  );
}
