require('babel-polyfill');
import _ from 'underscore';
import request from 'request';
import najax from 'najax';

var os = require('os');
var fs = require('fs');
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
    // TODO: why is this necessary?
    await sleep(1000);

    const zones = await this.getZones();
    const zone = await this.chooseZone(zones);

    const config = await this.readConfig();
    await this.writeConfig({ ...config, zone });
    
    process.exit();
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
          resolve();
        }
      });
    });
    return promise;
  },

  readConfig: async function() {
    const promise = new Promise(function(resolve, reject) {
      fs.readFile(`${os.homedir()}/.bronos`, (err, data) => {
        resolve(JSON.parse(data));
      });
    });

    return promise;
  },

  writeConfig: async function(data) {
    const promise = new Promise(function(resolve, reject) {
      fs.writeFile(`${os.homedir()}/.bronos`, JSON.stringify(data), (err) => {
        if (err) console.log(err);
        resolve();
      });
    });

    return promise;
  }
};

app.run();
