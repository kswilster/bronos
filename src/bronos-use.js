require('babel-polyfill');
import _ from 'underscore';
import request from 'request';
import najax from 'najax';

var os = require('os');
var fs = require('fs');
var spawn = require('child_process').spawn;
var sonos = require('sonos');
var sonosServer;

process.on('uncaughtException', (err) => {
  sonosServer && sonosServer.kill('SIGKILL');
  fs.writeSync(1, `Caught exception: ${err}`);
});

function handleError (err) {
  console.error('ERROR: ' + err);
  process.exit(1);
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

    var config;
    try {
      config = await this.readConfig();
    } catch (e) {
      config = {};
    }

    await this.writeConfig({ ...config, zone });

    sonosServer.kill('SIGKILL');
    process.exit(1);
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
    const promise = new Promise(function(resolve) {
      // TODO: spawn this from node_modules directory for portability
      sonosServer = spawn('node ~/dev/node-sonos-http-api/server.js', {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
      });

      var lastError;

      // shutdown sonosServer if it is not available after 10 seconds
      const timeout = setTimeout(() => {
        sonosServer.kill('SIGKILL');
        console.log('failed to start sonos server');
      }, 3000);

      sonosServer.on('exit', (code, signal) => {
        console.log('sonos server shut down');
        console.log(lastError);
        clearTimeout(timeout);
        return;
      });

      sonosServer.stdout.setEncoding('utf-8');
      sonosServer.stderr.setEncoding('utf-8');

      sonosServer.stdout.on('readable', () => {
        const value = sonosServer.stdout.read();
        if (value && value.includes('listening')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      sonosServer.stderr.on('readable', () => {
        const err = sonosServer.stderr.read();
        if (err && err.length) {
          lastError = err;
        }
      });
    });

    return promise;
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

  writeConfig: async function(data) {
    const promise = new Promise(function(resolve, reject) {
      fs.writeFile(`${os.homedir()}/.bronos`, JSON.stringify(data), (err) => {
        if (err) handleError(err);
        resolve();
      });
    });

    return promise;
  }
};

app.run();
