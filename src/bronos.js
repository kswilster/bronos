#! /usr/bin/env node
require('babel-polyfill');
require("better-stack-traces").register();

var program = require('commander');

program
  .version('0.0.1')
  .command('add', 'add one or more songs to the selected room')
  .command('play', 'continue playing music in the selected room')
  .command('pause', 'pause music in the selected room')
  .command('next', 'skip ahead to next track')
  .command('prev', 'go back one track')
  .command('queue <query>', 'queue one or more songs')
  .command('say <message>', 'annoy your neighbors')
  // .command('list', 'list available devices and groups')
  .command('status', 'show current device status')
  .command('use', 'select a device or group');

// TODO: find command more reliably
// const commandName = process.argv[2];
// const allCommands = program.commands.map((command) => command._name);
// if (!allCommands.includes(commandName)) {
//   console.error(`bronos: '${commandName}' is not a bronos command. See 'bronos --help'.`)
//   process.exit();
// }

program.parse(process.argv);
