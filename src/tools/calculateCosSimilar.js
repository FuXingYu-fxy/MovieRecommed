const {compose} = require('./functionStyleProgrammingTools')
/** 
 * 示例说明
 * 假设有如下数据
 * 使用包含了用户喜好项的向量（或数组）代表每一个用户
 */
const data = [
  [4, 3, 0, 0, 5, 0],
  [5, 0, 4, 0, 4, 0],
  [4, 0, 5, 3, 4, 0],
  [0, 3, 0, 0, 0, 5],
  [0, 4, 0, 0, 0, 5],
  [0, 0, 2, 4, 0, 5],
];

const userMap = ["用户1", "用户2", "用户3", "用户4", "用户5", "用户6"];

const getVectorModulesLength = (vector) => {
  return Math.sqrt(vector.reduce((prev, cur) => prev + cur ** 2, 0))
}

const getQuantityProduct = (vector1, vector2) => {
  if (vector1.length !== vector2.length) {
    throw `vector1 and vector2 must have the same length, but the vector1's length ${vector1.length} and vector2 is ${vector2.length}`
  }
  let sum = 0
  for (let i = 0; i < vector1.length; i++) {
    sum += vector1[i] * vector2[i]
  }
  return sum
}

/**
 */
const getCosSimilar = (curUserIndex = 0) => {
  let result = []
  for (let i = 0; i < data.length; i++) {
    if (i === curUserIndex) {
      result.push(1)
      continue
    }
    const x = data[curUserIndex]
    const y = data[i]
    result.push(getQuantityProduct(x, y) / (getVectorModulesLength(x) * getVectorModulesLength(y)))
  }
  return result
}
const log = (x) => {
  console.log(x)
  return x
}

getCosSimilar(0)

compose(log, getCosSimilar)(0)
// '用户1' 与其它用户的相似度
// [
//   1,
//   0.7492686492653551,
//   0.6266795614405122,
//   0.21828206253269966,
//   0.2650356625796317,
//   0
// ]

// 从以上结果中可以看出, 用户1与 用户2, 用户3 有着非常相似的相似度
// 可以将 用户2, 3 的商品推荐给用户1