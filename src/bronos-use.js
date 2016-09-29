require('babel-polyfill');
import _ from 'underscore';

var spawn = require('child_process').spawn;
var sonos = require('sonos');

function handleError (err) {
  console.error('ERROR: ' + err.message)
  process.exit(1)
}

const app = {
  run: async function() {
    const initDevice = await this.getInitialDevice();
    const zones = await this.getZones(initDevice);
    const zoneId = await this.chooseZone(zones);
    console.log(zoneId);

    // TODO: figure out why this won't exit on its own
    process.exit();
  },

  getInitialDevice: async function() {
    const search = sonos.search();
    const timeout = setTimeout(function() {
      search.socket.close();
      console.log('Unable to find Sonos device');
    }, 10000);

    const promise = new Promise(function(resolve, reject) {
      search.once('DeviceAvailable', function(device) {
        clearTimeout(timeout);
        search.socket.close();
        resolve(device);
      });
    });
    return promise;
  },

  getZones: async function(initDevice) {
    const promise = new Promise(function(resolve, reject) {
      initDevice.getTopology(function(err, top) {
        if (err) throw err;

        resolve(top.zones);
      });
    });

    return promise;
  },

  chooseZone: async function(zones) {
    var fzfInput = '';
    zones.forEach(function(zone, index) {
      fzfInput += `${index}: ${zone.name}\n`;
    });

    const result = await this.startFzf(fzfInput);
    const index = result.split(':')[0];
    const zone = zones[index];
    return zone;
  },

  startFzf: async function(entries, multiple=false) {
    const fzfCommand = multiple ? 'fzf -m' : 'fzf';
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

app.run();
