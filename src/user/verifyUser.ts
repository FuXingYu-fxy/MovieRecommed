import log from '@/tools/log';
import { query } from '@/db';
import jwt from 'jsonwebtoken';
const salt = 'fxy';
interface UserInfo {
  id: number;
  account: string;
}
interface UserLoginRequestBody extends UserInfo {
  password?: string;
}
interface Wrap {
  msg?: string;
  pass?: boolean;
  data?: UserInfo;
}
function wrap(options: Wrap) {
  return {
    msg: options.msg || '',
    pass: options.pass || false,
    data: options.data || null,
  }
}
export async function verifyUserByPassword(account: string, password: string) {
  try {
    const [data] = await query<UserLoginRequestBody>(`select * from user where account = '${account}'`);
    if (data.account === account && data.password === password) {
      delete data.password;
      return wrap({
        pass: true,
        data
      })
    } else {
      return wrap({
        msg: '账户或密码错误',
      });
    }
  } catch (err: any) {
    log.danger(`密码查询错误 ${err.message}`);
    return wrap({
      msg: '服务器内部错误',
    });
  }
}

export function getToken(id: number, account: string) {
  return jwt.sign({
    id,
    account
  }, salt, {
    // 三天过期
    expiresIn: '3d',
  })
}

interface VerifyTokenMsg {
  msg?: string;
  pass: boolean;
}

export function verifyToken(token: string): VerifyTokenMsg {
  try {
    // 如果token 非法或者已过期, 就会 throw err
    jwt.verify(token, salt)
  } catch  {
    return {
      pass: false,
      msg: 'token无效或token已过期, 请重新登录'
    }
  }
  return {pass: true};
}