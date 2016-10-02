require('babel-polyfill');

var path = require('path');
var webroot = path.resolve(__dirname, 'static');
var SonosDiscovery = require('sonos-discovery');
var fs = require('fs');
var os = require('os');

process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}`);
});

const Utils = {
  getCurrentPlayer: async function() {
    const discovery = this.getSonosDiscovery();
    const config = await this.readConfig();

    const player = discovery.getPlayerByUUID(config.zone.uuid);
    if (player) {
      return player;
    } else {
      console.log('No players found');
      process.exit();
    }
  },

  sleep(timeout) {
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve();
      }, timeout);
    });
  },

  readConfig: async function() {
    const promise = new Promise((resolve, reject) => {
      fs.readFile(`${os.homedir()}/.bronos`, (err, data) => {
        if (err) reject(err);

        if (data && data.length) {
          resolve(JSON.parse(data));
        } else {
          reject();
        }
      });
    });

    return promise;
  },

  getSonosDiscovery: function() {
    const settings = {
      port: 5005,
      securePort: 5006,
      cacheDir: './cache',
      webroot: webroot,
      announceVolume: 40
    };

    const discovery = new SonosDiscovery(settings);
    return discovery;
  }
};

export default Utils;
