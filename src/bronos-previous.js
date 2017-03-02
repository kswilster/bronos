require('babel-polyfill');
var program = require('commander');
import Utils from './utils';

function run() {
  const currentZone = Utils.config.zone;
  Utils.previous(currentZone.roomName);
}

run();
