import log from '@/tools/log';
import { query } from '@/db';
import jwt from 'jsonwebtoken';
const salt = 'fxy';
interface UserInfo {
  id: number;
  account: string;
}
interface UserQueryResponse extends UserInfo {
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
  };
}
export async function verifyUserByPassword(account: string, password: string) {
  try {
    const [data] = await query<UserQueryResponse>(
      `select * from user where account = '${account}'`
    );
    if (data.account === account && data.password === password) {
      delete data.password;
      return wrap({
        pass: true,
        data,
      });
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
  return jwt.sign(
    {
      id,
      account,
    },
    salt,
    {
      // 三天过期  '3d'
      expiresIn: 60,
    }
  );
}

interface VerifyTokenMsg {
  msg?: string;
  pass: boolean;
}

export function verifyToken(token: string): VerifyTokenMsg {
  try {
    // 如果token 非法或者已过期, 就会 throw err
    jwt.verify(token, salt);
  } catch {
    return {
      pass: false,
      msg: 'token无效或token已过期, 请重新登录',
    };
  }
  return { pass: true };
}

interface RegistryResponse {
  pass: boolean;
  msg: string;
  data: {
    token: string;
  } | null;
}
export async function registryAccount(
  account: string,
  password: string
): Promise<RegistryResponse> {
  let id: number;
  const queryCurAcountIsExist = `select id from user where account = '${account}'`;
  const result = await query(queryCurAcountIsExist);
  if (result.length) {
    return {
      pass: false,
      msg: '当前账户已存在',
      data: null,
    };
  }
  // 注册流程
  // 如果还有未剩余的账户
  const queryIsSurplus = 'select id from user where account is NULL limit 1';
  const result2 = await query<{ id: number }>(queryIsSurplus);
  let pass: boolean = true;
  if (!result2.length) {
    // 没有剩余账户了
    const getId = 'select max(id) as id from user;';
    const [row] = await query<{ id: number }>(getId);
    id = row.id + 1;
    const insertUser = `insert into user(password, account) value('${password}', '${account}')`;
    try {
      await query(insertUser);
    } catch (err: any) {
      log.danger(`注册用户(insert): ${err.message}`);
      pass = false;
    }
  } else {
    id = result2[0].id;
    const updateAccount = `update user set password = '${password}', account = '${account}' where id = ${id}`;
    try {
      await query(updateAccount);
    } catch (err: any) {
      log.danger(`注册用户(update): ${err.message}`);
      pass = false;
    }
  }

  if (!pass) {
    return {
      pass,
      msg: '系统发生错误, 注册失败, 请联系管理员',
      data: null,
    };
  } 
  const token = getToken(id, account);
  return {
    pass,
    msg: '注册成功, 已为您自动登录',
    data: {
      token,
    },
  };
}


export function queryUserByToken(token: string) {
  try {
    const {id, account} = jwt.verify(token, salt);
    return {
      id,
      account,
      pass: true
    }
  } catch {
    return {pass: false}
  }
}