const chalk = require('chalk');

const danger = (...text) => {
  console.log(chalk.redBright.bold(...text));
};
const info = (...text) => {
  console.log(chalk.blueBright.bold(...text));
};
const success = (...text) => {
  console.log(chalk.greenBright.bold(...text));
};

const warn = (...text) => {
  console.log(chalk.yellowBright.bold(...text));
};

const log = {
  danger,
  info,
  success,
  warn
}

module.exports = log