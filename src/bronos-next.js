require('babel-polyfill');
import Utils from './utils';

function run() {
  const currentZone = Utils.config.zone;
  Utils.next(currentZone.roomName);
}

run();
