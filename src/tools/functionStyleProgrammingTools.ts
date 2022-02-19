export const compose = (...funcs: Function[]) => {
  if (funcs.length === 0) {
    return (arg: any) => arg;
  }
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funcs.reduce((prev, cur) => (arg: any) => prev(cur(arg)));
};

export const curry = (fn: Function) => {
  return function curried(this: any, ...params: any[]) {
    if (params.length >= fn.length) {
      return fn.apply(this, params);
    }
    return function (...args: any[]) {
      return curried(...params.concat(args));
    };
  };
};

export const id = (x: any) => {
  console.log(x);
  return x;
};
