export interface Msg<T> {
  code?: number;
  message?: string;
  data?: T;
}
export default function createMsg<T = any>(options: Msg<T> = {}) {
  return {
    code: options.code || 200,
    message: options.message || 'ok',
    data: options.data || [],
  }
}