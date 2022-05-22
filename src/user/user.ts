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
  user_name: string;
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
      expiresIn: '3d',
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

async function queryUserById(id: number) {
  const sql = `select * from user where id = ${id}`;
  const [result] = await query<UserQueryResponse>(sql);
  return {
    id: result.id,
    account: result.account,
    userName: result.user_name,
  }
}

export async function queryUserByToken(token: string) {
  try {
    const {id} = jwt.verify(token, salt);
    return {
      ... await queryUserById(id),
      pass: true
    }
  } catch {
    return {pass: false}
  }
}

interface UserPerferenceTable {
  id: number;
  tag_name: string;
}
export async function getUserPreferenceByUserId(userId: number) {
  const sql = `select id, tag_name from tag_map where id in (select tag_id from user_preference where user_id = ${userId})`;
  const result = await query<UserPerferenceTable>(sql);
  return result;
}

export async function updateUserPreferenceByUserId(userId: number, list: number[]) {
  // 先删除
  if (list.length === 0) return;
  const delSql = `delete from user_preference where user_id = ${userId}`;
  await query(delSql);
  // 再批量插入
  const sql = `insert into user_preference(user_id, tag_id) values ${list.map(item => `(${userId}, ${item})`).join(',')}`;
  await query(sql);
}

export interface ChangeUserInfo {
  password?: string;
  userName?: string;
}
export async function updateUserInfo(userId: number, userInfo: ChangeUserInfo) {
  const {password, userName} = userInfo;
  let sql = '';
  if (password) {
    sql += `password = '${password}', `;
  }
  if (userName) {
    sql += `user_name = '${userName}', `;
  }
  sql = sql.slice(0, -2);
  const updateSql = `update user set ${sql} where id = ${userId}`;
  const result = await query(updateSql);
  return result;
}

export async function checkPassword(userId: number, password: string) {
  const sql = `select password from user where id = ${userId}`;
  const result = await query(sql);
  if (result.length === 0) {
    return false;
  }
  return result[0].password === password;
}


// 获取用户观看的电影类型
export async function getWatchedMovieTags(userId: number) {
  const sql = `select id, tag_name from tag_map where id in (select DISTINCT tag_id from tag where movie_id in ( select movie_id from user_favorite_movie where user_id = ${userId}))`;
  return await query<UserPerferenceTable>(sql);
}

export async function getWatchedMovieCount(userId: number) {
  const sql = `select count(movie_id) as count from rating where user_id=${userId} and rating != 0`;
  const [result] = await query<{count: number}>(sql);
  const sql2 = `select count(id) as count from user_favorite_movie where user_id = ${userId};`
  const [result2] = await query<{count: number}>(sql2);
  return {
    watched: result.count,
    laterWatch: result2.count
  };
}