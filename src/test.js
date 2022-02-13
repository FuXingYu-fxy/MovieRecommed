const fetch = (delay, msg) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let r = Math.random()
      console.log(r)
      if (r > 0.5) {
        resolve(msg)
      } else {
        reject(msg)
      }
    }, delay)
  })
}

let arr = [1, 2, 3, 4, 5];

let result = [];

(async() => {
  for (let i = 0; i < arr.length; i++) {
    try {
      const data = await fetch(1000, i)
      result.push({info: data, msg: 'resolve'})
    } catch (err) {
      result.push({info: err, msg: 'reject'})
    }
  }
  setTimeout(() => {
    console.log(result)
  })
})()
