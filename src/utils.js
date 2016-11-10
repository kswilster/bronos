require('babel-polyfill');

var path = require('path');
var webroot = path.resolve(__dirname, 'static');
var SonosDiscovery = require('sonos-discovery');
var fs = require('fs');
var os = require('os');
var spawn = require('child_process').spawn;

process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}`);
});

const Utils = {
  getCurrentPlayer: async function() {
    const discovery = await this.getSonosDiscovery();
    const config = await this.readConfig();
    // await Utils.sleep(2000);

    const player = discovery.getPlayer(config.zone.roomName);
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

  getSonosDiscovery: async function() {
    const settings = {
      port: 5015,
      securePort: 5016,
      cacheDir: './cache',
      webroot: webroot,
      announceVolume: 40
    };

    const discovery = new SonosDiscovery(settings);

    const promise = new Promise((resolve, reject) => {
      const discoverInterval = setInterval(function() {
        if (discovery.players.length) {
          resolve(discovery);
          clearInterval(discoverInterval);
          clearTimeout(timeout);
        }
      }, 50);

      const timeout = setTimeout(function() {
        reject('Could not start Sonos Discovery');
        clearInterval(discoverInterval);
        clearTimeout(timeout);
      }, 5000);
    });

    return promise;
  },

  startFzf: async function(entries, multiple=false) {
    // TODO: handle project root better
    const fzfPath = path.normalize(`${__dirname}/../bin/fzf`);
    const fzfCommand = multiple ? `${fzfPath} -m` : `${fzfPath}`;
    const fzf = spawn(`echo "${entries}" | ${fzfCommand}`, {
      stdio: ['inherit', 'pipe', 'inherit'],
      shell: true
    });

    fzf.stdout.setEncoding('utf-8');

    const promise = new Promise(function(resolve, reject) {
      fzf.stdout.on('readable', () => {
        const value = fzf.stdout.read();
        if (value !== null) {
          resolve(value);
        }
      });
    });

    return promise;
  }
};

export default Utils;
