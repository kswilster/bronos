require('babel-polyfill');

var program = require('commander');

program
  .version('0.0.1')
  .command('play [query]', 'play one or more songs immediately')
  .command('queue [query]', 'queue one or more songs')
  .parse(process.argv);
