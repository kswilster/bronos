#! /usr/bin/env node
require('babel-polyfill');

var program = require('commander');

program
  // .command('play <query>', 'play one or more songs immediately')
  .command('next', 'skip ahead to next track')
  .command('prev', 'go back one track')
  .command('queue <query>', 'queue one or more songs')
  // .command('list', 'list available devices and groups')
  .command('status', 'show current device status')
  .command('use', 'select a device or group')
  .parse(process.argv);
