import crypto from '@/tools/crypto';
import log from '@/tools/log';
import { query } from '@/db';
import jwt from 'jsonwebtoken';
const salt = 'fxy';
interface UserInfo {
  id: number;
  account: number;
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
export async function verifyUserByPassword(account: number, password: string) {
  try {
    const [data] = await query<UserLoginRequestBody>(`select * from user where account = '${account}'`);
    if (data.account === account && data.password === crypto.encrypt(password)) {
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

export function getToken(id: number, account: number) {
  return jwt.sign({
    id,
    account
  }, salt, {
    // 三天过期
    expiresIn: '3d',
  })
}

interface Signature {
  id: number;
  account: number;
}
export function verifyToken(token: string) {
  try {
    // 如果token 非法或者已过期, 就会 throw err
    const {id, account} = jwt.verify(token, salt) as Signature;
    return wrap({
      data: {
        id,
        account
      },
      pass: true,
    })
  } catch (err: any) {
    return wrap({
      msg: err.message
    });
  }
}