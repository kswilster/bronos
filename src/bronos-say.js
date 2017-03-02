require('babel-polyfill');

var SpotifyWebApi = require('spotify-web-api-node');
var program = require('commander');

import Utils from './utils';

const spotifyApi = new SpotifyWebApi();

process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}`);
});

const app = {
  run: async function(message) {
    this.validateArgs(...arguments);
    const zone = await Utils.getCurrentZone();
    await Utils.say(zone.roomName, message);
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
