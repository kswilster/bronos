#! /usr/bin/env node
require('babel-polyfill');
require("better-stack-traces").register();

var program = require('commander');

program
  .command('add', 'add one or more songs to the selected room')
  .command('play', 'continue playing music in the selected room')
  .command('pause', 'pause music in the selected room')
  .command('next', 'skip ahead to next track')
  .command('prev', 'go back one track')
  .command('queue <query>', 'queue one or more songs')
  .command('say <message>', 'annoy your neighbors')
  // .command('list', 'list available devices and groups')
  .command('status', 'show current device status')
  .command('use', 'select a device or group')
  .parse(process.argv);
