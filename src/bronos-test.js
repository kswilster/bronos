require('babel-polyfill');

var fs = require('fs');
var path = require('path');
var webroot = path.resolve(__dirname, 'static');

function sleep(timeout) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, timeout);
  });
}

process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}`);
});

var SonosDiscovery = require('sonos-discovery');

const app = {
  setupSonosDiscovery: async function() {
    const settings = {
      port: 5005,
      securePort: 5006,
      cacheDir: './cache',
      webroot: webroot,
      announceVolume: 40
    };

    const discovery = new SonosDiscovery(settings);
    await sleep(1000);
    const player = discovery.getPlayer('HD-💞💓');
    player.play();
  },

  run: async function() {
    const discovery = this.getSonosDiscovery();
    await sleep(1000);
    const player = discovery.getPlayer('HD-💞💓');
    player.play();
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

// app.run();
app.setupSonosDiscovery();
