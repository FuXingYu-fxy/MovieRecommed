const axios = require("axios").default;
const cheerio = require("cheerio");
const convert = require("./convertCsv");
const fs = require("fs");
const chalk = require('chalk')
const { index, segment } = require("../dataset/curIndex.json");
const path = require('path')

const log = (...text) => {
  console.log(chalk.blue.bold(...text))
}
const info = (...text) => {
  console.log(chalk.blueBright.bold(...text))
}
const success = (...text) => {
  console.log(chalk.greenBright.bold(...text))
}
const request = axios.create({
  baseURL: "https://www.themoviedb.org/movie",
  headers: {
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
    "Connection": "keep-alive"
  },
});

let result = [];

(async () => {
  const json = await convert(path.resolve(__dirname, '../dataset/movies.csv'))
  for (let i = index; i < json.length; i++) {
    const { movieId, title, tmdbId } = json[i];
    // 格式化 title
    const arr = title
      .replace(/\(.*\)|[,'!:&\.\?\/\-]/g, " ")
      .split(" ")
      .filter((v) => !!v)
      .map((v) => v.toLowerCase());
    if (arr[arr.length - 1] === "the") {
      arr.unshift(arr.pop());
    }
    const formatedTitle = arr.join("-");
    // 为了避免重定向, 请求格式为 tmdbid-firstname(小写)-secondname(小写)
    // 例如 玩具总动员: tmdbid: 862, title: Toy Story
    // url: 862-toy-story
    if (!tmdbId || !formatedTitle || !title) {
      info('[info] 存在空数据')
      info(`[info] ${movieId}, ${title}, ${tmdbId}`)
      continue
    }
    let url = `/${tmdbId}-${formatedTitle}`;
    try {
      info(`正在爬取${url}`)
      const { data } = await request(url);
      const $ = cheerio.load(data);
      // 取出背景图
      const poster = $("img.backdrop").attr("src");
      const obj = $("img.poster");
      // 取出封面
      const cover = obj.attr("data-src");
      // 中文标题
      const title = obj.attr("alt");
      // 电影简介
      const description = $(".overview p").text();
      result.push({ movieId, poster, cover, title, description });
    } catch (error) {
      if (error.response) {
        // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
        // console.log(error.response.data);
        log(`${error.response.status}`)
      } else if (error.request) {
        // 请求已经成功发起，但没有收到响应
        console.log(error.request);
        log("服务器未响应...")
      } else {
        // 发送请求时出了点问题
        console.log("Error", error.message);
      }
      log(`在爬取第${i}项: ${url}时出现了问题`);
      // 记录下来当前索引
      recorderIndex(i, segment + Number(result.length !== 0));
      break;
    }
  }
  setTimeout(() => {
    saveData(result, segment);
    success('结束!!!')
  })
})()

function saveData(data, segment) {
  if (data.length === 0) {
    return
  }
  fs.writeFile(
    path.resolve(__dirname, `../dataset/result/result-${segment}.json`),
    JSON.stringify(data),
    (err) => {
      if (err) {
        log("保存data时出现了错误");
        console.log(err);
        return
      }
      log('分段数据已保存')
    }
  );
}


function recorderIndex(index, segment) {
  fs.writeFile(
    path.resolve(__dirname, "../dataset/curIndex.json"),
    JSON.stringify({
      index,
      segment
    }),
    (err) => {
      if (err) {
        console.log(err);
        return
      }
      info('索引已更新')
    }
  );
}
