const fs = require('fs')
const csv = require('csvtojson')
const convert = pathname => csv().fromFile(pathname)
  .then((json) => {
    // fs.writeFile(pathname.replace(/csv/g, 'json'), JSON.stringify(json), err => {
    //   if (err) {
    //     console.warn('转换失败')
    //   }
    // })
    return json
  })

module.exports = convert