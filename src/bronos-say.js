require('babel-polyfill');
var program = require('commander');
import Zone from './models/zone';
import Utils from './utils';

process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}`);
});

const app = {
  run: async function(message) {
    this.validateArgs(...arguments);
    const zone = await Zone.getDefaultZone();
    zone.say(message);
  },

  validateArgs(message) {
    if (!message) {
      console.error('no message given!');
      process.exit(1);
    }
  }
}

program
  .arguments('<message...>')
  .action(function(messageArray) {
    app.run(messageArray.join(' '));
  })
  .parse(process.argv);
