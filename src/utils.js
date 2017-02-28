require('babel-polyfill');

import najax from 'najax';
import axios from 'axios';

var path = require('path');
var webroot = path.resolve(__dirname, 'static');
var fs = require('fs');
var os = require('os');

var { spawn, exec, execSync } = require('child_process');
var Preferences = require('preferences');

process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}`);
});

const APP_ID = 'com.lintcondition.bronos';
const SONOS_SERVER_PORT = '5005';

const Utils = {

  getCurrentZone: async function() {
    await this.startSonosServer();
    const config = await this.readConfig();
    const zone = await this.getZone(config.zone.roomName);

    if (zone) {
      return zone;
    } else {
      console.log('No zones found');
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

  getZones: async function() {
    const url = 'http://localhost:5005/zones';
    const zones = [];

    try {
      const { data } = await axios.get(url);
      for (const entry of data) {
        // TODO: might not be members I want, look into grouped controllers...
        zones.push(entry.members[0]);
      }

      return zones;
    } catch (error) {
      this.handleAxiosError(error);
    }
  },

  getZone: async function(zoneName) {
    const zones = await this.getZones();
    return zones.find((zone) => { return zone.roomName === zoneName });
  },

  getQueue: async function(zoneName) {
    const url = encodeURI(`http://localhost:5005/${zoneName}/queue`);
    const response = await axios.get(url);
    return response.data;
  },

  say: async function(zoneName, message) {
    const url = encodeURI(`http://localhost:5005/${zoneName}/say/${message}`);
    return axios.get(url);
  },

  reorderTracksInQueue: async function(zoneName, startIndex, numberOfTracks, insertBefore) {
    // Sonos API is indexed at 1, that's no fun
    insertBefore++;
    const url = encodeURI(`http://localhost:5005/${zoneName}/reorder/${startIndex}/${numberOfTracks}/${insertBefore}`);
    console.log(url);
    return axios.get(url);
  },

  queueTrack: async function(zoneName, trackId, index) {
    // Sonos API is indexed at 1, that's no fun
    index++;

    const promise = new Promise(function(resolve, reject) {

      const baseUrl = `http://localhost:5005/${zoneName}/spotify/queue/spotify:track:${trackId}`;
      const indexParam = index ? `/${index}` : '';
      const url = encodeURI(`${baseUrl}${indexParam}`);

      axios.get(url, function() {
        resolve();
      });
    });

    return promise;
  },

  startSonosServer: async function() {
    // TODO: ensure this method is idempotent
    // TODO: use webhook to determine that the sonos server is ready (for now just sleeping)

    if (!this.isSonosServerRunning()) {
      const sonosServerPath = path.normalize(`${__dirname}/../node_modules/sonos-http-api/server.js`);
      const server = spawn(process.argv[0], [sonosServerPath], {
        detached: true,
        stdio: 'ignore'
      });

      server.unref();
      await this.sleep(1000);

      if (!this.isSonosServerRunning()) {
        console.error('Failed to start sonos server');
        process.exit();
      }
    }
    console.log('sonos server started');
  },

  isSonosServerRunning() {
    // TODO: be more discerning with identifying the sonos server process
    const openNetworkFiles = execSync(`lsof -i -n -P`).toString();
    const serverRunning = openNetworkFiles.match(/:5005\b/);
    return serverRunning;
  },

  wipStartSonosServer: async function() {
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
  },

  handleAxiosError: function(error) {
    if (error && error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      const errorMessage = error.response.data.error;
      console.error(`${status}: ${statusText}`);
      console.error(errorMessage);
    }

    process.exit();
  },
};

export default Utils;
