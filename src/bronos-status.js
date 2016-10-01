require('babel-polyfill');
import _ from 'underscore';

var os = require('os');
var fs = require('fs');
var sonos = require('sonos');

process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}`);
});

function handleError (err) {
  console.error('ERROR: ' + err);
  exit();
}

function sleep(timeout) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, timeout);
  });
}

// TODO: update config from sonos player
// TODO: validate config structure?
// TODO: node-image-to-ascii for album art

// NOTE: repeat (all, none, one?)
// NOTE: shuffle: true/false
// NOTE: crossFade: true/false
const app = {
  run: async function() {
    var config;

    try {
      config = await this.readConfig();
    } catch (e) {
      console.log(e);
      console.log('failed to read sonos data');
      return;
    }

    const zone = config.zone;
    const playbackStateIcon = (zone.state.playbackState === 'STOPPED') ? '❙❙' : '►';
    const artist = zone.state.currentTrack.artist;
    const track = zone.state.currentTrack.title;
    const shuffleState = zone.state.playMode.shuffle ? 'ON' : 'OFF';
    const crossfadeState = zone.state.playMode.crossfade ? 'ON' : 'OFF';
    const repeatState = zone.state.playMode.repeat.toUpperCase();

    const playbackStateText = `${playbackStateIcon} ${track} - ${artist}`;
    const volumeText = `Volume: ${zone.state.volume}`;
    const shuffleText = `Shuffle: ${shuffleState}`;
    const crossfadeText = `Crossfade: ${crossfadeState}`;
    const repeatText = `Repeat: ${repeatState}`;

    console.log(zone.roomName);
    if (track && track.length) {
      console.log(`\t${playbackStateText}`);
    } else {
      console.log('\tNo song playing');
    }
    console.log(`\t${volumeText}`);
    console.log(`\t${shuffleText}`);
    console.log(`\t${repeatText}`);
    console.log(`\t${crossfadeText}`);
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
};

app.run();
