import type {Request} from "koa";
declare module 'koa' {
  interface Request {
    // 请求体
    body: {
      [key: string]: any;
    }
  }
}