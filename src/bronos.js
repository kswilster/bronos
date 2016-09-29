require('babel-polyfill');

var program = require('commander');

program
  .command('play [query]', 'play one or more songs immediately')
  .command('queue [query]', 'queue one or more songs')
  .command('list', 'list available devices and groups')
  .command('use', 'select a device or group')
  .parse(process.argv);
