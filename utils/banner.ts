import chalk from 'chalk';

export const showBanner = () => {
  console.log(
    chalk.cyan.bold(
`
╔═══════════════════════════════════════╗
║                                       ║
║              ${chalk.white('Chimera')}              ║
║                                       ║
╚═══════════════════════════════════════╝
`
    )
  );
  console.log(chalk.gray('       Chimera  The Omnichain Forge\n'));
};
