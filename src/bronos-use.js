require('babel-polyfill');
import _ from 'underscore';
import request from 'request';
import najax from 'najax';

var spawn = require('child_process').spawn;
var sonos = require('sonos');

function handleError (err) {
  console.error('ERROR: ' + err.message)
  process.exit(1)
}

function sleep(timeout) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, timeout);
  });
}

const app = {
  run: async function() {
    await this.startSonosServer();
    const zones = await this.getZones();
    const zoneId = await this.chooseZone(zones);
    console.log(zoneId);
  },

  getZones: async function() {
    const promise = new Promise(function(resolve, reject) {
      najax.get('http://localhost:5005/zones', function(response) {
        const parsedResponse = JSON.parse(response);
        const zones = [];
        for (const entry of parsedResponse) {
          zones.push(entry.members[0]);
        }
        resolve(zones);
      });
    });

    return promise;
  },

  chooseZone: async function(zones) {
    var fzfInput = '';
    zones.forEach(function(zone, index) {
      fzfInput += `${index}: ${zone.roomName}\n`;
    });

    const result = await this.startFzf(fzfInput);
    const index = result.split(':')[0];
    const zone = zones[index];
    return zone.uuid;
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
  },

  startSonosServer: async function() {
    const sonosServer = spawn('node ~/dev/node-sonos-http-api/server.js', {
      stdio: ['inherit', 'pipe', 'ignore'],
      shell: true
    });

    sonosServer.stdout.setEncoding('utf-8');

    const promise = new Promise(function(resolve) {
      sonosServer.stdout.on('readable', () => {
        const value = sonosServer.stdout.read();
        if (value && value.includes('listening')) {
          // TODO: why is this necessary?
          await sleep(1000);
          resolve();
        }
      });
    });
  }
};

app.run();
