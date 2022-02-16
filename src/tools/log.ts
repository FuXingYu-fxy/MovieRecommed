import chalk from 'chalk';

const danger = (...text: any[]) => {
  console.log(chalk.redBright.bold(...text));
};
const info = (...text: any[]) => {
  console.log(chalk.blueBright.bold(...text));
};
const success = (...text: any[]) => {
  console.log(chalk.greenBright.bold(...text));
};

const warn = (...text: any[]) => {
  console.log(chalk.yellowBright.bold(...text));
};

const log = {
  danger,
  info,
  success,
  warn
}
export default log