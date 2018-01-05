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
  .command('previous', 'go back one track')
  .alias('prev')
  .command('say <message>', 'annoy your neighbors')
  .command('status', 'show current device status')
  .command('queue', 'show current device queue')
  .command('use', 'select a device or group')
  .command('volume', 'change volume of the selected room');

// TODO: find command more reliably
// const commandName = process.argv[2];
// const allCommands = program.commands.map((command) => command._name);
// if (!allCommands.includes(commandName)) {
//   console.error(`bronos: '${commandName}' is not a bronos command. See 'bronos --help'.`)
//   process.exit();
// }

program.parse(process.argv);

// TODO: having a common entry point for sub-commands would be nice
// it would mean only requiring babel-polyfill/ember-metal once
// seems like yarn uses commander and does something along those lines...
