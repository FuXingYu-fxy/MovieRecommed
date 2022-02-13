const compose = (...funcs) => {
  if (funcs.length === 0) {
    return arg => arg
  }
  if (funcs.length === 1) {
    return funcs[0]
  }
  return funcs.reduce((prev, cur) => arg => prev(cur(arg)))
}

const curry = (fn) => {
  return function curried(...params) {
    if (params.length >= fn.length) {
      return fn.apply(this, params)
    }
    return function(...args) {
      return curried(...params.concat(args))
    }
  }
}

module.exports = {
  compose,
  curry
}