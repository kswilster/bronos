require('babel-polyfill');
var program = require('commander');
import Zone from './models/zone';
import Utils from './utils';

const app = {
  run: async function(volume) {
    this.validateArgs(volume);
    volume = withinRange(volume, 0, 100);
    const zone = await Zone.getDefaultZone();
    zone.setVolume(volume);
  },

  validateArgs(volume) {
    if (isNaN(volume)) {
      console.error('invalid volume!');
      process.exit(1);
    }
  }
}

program
  .arguments('<volume>')
  .action(function(volume) {
    app.run(parseInt(volume));
  })
  .parse(process.argv);

function withinRange(number, min, max) {
  return Math.max(Math.min(number, max), min);
}
