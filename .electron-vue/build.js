'use strict';

process.env.NODE_ENV = 'production';

const { say } = require('cfonts');
const chalk = require('chalk');
const del = require('del');
const { spawn } = require('child_process');
const webpack = require('webpack');
const Listr = require('listr');

const doneLog = chalk.bgGreen.white(' DONE ') + ' ';
const errorLog = chalk.bgRed.white(' ERROR ') + ' ';
const okayLog = chalk.bgBlue.white(' OKAY ') + ' ';
const isCI = process.env.CI || false;

if (process.env.BUILD_TARGET === 'clean') clean();
else build();

function clean() {
  del.sync(['build/*', '!build/icons', '!build/icons/icon.*']);
  console.log(`\n${doneLog}\n`);
  process.exit();
}

function build() {
  greeting();

  del.sync(['dist/electron/*', '!.gitkeep']);

  const tasks = new Listr(['main', 'renderer', 'web'].map((configName) => ({
    title: `building ${configName} process`,
    task(ctx, task) {
      const config = require(`./webpack.${configName}.config`);
      return pack(config).then((result) => {
        ctx.results += result + '\n\n';
      }).catch((err) => {
        console.log(`\n  ${errorLog}failed to build main process`);
        console.error(`\n${err}\n`);
        process.exit(1);
      });
    },
  })), { concurrent: true });
  tasks.run({ results: '' }).then(({ results }) => {
    process.stdout.write('\x1B[2J\x1B[0f');
    console.log(`\n\n${results}`);
    console.log(`${okayLog}take it away ${chalk.yellow('`electron-builder`')}\n`);
  });

  // const tasks = ['main', 'renderer', 'web'];
  // let results = '';

  // Promise.all(tasks.map((task) => {
  //   const config = require(`./webpack.${task}.config`);
  //   const spinner = process.env.DISABLE_SPINNER ? null : ora(`building ${task} process`).start();
  //   return pack(config).then((result) => {
  //     if (spinner) spinner.succeed();
  //     results += result + '\n\n';
  //   }).catch((err) => {
  //     if (spinner) spinner.fail();
  //     console.log(`\n  ${errorLog}failed to build main process`);
  //     console.error(`\n${err}\n`);
  //     process.exit(1);
  //   });
  // })).then(() => {
  //   process.stdout.write('\x1B[2J\x1B[0f');
  //   console.log(`\n\n${results}`);
  //   console.log(`${okayLog}take it away ${chalk.yellow('`electron-builder`')}\n`);
  // });
}

function pack(config) {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) reject(err.stack || err);
      else if (stats.hasErrors()) {
        let err = '';

        stats
          .toString({
            chunks: false,
            colors: true,
          })
          .split(/\r?\n/)
          .forEach(line => {
            err += `    ${line}\n`;
          });

        reject(err);
      } else {
        resolve(
          stats.toString({
            chunks: false,
            colors: true,
          }),
        );
      }
    });
  });
}

function greeting() {
  const cols = process.stdout.columns;
  let text = '';

  if (cols > 85) text = 'lets-build';
  else if (cols > 60) text = 'lets-|build';
  else text = false;

  if (text && !isCI) {
    say(text, {
      colors: ['yellow'],
      font: 'simple3d',
      space: false,
    });
  } else console.log(chalk.yellow.bold('\n  lets-build'));
  console.log();
}
