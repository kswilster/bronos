require('babel-polyfill');
import _ from 'underscore';
import Utils from './utils';
import program from 'commander';

var os = require('os');
var fs = require('fs');
var spawn = require('child_process').spawn;

process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}`);
});

function handleError (err) {
  console.log(err);
  exit();
}

function exit() {
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
    await Utils.startSonosServer();
    var zones = [];

    try {
      zones = await Utils.getZones();
    } catch (e) {
      handleError(e);
    }
    const zone = await this.chooseZone(zones);

    Utils.config.zone = zone;
    console.log(`Switched to zone: ${zone.roomName}`);
    process.exit(1);
  },

  chooseZone: async function(zones) {
    var fzfInput = '';
    zones.forEach(function(zone, index) {
      fzfInput += `${index}: ${zone.roomName}\n`;
    });

    const result = await Utils.startFzf(fzfInput);
    const index = result.split(':')[0];
    const zone = zones[index];
    return zone;
  }
};

// completely custom help
if( process.argv.indexOf( '-h' ) !== -1 || process.argv.indexOf( '--help' ) !== -1 ) {
	const position = process.argv.indexOf( '-h' ) !== -1 ? process.argv.indexOf( '-h' ) : process.argv.indexOf( '--help' );

	process.argv.splice( position, 1 );
  console.log('');
  console.log('  Usage: bronos use');
  console.log('');
  console.log('  Select a Sonos Controller to use');
  exit();
}

program.parse(process.argv);
app.run();
