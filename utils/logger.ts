import chalk from 'chalk';

export const logSuccess = (message: string): void => {
  console.log(chalk.green.bold(`✅ ${message}`));
};

export const logError = (message: string): void => {
  console.error(chalk.red.bold(`❌ ${message}`));
};

export const logInfo = (message: string): void => {
  console.log(chalk.blue.bold(`ℹ️  ${message}`));
};

export const logWarning = (message: string): void => {
  console.log(chalk.yellow.bold(`⚠️  ${message}`));
};

export const logHighlight = (message: string): void => {
  console.log(chalk.magenta.bold(message));
};
