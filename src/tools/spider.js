const axios = require('axios').default;
const cheerio = require('cheerio');
const convert = require('./convertCsv');
const fs = require('fs');
const chalk = require('chalk');
const { index, segment } = require('../dataset/record.json');
const path = require('path');

const danger = (...text) => {
  console.log(chalk.redBright.bold(...text));
};
const info = (...text) => {
  console.log(chalk.blueBright.bold(...text));
};
const success = (...text) => {
  console.log(chalk.greenBright.bold(...text));
};

const warn = (...text) => {
  console.log(chalk.yellowBright.bold(...text));
};
const request = axios.create({
  baseURL: 'https://www.themoviedb.org',
  headers: {
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    Connection: 'keep-alive',
  },
});

let result = [];
const datasourcePath = path.resolve(__dirname, '../dataset/movies.csv');
const saveFilename = path.resolve(
  __dirname,
  `../dataset/result/result-${segment}.json`
);

const recordFilename = path.resolve(__dirname, '../dataset/record.json');

/**
 * 为了避免重定向, 需要处理标题, 请求格式为
 * tmdbid-firstname(小写)-secondname(小写)
 * 例如 玩具总动员: tmdbid: 862, title: Toy Story
 * url: 862-toy-story
 * @param {string} title
 * @returns string
 */
function processTitle(title) {
  const arr = title
    .replace(/\(.*\)|[,'!:&\.\?\/\-]/g, ' ')
    .split(' ')
    .filter((v) => !!v)
    .map((v) => v.toLowerCase());
  if (arr[arr.length - 1] === 'the') {
    arr.unshift(arr.pop());
  }
  return arr.join('-');
}

async function spider({ movieId, title, tmdbId, type = 'movie' }) {
  // 处理标题
  if (type === 'movie') {
    title = processTitle(title);
    if (!tmdbId || !title) {
      warn('存在空数据');
      warn(`${movieId}, ${title}, ${tmdbId}`);
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
    info(`[===]正在爬取${url}`);
    const { data } = await request(url);
    const $ = cheerio.load(data);
    // 取出背景图
    const poster = $('img.backdrop').attr('src');
    const obj = $('img.poster');
    // 取出封面
    const cover = obj.attr('data-src');
    // 中文标题
    const title = obj.attr('alt');
    // 电影简介
    const description = $('.overview p').text();
    result.push({ movieId, poster, cover, title, description });
  } catch (error) {
    if (error.response) {
      // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
      if (error.response.data.length <= 100) {
        console.log(error.response.data);
      }
      if (error.response.status === 404) {
        if (type === 'movie') {
          warn(`服务端返回404, 尝试重定向类型为 tv...`);
          return await spider({ movieId, title, tmdbId, type: 'tv' });
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

(async function main(index, path) {
  const json = await convert(path);
  for (let i = index; i < json.length; i++) {
    const { movieId, title, tmdbId } = json[i];
    try {
      const data = await spider({ movieId, title, tmdbId });
      result.push(data);
    } catch (error) {
      danger(error.message);
      info(
        `程序中断于${new Date().toLocaleString()}, 请检查以下信息: tmdbId: ${tmdbId}, title: ${title}`
      );
      // 更新索引
      updateRecord(i, segment + Number(result.length !== 0));
      break;
    }
  }
  saveData(result, segment);
})(index, datasourcePath);

function saveData(data) {
  if (data.length === 0) {
    return;
  }
  fs.writeFile(saveFilename, JSON.stringify(data), (err) => {
    if (err) {
      danger('保存data时出现了错误');
      console.log(err);
      return;
    }
    success('分段数据已保存');
  });
}

function updateRecord(index, segment) {
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
      success(`已记录当前索引${index}`);
    }
  );
}
