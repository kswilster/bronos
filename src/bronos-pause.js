require('babel-polyfill');
import Utils from './utils';

function run() {
  const currentZone = Utils.config.zone;
  Utils.pause(currentZone.roomName);
}

run();
