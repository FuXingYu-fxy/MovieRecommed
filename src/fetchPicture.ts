import axios from "axios"
import type {AxiosResponse} from "axios"
import { readRecordFile, updateRecord } from "./tools/spider";
import { join } from "path";
import { writeFile } from "fs";
import log from "./tools/log";
interface Result {
  description: string;
  movieId: string;
  poster: string;
  title: string;
  cover: string;
}

const request = axios.create({
  baseURL: 'https://www.themoviedb.org',
  responseType: 'arraybuffer'
});

function isPromiseFulfilledResultAxiosResponse(res: PromiseRejectedResult | PromiseFulfilledResult<AxiosResponse>): res is PromiseFulfilledResult<AxiosResponse> {
  return (res as PromiseFulfilledResult<AxiosResponse>).value !== undefined
}

const field = ['poster', 'cover']
async function main() {
  // 第一次执行时记得重置 recordFilename
  const {recordFilename} = PATH.spider;
  const { index } = await readRecordFile(recordFilename);
  const data = await readRecordFile<Result[]>(join(PATH.result.waitMergeDirPath, 'result.json'))
  for (let i = index; i < data.length; i++) {
    if (!data[i].cover && !data[i].poster) {
      log.info(`${data[i].movieId}缺少信息`)
      continue;
    }
    try {
      const arr = [data[i].poster && request.get(data[i].poster), data[i].cover && request.get(data[i].cover)]
      const resultArr = await Promise.allSettled(arr)
      for (let j = 0; j < resultArr.length; j++) {
        if (resultArr[j].status === 'fulfilled' && (resultArr[j] as PromiseFulfilledResult<AxiosResponse>).value) {
          writeFile(join(PATH.spider.picture, field[j], data[i].movieId + `_${field[j]}.jpg`), (resultArr[j] as PromiseFulfilledResult<AxiosResponse>).value.data, () => {
            log.success(`${data[i].movieId}_${field[j]} done`)
          })
        } 
      }
    } catch(e: any) {
      log.danger(e.message);
      log.info(
        `程序中断于${new Date().toLocaleString()}`
      );
      updateRecord(i, 0, recordFilename)
      return;
    }
  }
}

main();