require('babel-polyfill');

var program = require('commander');

program
  .arguments('<searchTerm>')
  .command('play [query]', 'play one or more songs immediately').alias('p')
  .command('queue [query]', 'queue one or more songs').alias('q')
  .parse(process.argv);
