require('babel-polyfill');
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
const SPOTIFY_ACCESS_TOKEN_URL = 'https://oka1hz3dtb.execute-api.us-east-1.amazonaws.com/prod/spotifyAccessToken';
const SONOS_SERVER_PORT = '5005';

const Utils = {

  _config: null,

  get config() {
    this._config = this._config || new Preferences('com.lintcondition.bronos', {});
    return this._config;
  },

  getCurrentZone: async function() {
    await this.startSonosServer();

    if (this.config.zone) {
      const zone = await this.getZone(this.config.zone.roomName);
      if (zone) {
        return zone;
      } else {
        return Promise.reject('No zones found');
      }
    } else {
      return Promise.reject('No zone selected');
    }
  },

  sleep(timeout) {
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve();
      }, timeout);
    });
  },


  pollCondition: async function(callback, {
    maxTries = 50,
    interval = 50,
    message,
  } = {}) {

    for (let tries = 0; tries < maxTries; tries++) {
      const result = callback();
      if (result) {
        return result;
      } else {
        await this.sleep(interval);
      }
    }

    throw new Error(`Condition failed to come true${message ? `: ${message}` : ''}`);
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

  getSpotifyAccessToken: async function() {
    try {
      const response = await axios.get(SPOTIFY_ACCESS_TOKEN_URL);
      return response.data.body['access_token'];
    } catch (e) {
      console.log(e.stack);
    }
  },

  // TODO: use zones/:zoneName/state
  getZone: async function(zoneName) {
    const zones = await this.getZones();
    return zones.find((zone) => { return zone.roomName === zoneName });
  },

  getQueue: async function(zoneName) {
    const url = encodeURI(`http://localhost:5005/${zoneName}/queue`);
    const response = await axios.get(url);
    return response.data;
  },

  next: async function(zoneName) {
    const url = encodeURI(`http://localhost:5005/${zoneName}/next`);
    return axios.get(url);
  },

  previous: async function(zoneName) {
    const url = encodeURI(`http://localhost:5005/${zoneName}/previous`);
    return axios.get(url);
  },

  play: async function(zoneName) {
    const url = encodeURI(`http://localhost:5005/${zoneName}/play`);
    return axios.get(url);
  },

  pause: async function(zoneName) {
    const url = encodeURI(`http://localhost:5005/${zoneName}/pause`);
    return axios.get(url);
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

  playTrack: function(zoneName, trackId) {
    const url = `http://localhost:5005/${zoneName}/spotify/now/spotify:track:${trackId}`;
    return axios.get(url);
  },

  playTrackNext: function(zoneName, trackId) {
    const url = `http://localhost:5005/${zoneName}/spotify/next/spotify:track:${trackId}`;
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

      try {
        await this.pollCondition(this.isSonosServerRunning, { message: 'Failed to start sonos server' });
      } catch (e) {
        console.error('Failed to start sonos server');
        process.exit();
      }
    }
  },

  // select the queue for use (as opposed to a playlist, line-in, or nothing)
  selectQueue: async function({ roomName, uuid }) {
    // TODO: how can we determine if a queue has been selected so we don't do this all the time?
    // NOTE: this is a pretty harmless, seemingly idempotent action
    if (!uuid || !roomName) {
      console.error('no zone provided!');
      return
    }
    const url = encodeURI(`http://localhost:5005/${roomName}/setavtransporturi/x-rincon-queue:${uuid}#0`);
    return axios.get(url);
  },

  isSonosServerRunning() {
    // TODO: be more discerning with identifying the sonos server process
    const openNetworkFiles = execSync(`lsof -i -n -P`).toString();
    const serverRunning = !!openNetworkFiles.match(/:5005\b/);
    return serverRunning;
  },

  zonesDetected() {
    // TODO: check for succesful zones request to determine if they've been discovered
    // this will be used to poll during startSonosServer
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
